/**
 * Upload Manager
 *
 * Orchestrates the full image upload pipeline:
 *   pick → persist record → request presigned URL → upload to S3 → /complete
 *
 * Uses expo-file-system's createUploadTask for progress-tracked uploads.
 * Designed for the Expo managed workflow (no native background uploader).
 */

import { completeUpload, initUpload } from '@/lib/api/mediaApi';
import { updateUpload } from '@/stores/uploadStore';
import type { UploadRecord } from '@/types/upload';
import {
  createUploadTask,
  getInfoAsync,
  FileSystemUploadType,
  FileSystemSessionType,
} from 'expo-file-system/legacy';

import { emitUploadProgress } from './uploadEvents';

// ─── Concurrency + retry control ────────────────────────
const CONCURRENT_UPLOADS = 3;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class UploadFailure extends Error {
  constructor(message: string, public retriable: boolean) {
    super(message);
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ─── Public API ─────────────────────────────────────────

/**
 * Process a batch of upload records through the full pipeline.
 * Limits concurrent presign+upload requests to CONCURRENT_UPLOADS.
 */
export async function processUploadQueue(uploads: UploadRecord[]): Promise<void> {
  const chunks = chunkArray(uploads, CONCURRENT_UPLOADS);
  for (const chunk of chunks) {
    await Promise.all(chunk.map((u) => runUploadWithRetry(u)));
  }
}

/**
 * Retry a single failed upload from scratch (UI tap-to-retry).
 * Resets attempts to 0 — init is idempotent per imageId, so a duplicate
 * post-completion retry just returns `alreadyComplete`.
 */
export async function restartUploadFromScratch(upload: UploadRecord): Promise<void> {
  const fileInfo = await getInfoAsync(upload.localUri).catch(() => null);
  if (!fileInfo?.exists) {
    updateUpload(upload.imageId, { status: 'failed', error: 'local_file_deleted' });
    return;
  }
  updateUpload(upload.imageId, { retryCount: 0, error: null, status: 'queued' });
  await runUploadWithRetry({ ...upload, retryCount: 0 });
}

// ─── Retry-with-backoff wrapper ─────────────────────────

async function runUploadWithRetry(initial: UploadRecord): Promise<void> {
  let attempt = 0;
  let current = initial;
  while (attempt < MAX_ATTEMPTS) {
    try {
      await runUploadOnce(current);
      return;
    } catch (err) {
      const retriable = err instanceof UploadFailure ? err.retriable : true;
      const message = err instanceof Error ? err.message : String(err);
      attempt += 1;

      if (!retriable || attempt >= MAX_ATTEMPTS) {
        updateUpload(current.imageId, {
          status: 'failed',
          error: message,
          retryCount: attempt,
        });
        return;
      }

      const delay = BACKOFF_BASE_MS * 2 ** attempt;
      updateUpload(current.imageId, {
        status: 'queued',
        error: `${message} (retrying in ${Math.round(delay / 1000)}s)`,
        retryCount: attempt,
      });
      await sleep(delay);
      current = { ...current, retryCount: attempt };
    }
  }
}

// ─── Internal pipeline steps ────────────────────────────

/**
 * One full attempt: init → PUT → complete.
 * Throws `UploadFailure` for transient errors (triggers retry) or for
 * terminal ones (e.g. missing local file) with retriable=false.
 */
async function runUploadOnce(upload: UploadRecord): Promise<void> {
  updateUpload(upload.imageId, { status: 'requesting-url', error: null });

  const response = await initUpload({
    chatId: upload.chatId,
    messageId: upload.messageId,
    imageId: upload.imageId,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
  }).catch((e) => {
    throw new UploadFailure(e?.message ?? 'init_failed', true);
  });

  if (response.alreadyComplete) {
    updateUpload(upload.imageId, {
      status: 'completed',
      thumbnailUrl: response.thumbnailUrl ?? null,
      optimizedUrl: response.optimizedUrl ?? null,
    });
    return;
  }

  updateUpload(upload.imageId, {
    presignedUrl: response.presignedUrl,
    s3Key: response.s3Key,
    status: 'uploading',
  });

  await putToS3({
    ...upload,
    presignedUrl: response.presignedUrl,
    s3Key: response.s3Key,
  });

  updateUpload(upload.imageId, { status: 'completing' });
  emitUploadProgress(upload.imageId, 100);

  const result = await completeUpload({ imageId: upload.imageId }).catch((e) => {
    // File IS in S3 — reconciler will pick this up. Still retry within this
    // attempt cycle in case /complete was briefly unreachable.
    throw new UploadFailure(
      'complete_call_failed: ' + (e?.message ?? ''),
      true,
    );
  });

  if (result.status === 'completed') {
    updateUpload(upload.imageId, {
      status: 'completed',
      thumbnailUrl: result.thumbnailUrl ?? null,
      optimizedUrl: result.optimizedUrl ?? null,
    });
  } else {
    // Server is generating thumbnails — SSE will flip us to completed.
    updateUpload(upload.imageId, { status: 'completing' });
  }
}

async function putToS3(upload: UploadRecord): Promise<void> {
  if (!upload.presignedUrl) {
    throw new UploadFailure('no_presigned_url', false);
  }

  emitUploadProgress(upload.imageId, 0);

  const uploadTask = createUploadTask(
    upload.presignedUrl,
    upload.localUri,
    {
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      httpMethod: 'PUT',
      headers: { 'Content-Type': upload.mimeType },
      sessionType: FileSystemSessionType.BACKGROUND,
    },
    (progress) => {
      const pct = Math.round(
        (progress.totalBytesSent / progress.totalBytesExpectedToSend) * 100,
      );
      emitUploadProgress(upload.imageId, pct);
    },
  );

  const result = await uploadTask.uploadAsync().catch((e) => {
    throw new UploadFailure(e?.message ?? 'upload_failed', true);
  });

  if (!result || result.status < 200 || result.status >= 300) {
    throw new UploadFailure(
      `S3 returned ${result?.status ?? 'unknown'}`,
      true,
    );
  }
}
