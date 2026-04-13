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
import { getUpload, saveUpload, updateUpload } from '@/stores/uploadStore';
import type { UploadRecord } from '@/types/upload';
import {
  createUploadTask,
  getInfoAsync,
  FileSystemUploadType,
  FileSystemSessionType,
} from 'expo-file-system/legacy';

import { emitUploadProgress } from './uploadEvents';

// ─── Concurrency control ────────────────────────────────
const CONCURRENT_UPLOADS = 3;

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
    await Promise.all(chunk.map(requestPresignedUrlAndUpload));
  }
}

/**
 * Retry a single failed upload from scratch.
 */
export async function restartUploadFromScratch(upload: UploadRecord): Promise<void> {
  try {
    const fileInfo = await getInfoAsync(upload.localUri);
    if (!fileInfo.exists) {
      updateUpload(upload.imageId, { status: 'failed', error: 'local_file_deleted' });
      return;
    }

    const response = await initUpload({
      chatId: upload.chatId,
      messageId: upload.messageId,
      imageId: upload.imageId,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
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
      retryCount: (upload.retryCount || 0) + 1,
      error: null,
    });

    await startS3Upload({
      ...upload,
      presignedUrl: response.presignedUrl,
      s3Key: response.s3Key,
    });
  } catch (error: any) {
    updateUpload(upload.imageId, {
      status: 'failed',
      error: error.message ?? 'restart_failed',
    });
  }
}

// ─── Internal pipeline steps ────────────────────────────

async function requestPresignedUrlAndUpload(upload: UploadRecord): Promise<void> {
  try {
    updateUpload(upload.imageId, { status: 'requesting-url' });

    const response = await initUpload({
      chatId: upload.chatId,
      messageId: upload.messageId,
      imageId: upload.imageId,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
    });

    // Server says it's already done (idempotent retry)
    if (response.alreadyComplete) {
      updateUpload(upload.imageId, {
        status: 'completed',
        thumbnailUrl: response.thumbnailUrl ?? null,
        optimizedUrl: response.optimizedUrl ?? null,
      });
      return;
    }

    // Store presigned URL and proceed to upload
    updateUpload(upload.imageId, {
      presignedUrl: response.presignedUrl,
      s3Key: response.s3Key,
    });

    await startS3Upload({
      ...upload,
      presignedUrl: response.presignedUrl,
      s3Key: response.s3Key,
    });
  } catch (error: any) {
    updateUpload(upload.imageId, {
      status: 'failed',
      error: error.message ?? 'init_failed',
    });
  }
}

async function startS3Upload(upload: UploadRecord): Promise<void> {
  if (!upload.presignedUrl) {
    updateUpload(upload.imageId, { status: 'failed', error: 'no_presigned_url' });
    return;
  }

  updateUpload(upload.imageId, { status: 'uploading' });
  emitUploadProgress(upload.imageId, 0);

  try {
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

    const result = await uploadTask.uploadAsync();

    if (result && result.status >= 200 && result.status < 300) {
      // S3 accepted the file — now tell our backend
      updateUpload(upload.imageId, { status: 'completing' });
      emitUploadProgress(upload.imageId, 100);
      await callCompleteEndpoint(upload);
    } else {
      updateUpload(upload.imageId, {
        status: 'failed',
        error: `S3 returned ${result?.status ?? 'unknown'}`,
      });
    }
  } catch (error: any) {
    updateUpload(upload.imageId, {
      status: 'failed',
      error: error.message ?? 'upload_failed',
    });
  }
}

async function callCompleteEndpoint(upload: UploadRecord): Promise<void> {
  try {
    const result = await completeUpload({ imageId: upload.imageId });

    if (result.status === 'completed') {
      updateUpload(upload.imageId, {
        status: 'completed',
        thumbnailUrl: result.thumbnailUrl ?? null,
        optimizedUrl: result.optimizedUrl ?? null,
      });
    } else {
      // status === 'processing' — server is generating thumbnails
      // SSE will notify us when it's done
      updateUpload(upload.imageId, { status: 'completing' });
    }
  } catch (error: any) {
    // /complete failed, but the file IS in S3.
    // Don't mark as 'failed' — keep as 'uploading' so reconciliation retries /complete.
    updateUpload(upload.imageId, {
      status: 'uploading',
      error: 'complete_call_failed: ' + (error.message ?? ''),
    });
  }
}
