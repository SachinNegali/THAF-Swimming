/**
 * Upload Reconciler
 *
 * Runs on every app launch, foreground, and SSE reconnect.
 * Compares local upload records with server state and resumes
 * or completes any uploads that were interrupted.
 */

import { batchUploadStatus, completeUpload } from '@/lib/api/mediaApi';
import { getUploadsByStatus, updateUpload } from '@/stores/uploadStore';
import type { UploadRecord } from '@/types/upload';
import { getInfoAsync } from 'expo-file-system/legacy';

import { restartUploadFromScratch } from './UploadManager';

const MAX_RETRIES = 5;

/**
 * Main reconciliation entry point.
 * Call after app launch, foreground resume, and SSE reconnect.
 */
export async function reconcilePendingUploads(): Promise<void> {
  const pending = getUploadsByStatus([
    'queued',
    'requesting-url',
    'uploading',
    'completing',
    'failed',
  ]);

  if (pending.length === 0) return;

  // Batch-check server status
  const imageIds = pending.map((u) => u.imageId);
  let serverStatuses: Record<string, any>;
  try {
    serverStatuses = await batchUploadStatus(imageIds);
  } catch {
    console.warn('[reconcile] Server unreachable, will retry on next foreground');
    return;
  }

  for (const upload of pending) {
    const server = serverStatuses[upload.imageId];

    // Server says completed
    if (server?.status === 'completed') {
      updateUpload(upload.imageId, {
        status: 'completed',
        thumbnailUrl: server.thumbnailUrl ?? null,
        optimizedUrl: server.optimizedUrl ?? null,
        width: server.width ?? null,
        height: server.height ?? null,
      });
      continue;
    }

    // Server says processing — just wait for SSE
    if (server?.status === 'processing' || server?.status === 'uploaded') {
      updateUpload(upload.imageId, { status: 'completing' });
      continue;
    }

    // Server doesn't have it or it failed — handle by local status
    await reconcileSingleUpload(upload);
  }
}

async function reconcileSingleUpload(upload: UploadRecord): Promise<void> {
  switch (upload.status) {
    case 'queued':
    case 'requesting-url':
      // Never got a presigned URL — restart from scratch
      await restartUploadFromScratch(upload);
      break;

    case 'uploading':
      // Started upload but don't know if it reached S3
      if (await fileExistsOnDevice(upload.localUri)) {
        await restartUploadFromScratch(upload);
      } else {
        markPermanentlyFailed(upload, 'local_file_deleted');
      }
      break;

    case 'completing':
      // File reached S3 but /complete wasn't called
      try {
        const result = await completeUpload({ imageId: upload.imageId });
        if (result.status === 'completed') {
          updateUpload(upload.imageId, {
            status: 'completed',
            thumbnailUrl: result.thumbnailUrl ?? null,
            optimizedUrl: result.optimizedUrl ?? null,
          });
        }
      } catch {
        // Will retry on next reconciliation cycle
      }
      break;

    case 'failed':
      // Previously failed — retry if file still exists and under max retries
      if (upload.retryCount < MAX_RETRIES && (await fileExistsOnDevice(upload.localUri))) {
        await restartUploadFromScratch(upload);
      }
      break;
  }
}

async function fileExistsOnDevice(uri: string): Promise<boolean> {
  try {
    const info = await getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

function markPermanentlyFailed(upload: UploadRecord, reason: string): void {
  updateUpload(upload.imageId, { status: 'failed', error: reason });
}
