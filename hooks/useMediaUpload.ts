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
import type { MediaAttachment, UploadRecord } from '@/types/upload';
import * as Crypto from 'expo-crypto';
import { getInfoAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useSyncExternalStore } from 'react';

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
 * Pre-generate imageIds + (optionally) file-size metadata for a batch
 * of picked images. Called BEFORE creating the server message so the
 * client can include `metadata.imageIds` in the POST.
 */
export interface PreparedImage extends SelectedImage {
  imageId: string;
  sizeBytes: number;
}

export async function prepareImages(
  selectedImages: SelectedImage[],
): Promise<PreparedImage[]> {
  return Promise.all(
    selectedImages.map(async (image) => {
      let fileSize = image.fileSize ?? 0;
      if (!fileSize) {
        try {
          const info = await getInfoAsync(image.uri);
          fileSize = (info as any).size ?? 0;
        } catch {
          fileSize = 0;
        }
      }
      return {
        ...image,
        imageId: Crypto.randomUUID(),
        sizeBytes: fileSize,
      };
    }),
  );
}

/**
 * Create upload records for prepared images (server message already exists),
 * persist them, and start the upload pipeline. `messageId` is the server's
 * Message._id returned from POST /group/:id/messages.
 */
export function startImageUploads(
  chatId: string,
  messageId: string,
  prepared: PreparedImage[],
): UploadRecord[] {
  const records: UploadRecord[] = prepared.map((image) => {
    const record: UploadRecord = {
      imageId: image.imageId,
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
      sizeBytes: image.sizeBytes,
    };
    saveUpload(record);
    return record;
  });

  // Fire and forget — the pipeline updates the store as it progresses
  processUploadQueue(records).catch((e) =>
    console.warn('[useMediaUpload] Queue processing error:', e),
  );

  return records;
}
