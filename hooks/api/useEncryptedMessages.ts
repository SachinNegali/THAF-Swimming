/**
 * useEncryptedMessages — React Query hooks for E2EE message sending & receiving
 *
 * Wraps CryptoService to encrypt before send and decrypt after receive.
 * Handles automatic session establishment (X3DH) on first message.
 */

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { CryptoService } from '@/lib/crypto';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
    EncryptedAttachment,
    EncryptedMessagePayload,
    MediaEncryptionEnvelope,
    PublicKeyBundle,
} from '@/types/e2ee';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Server response for an encrypted message */
interface EncryptedMessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  senderDeviceId: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  ciphertext: string;
  ephemeralKey?: string;
  oneTimePreKeyId?: number;
  messageNumber: number;
  previousChainLength: number;
  attachments: EncryptedAttachment[];
  createdAt: string;
}

/** Decrypted message for display */
export interface DisplayMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  content: string;
  attachments: EncryptedAttachment[];
  createdAt: string;
  isEncrypted: true;
}

// ─── Send Encrypted Message ──────────────────────────────────────────────────

interface SendEncryptedMessageParams {
  chatId: string;
  recipientId: string;
  recipientDeviceId: string;
  plaintext: string;
  type?: 'text' | 'image' | 'file' | 'video' | 'audio';
  /** If an image/file, the local URI for media encryption */
  mediaUri?: string;
  mediaMimeType?: string;
}

/**
 * Hook to send an encrypted message.
 *
 * Handles:
 * 1. Fetching recipient key bundle (if no existing session)
 * 2. Media encryption (if the message contains an attachment)
 * 3. Text encryption via Double Ratchet
 * 4. Sending the encrypted payload to the server
 */
export function useSendEncryptedMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendEncryptedMessageParams) => {
      const {
        chatId,
        recipientId,
        recipientDeviceId,
        plaintext,
        type = 'text',
        mediaUri,
        mediaMimeType,
      } = params;

      // 1. Fetch recipient's key bundle if we don't have a session
      let recipientBundle: PublicKeyBundle | undefined;

      // Try to encrypt without a bundle first. If it fails because
      // no session exists, fetch the bundle and retry.
      try {
        // Attempt with cached session
        const result = await CryptoService.encryptDirectMessage(
          recipientId,
          recipientDeviceId,
          plaintext
        );

        // 2. Handle media if present
        let attachments: EncryptedAttachment[] = [];
        if (mediaUri && mediaMimeType) {
          const mediaResult = await CryptoService.encryptMedia(
            mediaUri,
            mediaMimeType
          );

          // Upload encrypted media
          const formData = new FormData();
          formData.append('file', {
            uri: mediaResult.encryptedFilePath,
            type: 'application/octet-stream',
            name: 'encrypted_media.bin',
          } as unknown as Blob);

          const uploadResponse = await apiClient.post<{ url: string }>(
            endpoints.media.upload,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          attachments = [{
            encryptedUrl: uploadResponse.data.url,
            mimeType: mediaMimeType,
            sizeBytes: mediaResult.envelope.sizeBytes,
          }];
        }

        // 3. Send to server
        const payload = {
          ...result.payload,
          type,
          attachments,
        };

        const response = await apiClient.post<EncryptedMessageResponse>(
          endpoints.encryptedMessages.send(chatId),
          payload
        );

        // Invalidate messages list
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.messages(chatId),
        });

        return response.data;
      } catch (error: unknown) {
        // If session not found, fetch key bundle and retry
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'E2E_KEY_BUNDLE_FETCH_FAILED'
        ) {
          const bundleResponse = await apiClient.get<PublicKeyBundle>(
            endpoints.keys.fetchBundle(recipientId)
          );
          recipientBundle = bundleResponse.data;

          const result = await CryptoService.encryptDirectMessage(
            recipientId,
            recipientDeviceId,
            plaintext,
            recipientBundle
          );

          const payload = {
            ...result.payload,
            type,
            attachments: [],
          };

          const response = await apiClient.post<EncryptedMessageResponse>(
            endpoints.encryptedMessages.send(chatId),
            payload
          );

          queryClient.invalidateQueries({
            queryKey: queryKeys.groups.messages(chatId),
          });

          return response.data;
        }

        throw error;
      }
    },
  });
}

