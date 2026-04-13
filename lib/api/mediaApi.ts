/**
 * Media Upload API
 * Wraps the presigned-URL upload flow endpoints.
 */

import type {
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadInitResponse,
  UploadStatusResponse,
} from '@/types/upload';

import { apiClient } from './client';
import { endpoints } from './endpoints';

/**
 * Request a presigned S3 PUT URL for a single image.
 * Server creates the upload record and returns the URL + s3Key.
 * If the imageId was already uploaded (idempotent retry), returns `alreadyComplete`.
 */
export async function initUpload(data: UploadInitRequest): Promise<UploadInitResponse> {
  const response = await apiClient.post<{ data: UploadInitResponse }>(
    endpoints.media.uploadInit,
    data,
  );
  return response.data.data;
}

/**
 * Tell the server that the S3 PUT succeeded.
 * Server validates the file exists in S3, then enqueues a processing job.
 */
export async function completeUpload(data: UploadCompleteRequest): Promise<UploadCompleteResponse> {
  const response = await apiClient.post<{ data: UploadCompleteResponse; success: boolean }>(
    endpoints.media.uploadComplete,
    data,
  );
  return response.data.data;
}

/**
 * Check the status of a single upload.
 */
export async function getUploadStatus(imageId: string): Promise<UploadStatusResponse> {
  const response = await apiClient.get<{ data: UploadStatusResponse }>(
    endpoints.media.uploadStatus(imageId),
  );
  return response.data.data;
}

/**
 * Batch-check upload statuses — used during app-relaunch reconciliation.
 * Returns a map of imageId → status.
 */
export async function batchUploadStatus(
  imageIds: string[],
): Promise<Record<string, UploadStatusResponse>> {
  const response = await apiClient.post<{ data: Record<string, UploadStatusResponse> }>(
    endpoints.media.uploadStatusBatch,
    { imageIds },
  );
  return response.data.data;
}
