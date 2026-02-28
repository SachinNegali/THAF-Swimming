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
const POLL_INTERVAL = 5000;

/**
 * SSE hook for real-time event streaming with long-polling fallback.
 *
 * **Primary**: XMLHttpRequest-based SSE via `GET /sse/stream`
 *   (React Native has no native EventSource; XHR streaming works everywhere)
 * **Fallback**: Long polling via `GET /sse/poll` (activated after SSE failures)
 *
 * Automatically invalidates the relevant React Query caches
 * when events arrive, so UI stays in sync without manual refetching.
 */
export function useSSE(enabled = true) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const processedLengthRef = useRef(0);

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
        case 'message.new':
        case 'message.deleted':
        case 'message.delivered':
        case 'message.read':
          if (groupId) {
            qc.invalidateQueries({
              queryKey: queryKeys.groups.messages(groupId),
            });
            // Also refresh group list for latest message preview
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;

        case 'group.updated':
        case 'group.invite':
        case 'group.member_added':
        case 'group.member_removed':
        case 'group.member_left':
        case 'group.role_updated':
        case 'group.deleted':
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

  // ─── Parse SSE text stream ────────────────────────────

  /**
   * Parse raw SSE text into individual events.
   * SSE format:
   *   event: <type>
   *   data: <json>
   *   \n
   */
  const parseSSEChunk = useCallback(
    (rawText: string) => {
      // Split by double-newline to get individual event blocks
      const blocks = rawText.split(/\n\n/);
      for (const block of blocks) {
        if (!block.trim()) continue;

        const lines = block.split('\n');
        let eventType = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr = line.slice(5).trim();
          }
        }

        // Skip heartbeats and connection confirmations without data
        if (!dataStr) continue;

        try {
          const parsedData = JSON.parse(dataStr);

          // Skip heartbeat events (they only carry a timestamp)
          if (eventType === 'heartbeat') continue;

          // For 'connected' events, just log and continue
          if (eventType === 'connected') {
            console.log('[SSE] Connected:', parsedData);
            continue;
          }

          // Build the SSEEvent from the stream
          const sseEvent: SSEEvent = {
            type: (eventType || parsedData.type) as SSEEvent['type'],
            data: parsedData.data ?? parsedData,
            timestamp: parsedData.timestamp ?? new Date().toISOString(),
          };

          if (sseEvent.type) {
            handleEvent(sseEvent);
          }
        } catch {
          // Ignore unparseable chunks (partial data, etc.)
        }
      }
    },
    [handleEvent]
  );

  // ─── XHR-based SSE stream connection ──────────────────

  const connectSSE = useCallback(() => {
    if (!enabled) return;

    const token = store.getState().auth.accessToken;
    if (!token) {
      setStatus('disconnected');
      return;
    }

    // Close existing connection
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    setStatus('connecting');
    processedLengthRef.current = 0;

    const sseUrl = `${API_BASE_URL}${endpoints.sse.stream}`;

    try {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open('GET', sseUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      // Skip ngrok browser interstitial page
      xhr.setRequestHeader('ngrok-skip-browser-warning', '1');

      xhr.onreadystatechange = () => {
        // readyState 3 = LOADING (streaming data arriving)
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const responseText = xhr.responseText;
          if (responseText.length > processedLengthRef.current) {
            const newData = responseText.slice(processedLengthRef.current);
            processedLengthRef.current = responseText.length;

            // We're receiving data → we're connected
            if (status !== 'connected') {
              setStatus('connected');
              retryCountRef.current = 0;
            }

            parseSSEChunk(newData);
          }
        }

        // readyState 4 = DONE (connection closed)
        if (xhr.readyState === XMLHttpRequest.DONE) {
          xhrRef.current = null;
          setStatus('disconnected');

          retryCountRef.current += 1;

          if (retryCountRef.current > MAX_SSE_RETRIES) {
            console.log('[SSE] Max retries exceeded, falling back to polling');
            startPolling();
            return;
          }

          // Exponential backoff retry
          const delay = Math.min(
            INITIAL_RETRY_DELAY * 2 ** (retryCountRef.current - 1),
            MAX_RETRY_DELAY
          );

          console.log(`[SSE] Connection closed, retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_SSE_RETRIES})`);
          retryTimeoutRef.current = setTimeout(connectSSE, delay);
        }
      };

      xhr.onerror = () => {
        console.warn('[SSE] XHR error');
        xhrRef.current = null;
        setStatus('disconnected');

        retryCountRef.current += 1;

        if (retryCountRef.current > MAX_SSE_RETRIES) {
          console.log('[SSE] Max retries exceeded, falling back to polling');
          startPolling();
          return;
        }

        const delay = Math.min(
          INITIAL_RETRY_DELAY * 2 ** (retryCountRef.current - 1),
          MAX_RETRY_DELAY
        );

        retryTimeoutRef.current = setTimeout(connectSSE, delay);
      };

      xhr.send();
    } catch (err) {
      console.warn('[SSE] Failed to create XHR:', err);
      startPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, handleEvent, parseSSEChunk]);

  // ─── Long-polling fallback ─────────────────────────────

  const poll = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.sse.poll);
      const responseData = response.data;

      // Backend returns { notifications: [...], timestamp }
      // Each notification is an SSE-like event
      const events: SSEEvent[] = Array.isArray(responseData)
        ? responseData
        : responseData?.notifications ?? [];

      for (const event of events) {
        handleEvent(event);
      }
    } catch (error) {
      logApiError(error, 'useSSE:poll');
    }
  }, [handleEvent]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    setStatus('polling');

    console.log('[SSE] Starting long-polling fallback');

    // Poll immediately, then every 5 seconds
    poll();
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
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
      if (xhrRef.current) {
        xhrRef.current.abort();
        xhrRef.current = null;
      }

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