// ─── Decrypt Messages ────────────────────────────────────────────────────────

/**
 * Hook to fetch and decrypt messages for a chat.
 *
 * Fetches encrypted messages from the server and decrypts them client-side
 * using the stored E2EE sessions.
 *
 * @param chatId - The chat ID to fetch messages for
 */
export function useEncryptedMessages(chatId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.groups.messages(chatId), 'encrypted'] as const,
    queryFn: async (): Promise<DisplayMessage[]> => {
      // Fetch encrypted messages from server
      const response = await apiClient.get<EncryptedMessageResponse[]>(
        endpoints.encryptedMessages.list(chatId)
      );

      // Decrypt each message
      const decryptedMessages: DisplayMessage[] = [];

      for (const msg of response.data) {
        try {
          const payload: EncryptedMessagePayload = {
            senderDeviceId: msg.senderDeviceId,
            type: msg.type,
            ciphertext: msg.ciphertext,
            ephemeralKey: msg.ephemeralKey,
            oneTimePreKeyId: msg.oneTimePreKeyId,
            messageNumber: msg.messageNumber,
            previousChainLength: msg.previousChainLength,
            attachments: msg.attachments,
          };

          const { plaintext } = await CryptoService.decryptDirectMessage(
            msg.senderId,
            msg.senderDeviceId,
            payload
          );

          decryptedMessages.push({
            id: msg.id,
            chatId,
            senderId: msg.senderId,
            type: msg.type,
            content: plaintext,
            attachments: msg.attachments,
            createdAt: msg.createdAt,
            isEncrypted: true,
          });
        } catch (error) {
          // If decryption fails, show a placeholder
          console.error(`Failed to decrypt message ${msg.id}:`, error);
          decryptedMessages.push({
            id: msg.id,
            chatId,
            senderId: msg.senderId,
            type: msg.type,
            content: '🔒 Unable to decrypt this message',
            attachments: [],
            createdAt: msg.createdAt,
            isEncrypted: true,
          });
        }
      }

      return decryptedMessages;
    },
    enabled: enabled && CryptoService.isInitialized(),
    staleTime: 0, // Always refetch for real-time feel
  });
}

// ─── Group Message Hooks ─────────────────────────────────────────────────────

interface SendGroupMessageParams {
  chatId: string;
  groupId: string;
  plaintext: string;
}

/**
 * Hook to send an encrypted group message.
 */
export function useSendGroupEncryptedMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendGroupMessageParams) => {
      const { chatId, groupId, plaintext } = params;

      const { ciphertext } = await CryptoService.encryptGroupMessage(
        groupId,
        plaintext
      );

      const response = await apiClient.post<EncryptedMessageResponse>(
        endpoints.encryptedMessages.send(chatId),
        {
          ciphertext,
          type: 'text',
          isGroup: true,
        }
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.messages(chatId),
      });

      return response.data;
    },
  });
}

// ─── Decrypt Media ───────────────────────────────────────────────────────────

/**
 * Hook to download and decrypt a media attachment.
 */
export function useDecryptMedia() {
  return useMutation({
    mutationFn: async (params: {
      encryptedUrl: string;
      envelope: MediaEncryptionEnvelope;
    }) => {
      // Download the encrypted file
      const { File, Paths } = await import('expo-file-system');
      const downloadedFile = await File.downloadFileAsync(
        params.encryptedUrl,
        new (await import('expo-file-system')).Directory(Paths.cache, 'e2ee_downloads')
      );

      // Decrypt
      const decryptedPath = await CryptoService.decryptMedia(
        downloadedFile.uri,
        params.envelope
      );

      return decryptedPath;
    },
  });
}
