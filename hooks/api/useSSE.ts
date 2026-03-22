import { apiClient } from '@/lib/api/client';
import { API_BASE_URL, endpoints } from '@/lib/api/endpoints';
import { logApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import type { SSEEvent, SSEEventType } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'polling';

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const MAX_SSE_RETRIES = 5;

/**
 * SSE hook for real-time event streaming with long-polling fallback.
 *
 * **Primary**: fetch-based SSE reader via `GET /sse/stream`
 *   (React Native has no built-in EventSource — we use fetch + ReadableStream)
 * **Fallback**: Short polling via `GET /sse/poll` (activated after SSE fails)
 *
 * Automatically invalidates the relevant React Query caches when events arrive.
 */
export function useSSE(enabled = true) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const sseAbortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  // ─── Event handler ─────────────────────────────────────

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
            qc.invalidateQueries({ queryKey: queryKeys.groups.messages(groupId) });
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;
        case 'group_updated':
        case 'member_added':
        case 'member_removed':
        case 'member_role_updated':
          if (groupId) {
            qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;
        case 'trip_updated':
          if (tripId) {
            qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
            qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
          }
          break;
        case 'notification':
          qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
          qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
          break;
      }
    },
    [qc]
  );

  const handleEventRef = useRef(handleEvent);
  handleEventRef.current = handleEvent;

  // ─── Long-polling fallback ─────────────────────────────

  const poll = useCallback(async () => {
    try {
      // Backend returns { notifications: [...], timestamp: number }
      // NOT an SSEEvent[] array — map manually
      const response = await apiClient.get<{ notifications: any[]; timestamp: number }>(
        endpoints.sse.poll
      );
      const { notifications = [], timestamp } = response.data ?? {};
      for (const n of notifications) {
        handleEventRef.current({
          type: (n.type ?? 'notification') as SSEEventType,
          data: n,
          timestamp: String(timestamp ?? Date.now()),
        });
      }
    } catch (error) {
      logApiError(error, 'useSSE:poll');
    }
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    setStatus('polling');
    console.log('[SSE] Starting long-poll fallback');
    poll();
    pollIntervalRef.current = setInterval(poll, 5000);
  }, [poll]);

  const stopPolling = useCallback(() => {
    if (!isPollingRef.current) return;
    isPollingRef.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPollingRef = useRef(startPolling);
  startPollingRef.current = startPolling;
  const stopPollingRef = useRef(stopPolling);
  stopPollingRef.current = stopPolling;

  // ─── fetch-based SSE (React Native has no EventSource) ─

  // Forward ref so the async IIFE can schedule retries without stale closures
  const connectSSERef = useRef<() => void>(() => {});

  const connectSSE = useCallback(() => {
    if (!enabled) {
      console.log('[SSE] Disabled, skipping');
      return;
    }

    const token = store.getState().auth.accessToken;
    if (!token) {
      console.log('[SSE] No token, cannot connect');
      setStatus('disconnected');
      return;
    }

    // Cancel any existing SSE fetch
    sseAbortRef.current?.abort();
    const controller = new AbortController();
    sseAbortRef.current = controller;

    setStatus('connecting');
    console.log('[SSE] Connecting via fetch SSE...');

    const sseUrl = `${API_BASE_URL}${endpoints.sse.stream}`;
    console.log( 'SSE URL...', sseUrl);
    const scheduleReconnect = () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      const delay = Math.min(
        INITIAL_RETRY_DELAY * 2 ** Math.max(retryCountRef.current - 1, 0),
        MAX_RETRY_DELAY
      );
      console.log(`[SSE] Retrying in ${delay}ms (attempt ${retryCountRef.current})`);
      retryTimeoutRef.current = setTimeout(() => connectSSERef.current(), delay);
    };

    (async () => {
      try {
        const response = await fetch(sseUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('SSE response', response);
        console.log('SSE response', response?.status, response?.statusText, response?.body);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.body) throw new Error('No response body');

        console.log('[SSE] Connected successfully');
        setStatus('connected');
        retryCountRef.current = 0;
        stopPollingRef.current();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ') && line.length > 6) {
              try {
                const parsed: SSEEvent = JSON.parse(line.slice(6));
                handleEventRef.current(parsed);
              } catch {
                // heartbeat or malformed — ignore
              }
            }
          }
        }

        // Server closed stream cleanly — reconnect
        if (!controller.signal.aborted) {
          console.log('[SSE] Stream ended, scheduling reconnect');
          scheduleReconnect();
        }
      } catch (err: any) {
        if (controller.signal.aborted) return; // intentional teardown

        console.warn('[SSE] fetch error:', err?.message ?? err);
        setStatus('disconnected');
        retryCountRef.current++;

        if (retryCountRef.current > MAX_SSE_RETRIES) {
          console.log('[SSE] Max retries exceeded, switching to long-poll');
          startPollingRef.current();
        } else {
          scheduleReconnect();
        }
      }
    })();
  }, [enabled]);

  // Keep the ref in sync so the async retry setTimeout always calls the latest version
  connectSSERef.current = connectSSE;

  // ─── Lifecycle ─────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      connectSSE();
    }

    return () => {
      sseAbortRef.current?.abort();
      sseAbortRef.current = null;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      stopPolling();
      setStatus('disconnected');
    };
  }, [enabled, connectSSE, stopPolling]);

  // ─── Public API ────────────────────────────────────────

  const reconnect = useCallback(() => {
    stopPolling();
    retryCountRef.current = 0;
    connectSSE();
  }, [connectSSE, stopPolling]);

  return { status, lastEvent, reconnect };
}
