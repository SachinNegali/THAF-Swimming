/**
 * useKeyManagement — React Query hooks for E2EE key lifecycle
 *
 * Handles key bundle upload, pre-key replenishment, and initialization
 * of the E2EE crypto system on app startup.
 */

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { CryptoService } from '@/lib/crypto';
import type {
    PublicKeyBundle,
    ReplenishPreKeysRequest,
    UploadKeyBundleRequest,
} from '@/types/e2ee';
import { useMutation, useQuery } from '@tanstack/react-query';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const e2eeQueryKeys = {
  all: ['e2ee'] as const,
  keyBundle: (userId: string) => [...e2eeQueryKeys.all, 'keyBundle', userId] as const,
  preKeyCount: () => [...e2eeQueryKeys.all, 'preKeyCount'] as const,
  initialized: () => [...e2eeQueryKeys.all, 'initialized'] as const,
};

// ─── Initialize E2EE ─────────────────────────────────────────────────────────

/**
 * Hook to initialize the E2EE system on app startup.
 * Loads or generates keys, and uploads the key bundle if new.
 *
 * Should be called once after authentication succeeds.
 */
export function useInitializeE2EE() {
  return useMutation({
    mutationFn: async () => {
      const result = await CryptoService.initialize();

      // If new keys were generated, upload the bundle to server
      if (result.isNew && result.uploadRequest) {
        await apiClient.post(endpoints.keys.uploadBundle, result.uploadRequest);
      }

      // Check if key rotation is needed
      const rotationRequest = await CryptoService.checkKeyRotation();
      if (rotationRequest) {
        await apiClient.post(endpoints.keys.uploadBundle, rotationRequest);
      }

      // Check pre-key replenishment
      const replenishment = await CryptoService.checkPreKeyReplenishment();
      if (replenishment.needed && replenishment.newKeys) {
        const request: ReplenishPreKeysRequest = {
          deviceId: replenishment.deviceId!,
          oneTimePreKeys: replenishment.newKeys,
        };
        await apiClient.post(endpoints.keys.replenishPreKeys, request);
      }

      return {
        deviceId: result.deviceId,
        isNew: result.isNew,
      };
    },
  });
}

// ─── Fetch Key Bundle ────────────────────────────────────────────────────────

/**
 * Hook to fetch a remote user's public key bundle (for starting an E2EE session).
 *
 * @param userId - The user ID to fetch the key bundle for
 * @param enabled - Whether the query is enabled (set false until you need it)
 */
export function useKeyBundle(userId: string, enabled = false) {
  return useQuery({
    queryKey: e2eeQueryKeys.keyBundle(userId),
    queryFn: async () => {
      const response = await apiClient.get<PublicKeyBundle>(
        endpoints.keys.fetchBundle(userId)
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Upload Key Bundle ───────────────────────────────────────────────────────

/**
 * Mutation to upload/update the local key bundle on the server.
 */
export function useUploadKeyBundle() {
  return useMutation({
    mutationFn: async (request: UploadKeyBundleRequest) => {
      const response = await apiClient.post(
        endpoints.keys.uploadBundle,
        request
      );
      return response.data;
    },
  });
}

// ─── Pre-Key Status ──────────────────────────────────────────────────────────

/**
 * Hook to check the server-side pre-key count.
 * If the count falls below a threshold, trigger replenishment.
 */
export function usePreKeyCount() {
  return useQuery({
    queryKey: e2eeQueryKeys.preKeyCount(),
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(
        endpoints.keys.preKeyCount
      );
      return response.data.count;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Mutation to replenish one-time pre-keys on the server.
 */
export function useReplenishPreKeys() {
  return useMutation({
    mutationFn: async () => {
      const result = await CryptoService.checkPreKeyReplenishment();
      if (!result.needed || !result.newKeys) {
        return { replenished: false };
      }

      const request: ReplenishPreKeysRequest = {
        deviceId: result.deviceId!,
        oneTimePreKeys: result.newKeys,
      };

      await apiClient.post(endpoints.keys.replenishPreKeys, request);
      return { replenished: true, count: result.newKeys.length };
    },
  });
}

// ─── Wipe Keys ───────────────────────────────────────────────────────────────

/**
 * Mutation to wipe all E2EE keys and session data.
 * Use on logout or account deletion.
 */
export function useWipeE2EE() {
  return useMutation({
    mutationFn: async () => {
      await CryptoService.wipeAll();
    },
  });
}
