/**
 * useUploadProgress
 *
 * Subscribes to real-time progress updates for a single image upload.
 * Returns 0–100 while uploading, stays at the last value after completion.
 */

import { onUploadProgress } from '@/services/upload/uploadEvents';
import { useEffect, useState } from 'react';

export function useUploadProgress(imageId: string | null): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!imageId) return;
    setProgress(0);
    return onUploadProgress(imageId, setProgress);
  }, [imageId]);

  return progress;
}
