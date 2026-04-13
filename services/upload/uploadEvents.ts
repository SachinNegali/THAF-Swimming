/**
 * Upload Progress Event Bus
 *
 * Lightweight emitter so UI components can subscribe to per-image
 * progress updates without polling or passing callbacks through
 * the upload pipeline.
 */

type ProgressCallback = (progress: number) => void;

const listeners = new Map<string, Set<ProgressCallback>>();

/**
 * Emit a progress update for a specific imageId.
 * Called from the upload task's progress callback.
 */
export function emitUploadProgress(imageId: string, progress: number): void {
  listeners.get(imageId)?.forEach((cb) => cb(progress));
}

/**
 * Subscribe to progress updates for a specific imageId.
 * Returns an unsubscribe function.
 */
export function onUploadProgress(imageId: string, callback: ProgressCallback): () => void {
  if (!listeners.has(imageId)) {
    listeners.set(imageId, new Set());
  }
  listeners.get(imageId)!.add(callback);

  return () => {
    const set = listeners.get(imageId);
    if (set) {
      set.delete(callback);
      if (set.size === 0) listeners.delete(imageId);
    }
  };
}
