/**
 * RealtimeProvider — Activates SSE + initializes E2EE crypto
 *
 * Place inside the provider tree (after auth). Does not render any UI.
 * - Starts SSE stream when authenticated (auto-fallback to polling)
 * - Initializes CryptoService + uploads key bundle on first run
 * - Runs periodic key rotation / pre-key replenishment checks
 *
 * IMPORTANT: E2EE initialization is done lazily (dynamic import) to prevent
 * native module failures from crashing the entire provider tree.
 */

import { useSSE } from '@/hooks/api/useSSE';
import { selectIsAuthenticated } from '@/store/selectors';
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSelector } from 'react-redux';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

// How often to check key rotation (30 min)
const KEY_CHECK_INTERVAL = 30 * 60 * 1000;

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // ─── SSE ────────────────────────────────────────────────
  const { reconnect } = useSSE(isAuthenticated);

  // Reconnect SSE when app comes back to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated) {
        reconnect();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated, reconnect]);

  // ─── E2EE Init (lazy — safe if native modules missing) ─
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      hasInitRef.current = false;
      return;
    }
    if (hasInitRef.current) return;

    (async () => {
      try {
        // Dynamic import so native module failures don't crash the tree
        const { CryptoService } = await import('@/lib/crypto');
        const { apiClient } = await import('@/lib/api/client');
        const { endpoints } = await import('@/lib/api/endpoints');

        const result = await CryptoService.initialize();
        hasInitRef.current = true;

        // Upload key bundle if new
        if (result.isNew && result.uploadRequest) {
          await apiClient.post(endpoints.keys.uploadBundle, result.uploadRequest);
        }

        // Key rotation check
        const rotationRequest = await CryptoService.checkKeyRotation();
        if (rotationRequest) {
          await apiClient.post(endpoints.keys.uploadBundle, rotationRequest);
        }

        // Pre-key replenishment
        const replenishment = await CryptoService.checkPreKeyReplenishment();
        if (replenishment.needed && replenishment.newKeys) {
          await apiClient.post(endpoints.keys.replenishPreKeys, {
            deviceId: replenishment.deviceId,
            oneTimePreKeys: replenishment.newKeys,
          });
        }
      } catch (err) {
        console.warn('[RealtimeProvider] E2EE init failed (native module may be unavailable):', err);
        hasInitRef.current = false;
      }
    })();
  }, [isAuthenticated]);

  // ─── Periodic Key Checks ───────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (!hasInitRef.current) return;
      try {
        const { CryptoService } = await import('@/lib/crypto');
        const { apiClient } = await import('@/lib/api/client');
        const { endpoints } = await import('@/lib/api/endpoints');

        const rotationRequest = await CryptoService.checkKeyRotation();
        if (rotationRequest) {
          await apiClient.post(endpoints.keys.uploadBundle, rotationRequest);
        }

        const replenishment = await CryptoService.checkPreKeyReplenishment();
        if (replenishment.needed && replenishment.newKeys) {
          await apiClient.post(endpoints.keys.replenishPreKeys, {
            deviceId: replenishment.deviceId,
            oneTimePreKeys: replenishment.newKeys,
          });
        }
      } catch (err) {
        console.warn('[RealtimeProvider] Key check failed:', err);
      }
    }, KEY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return <>{children}</>;
}
