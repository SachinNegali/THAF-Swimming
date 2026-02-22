import { apiClient } from '@/lib/api/client';
import { API_BASE_URL, endpoints } from '@/lib/api/endpoints';
import { logApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import type { SSEEvent } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'polling';

// Reconnect config
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const MAX_SSE_RETRIES = 5;

/**
 * SSE hook for real-time event streaming with long-polling fallback.
 *
 * **Primary**: EventSource (SSE) via `GET /sse/stream`
 * **Fallback**: Long polling via `GET /sse/poll` (activated after SSE failures)
 *
 * Automatically invalidates the relevant React Query caches
 * when events arrive, so UI stays in sync without manual refetching.
 */
export function useSSE(enabled = true) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  /**
   * Handle an incoming SSE event and invalidate the appropriate caches.
   */
  const handleEvent = useCallback(
    (event: SSEEvent) => {
      setLastEvent(event);

      const { type, data } = event;
      const groupId = data.groupId as string | undefined;
      const tripId = data.tripId as string | undefined;

      switch (type) {
        case 'new_message':
        case 'message_deleted':
        case 'message_read':
          if (groupId) {
            qc.invalidateQueries({
              queryKey: queryKeys.groups.messages(groupId),
            });
            // Also refresh group list for latest message preview
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;

        case 'group_updated':
        case 'member_added':
        case 'member_removed':
        case 'member_role_updated':
          if (groupId) {
            qc.invalidateQueries({
              queryKey: queryKeys.groups.detail(groupId),
            });
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;

        case 'trip_updated':
          if (tripId) {
            qc.invalidateQueries({
              queryKey: queryKeys.trips.detail(tripId),
            });
            qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
          }
          break;

        case 'notification':
          qc.invalidateQueries({
            queryKey: queryKeys.notifications.list(),
          });
          qc.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount(),
          });
          break;
      }
    },
    [qc]
  );

  // ─── SSE stream connection ─────────────────────────────

  const connectSSE = useCallback(() => {
    if (!enabled) return;

    const token = store.getState().auth.accessToken;
    if (!token) {
      setStatus('disconnected');
      return;
    }

    // Close existing connection
    eventSourceRef.current?.close();

    setStatus('connecting');

    // Build the SSE URL with auth token as query param
    // (EventSource doesn't support custom headers)
    const sseUrl = `${API_BASE_URL}${endpoints.sse.stream}?token=${encodeURIComponent(token)}`;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('connected');
        retryCountRef.current = 0; // Reset retries on successful connect
      };

      es.onmessage = (rawEvent) => {
        try {
          const parsed: SSEEvent = JSON.parse(rawEvent.data);
          handleEvent(parsed);
        } catch {
          // Ignore unparseable events (e.g. heartbeat pings)
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setStatus('disconnected');

        retryCountRef.current += 1;

        if (retryCountRef.current > MAX_SSE_RETRIES) {
          // Exceeded SSE retries → fall back to long polling
          startPolling();
          return;
        }

        // Exponential backoff retry
        const delay = Math.min(
          INITIAL_RETRY_DELAY * 2 ** (retryCountRef.current - 1),
          MAX_RETRY_DELAY
        );

        retryTimeoutRef.current = setTimeout(connectSSE, delay);
      };
    } catch {
      // EventSource constructor can throw in some environments
      startPolling();
    }
  }, [enabled, handleEvent]);

  // ─── Long-polling fallback ─────────────────────────────

  const poll = useCallback(async () => {
    try {
      const response = await apiClient.get<SSEEvent[]>(endpoints.sse.poll);
      const events = response.data;
      if (Array.isArray(events)) {
        for (const event of events) {
          handleEvent(event);
        }
      }
    } catch (error) {
      logApiError(error, 'useSSE:poll');
    }
  }, [handleEvent]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    setStatus('polling');

    // Poll immediately, then every 5 seconds
    poll();
    pollIntervalRef.current = setInterval(poll, 5000);
  }, [poll]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // ─── Lifecycle ─────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      connectSSE();
    }

    return () => {
      // Cleanup on unmount or when disabled
      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      stopPolling();
      setStatus('disconnected');
    };
  }, [enabled, connectSSE, stopPolling]);

  /**
   * Force reconnect (e.g. after user comes back online).
   */
  const reconnect = useCallback(() => {
    stopPolling();
    retryCountRef.current = 0;
    connectSSE();
  }, [connectSSE, stopPolling]);

  return { status, lastEvent, reconnect };
}
