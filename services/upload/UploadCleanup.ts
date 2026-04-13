/**
 * Upload Cleanup
 *
 * Removes completed upload records and their temp files after 24 hours.
 * Run once on app launch, after reconciliation completes.
 */

import { deleteUpload, getUploadsByStatus } from '@/stores/uploadStore';
import { deleteAsync } from 'expo-file-system/legacy';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function cleanupCompletedUploads(): Promise<void> {
  const completed = getUploadsByStatus(['completed']);
  const cutoff = Date.now() - ONE_DAY_MS;

  for (const upload of completed) {
    if (upload.createdAt < cutoff) {
      // Only delete temp/cache files — leave gallery files alone
      if (
        upload.localUri.includes('cache') ||
        upload.localUri.includes('tmp') ||
        upload.localUri.includes('Cache')
      ) {
        try {
          await deleteAsync(upload.localUri, { idempotent: true });
        } catch {
          // file already gone — fine
        }
      }
      deleteUpload(upload.imageId);
    }
  }
}
