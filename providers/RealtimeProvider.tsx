/**
 * RealtimeProvider — Activates SSE for real-time events
 *
 * Place inside the provider tree (after auth). Does not render any UI.
 * - Starts SSE stream when authenticated (auto-fallback to polling)
 * - Reconnects when app returns to foreground
 */

import { useSSE } from '@/hooks/api/useSSE';
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

  return <>{children}</>;
}
