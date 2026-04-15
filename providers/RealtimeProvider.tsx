/**
 * RealtimeProvider — Activates SSE for real-time events
 *
 * Place inside the provider tree (after auth). Does not render any UI.
 * - Starts SSE stream when authenticated (auto-fallback to polling)
 * - Reconnects when app returns to foreground
 * - Hydrates upload store and runs reconciliation on launch + foreground
 */

import { useSSE } from '@/hooks/api/useSSE';
import { cleanupCompletedUploads } from '@/services/upload/UploadCleanup';
import { reconcilePendingUploads } from '@/services/upload/UploadReconciler';
import { hydrateNudgeStore } from '@/stores/nudgeStore';
import { hydrateUploadStore } from '@/stores/uploadStore';
import { selectIsAuthenticated } from '@/store/selectors';
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSelector } from 'react-redux';

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // ─── SSE ────────────────────────────────────────────────
  const { reconnect } = useSSE(isAuthenticated);

  // ─── Upload store hydration + initial reconciliation ────
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      await hydrateUploadStore();
      await hydrateNudgeStore();
      await reconcilePendingUploads();
      await cleanupCompletedUploads();
    })();
  }, [isAuthenticated]);

  // Reconnect SSE + reconcile uploads when app comes back to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated) {
        reconnect();
        reconcilePendingUploads();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated, reconnect]);

  return <>{children}</>;
}
