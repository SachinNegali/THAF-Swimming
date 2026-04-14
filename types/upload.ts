/**
 * Upload Types
 * Types for the background image upload system.
 */

export type UploadStatus =
  | 'queued'
  | 'requesting-url'
  | 'uploading'
  | 'completing'
  | 'completed'
  | 'failed';

/**
 * Persisted upload record — survives app restarts via AsyncStorage.
 * One record per image. Multiple images share the same messageId.
 */
export interface UploadRecord {
  imageId: string;
  messageId: string;
  chatId: string;
  localUri: string;
  s3Key: string | null;
  status: UploadStatus;
  presignedUrl: string | null;
  thumbnailUrl: string | null;
  optimizedUrl: string | null;
  width: number | null;
  height: number | null;
  retryCount: number;
  createdAt: number;
  error: string | null;
  mimeType: string;
  sizeBytes: number;
}

/**
 * UI-facing attachment derived from an UploadRecord.
 * Used by chat components to render image states.
 */
export interface MediaAttachment {
  imageId: string;
  localUri: string;
  status: UploadStatus;
  progress: number;
  thumbnailUrl: string | null;
  optimizedUrl: string | null;
  width: number | null;
  height: number | null;
  error: string | null;
}

// ─── API types ─────────────────────────────────────────

export interface UploadInitRequest {
  chatId: string;
  messageId: string;
  imageId: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadInitResponse {
  presignedUrl: string;
  s3Key: string;
  alreadyComplete?: boolean;
  thumbnailUrl?: string;
  optimizedUrl?: string;
}

export interface UploadCompleteRequest {
  imageId: string;
}

export interface UploadCompleteResponse {
  status: 'completed' | 'processing';
  thumbnailUrl?: string;
  optimizedUrl?: string;
}

export interface UploadStatusResponse {
  imageId: string;
  status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  optimizedUrl?: string;
  width?: number;
  height?: number;
}

/** SSE payload for upload:status events (uploader only) */
export interface UploadSSEEvent {
  imageId: string;
  messageId: string;
  chatId: string;
  status: 'completed' | 'failed';
  thumbnailUrl?: string;
  optimizedUrl?: string;
  width?: number;
  height?: number;
  allImagesComplete?: boolean;
}

/** SSE payload for message.image_updated events (all group members) */
export interface MessageImageUpdatedSSEEvent {
  messageId: string;
  groupId: string;
  imageId: string;
  image: {
    imageId: string;
    status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
    thumbnailUrl: string | null;
    optimizedUrl: string | null;
    width: number | null;
    height: number | null;
  };
  allComplete?: boolean;
}

/** SSE payload for message.media_ready events (all group members) */
export interface MediaReadySSEEvent {
  messageId: string;
  groupId: string;
  images?: MessageImageUpdatedSSEEvent['image'][];
}
