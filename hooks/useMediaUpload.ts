/**
 * useMediaUpload
 *
 * Hook that exposes image picking and the send-with-images flow
 * for the ChatInput component. Handles:
 * - Launching the image picker
 * - Creating upload records
 * - Injecting an optimistic message into React Query cache
 * - Kicking off the upload pipeline
 */

import { processUploadQueue } from '@/services/upload/UploadManager';
import { getUploadsByMessage, saveUpload, subscribeUploadStore } from '@/stores/uploadStore';
import { store } from '@/store';
import type { MediaAttachment, UploadRecord } from '@/types/upload';
import * as Crypto from 'expo-crypto';
import { getInfoAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useSyncExternalStore } from 'react';

export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize?: number;
}

/**
 * Subscribe to upload records for a specific messageId.
 * Returns MediaAttachment[] that drives the UI overlays.
 */
export function useMessageUploads(messageId: string | undefined): MediaAttachment[] {
  const uploads = useSyncExternalStore(
    subscribeUploadStore,
    () => (messageId ? getUploadsByMessage(messageId) : []),
  );

  return uploads.map((u) => ({
    imageId: u.imageId,
    localUri: u.localUri,
    status: u.status,
    progress: 0, // real-time progress comes from useUploadProgress per-image
    thumbnailUrl: u.thumbnailUrl,
    optimizedUrl: u.optimizedUrl,
    width: u.width,
    height: u.height,
    error: u.error,
  }));
}

/**
 * Launch the system image picker and return selected images.
 */
export async function pickImages(): Promise<SelectedImage[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.8,
    exif: false,
  });

  if (result.canceled || !result.assets?.length) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileSize: asset.fileSize,
  }));
}

/**
 * Create upload records for selected images, persist them,
 * and start the upload pipeline. Returns the messageId and records.
 */
export async function startImageUploads(
  chatId: string,
  selectedImages: SelectedImage[],
): Promise<{ messageId: string; records: UploadRecord[] }> {
  const messageId = Crypto.randomUUID();

  const records = await Promise.all(
    selectedImages.map(async (image) => {
      const imageId = Crypto.randomUUID();
      let fileSize = image.fileSize ?? 0;
      if (!fileSize) {
        try {
          const info = await getInfoAsync(image.uri);
          fileSize = (info as any).size ?? 0;
        } catch {
          fileSize = 0;
        }
      }

      const record: UploadRecord = {
        imageId,
        messageId,
        chatId,
        localUri: image.uri,
        s3Key: null,
        status: 'queued',
        presignedUrl: null,
        thumbnailUrl: null,
        optimizedUrl: null,
        width: image.width || null,
        height: image.height || null,
        retryCount: 0,
        createdAt: Date.now(),
        error: null,
        mimeType: image.mimeType || 'image/jpeg',
        sizeBytes: fileSize,
      };

      saveUpload(record);
      return record;
    }),
  );

  // Fire and forget — the pipeline updates the store as it progresses
  processUploadQueue(records).catch((e) =>
    console.warn('[useMediaUpload] Queue processing error:', e),
  );

  return { messageId, records };
}
