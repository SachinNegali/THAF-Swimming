import { apiClient } from '@/lib/api/client';
import { API_BASE_URL, endpoints } from '@/lib/api/endpoints';
import { logApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import type { Message, PaginatedResponse, SSEEvent, SSEEventType } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import EventSource from 'react-native-sse';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'polling';

/**
 * Map server event types (e.g. "message.new") to client SSEEventType.
 */
function normalizeEventType(serverType: string): SSEEventType {
  const map: Record<string, SSEEventType> = {
    'message.new': 'new_message',
    'message.deleted': 'message_deleted',
    'message.read': 'message_read',
    'group.updated': 'group_updated',
    'member.added': 'member_added',
    'member.removed': 'member_removed',
    'member.role_updated': 'member_role_updated',
    'trip.updated': 'trip_updated',
    'notification': 'notification',
  };
  return map[serverType] ?? 'notification';
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const MAX_SSE_RETRIES = 5;

/**
 * SSE hook for real-time event streaming with long-polling fallback.
 *
 * **Primary**: react-native-sse EventSource via `GET /sse/stream`
 * **Fallback**: Short polling via `GET /sse/poll` (activated after SSE fails)
 *
 * Automatically invalidates the relevant React Query caches when events arrive.
 */
export function useSSE(enabled = true) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const esRef = useRef<EventSource | null>(null);
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
      console.log("IN HANDLE EVENT......", event)
      switch (type) {
        case 'new_message':
          if (groupId) {
            // Append the new message to the cache instead of refetching
            const newMessage: Message = {
              _id: (data.messageId as string) ?? '',
              group: groupId,
              sender: (data.senderId as string) ?? '',
              content: (data.message as string) ?? '',
              type: 'text',
              isDeleted: false,
              readBy: [],
              deliveredTo: [],
              createdAt: (data.createdAt as string) ?? new Date().toISOString(),
              updatedAt: (data.createdAt as string) ?? new Date().toISOString(),
            };
            console.log("NEW MESSAGE", newMessage)

            type MessagesCache =
              | { pages: PaginatedResponse<Message>[]; pageParams: unknown[] }
              | undefined;

            const updater = (old: MessagesCache): MessagesCache => {
              console.log("OLD MESSAGESSS.....", old)
              if (!old?.pages?.length) return old;
              const firstPage = old.pages[0];
              // Skip if message already exists (dedupe SSE echo)
              if (firstPage.data.some((m) => m._id === newMessage._id)) return old;
              return {
                ...old,
                pages: [
                  { ...firstPage, data: [...firstPage.data, newMessage] },
                  ...old.pages.slice(1),
                ],
              };
            };

            // All message caches (groups AND DMs) are keyed by the real
            // groupId now, so a single write updates both list and chat views.
            qc.setQueryData<MessagesCache>(
              queryKeys.groups.messages(groupId),
              updater,
            );
            console.log("KAB0OOOM", qc.setQueryData(queryKeys.groups.messages(groupId), updater));
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;
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
      const response = await apiClient.get<{ notifications: any[]; timestamp: number }>(
        endpoints.sse.poll
      );
      const { notifications = [], timestamp } = response.data ?? {};
      for (const n of notifications) {
        const event: SSEEvent = {
          type: normalizeEventType(n.type ?? 'notification'),
          data: n.data ?? n,
          timestamp: String(timestamp ?? Date.now()),
        };
        console.log('[SSE:poll] Event received:', JSON.stringify(event, null, 2));
        handleEventRef.current(event);
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

  // ─── EventSource-based SSE ─────────────────────────────

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

    // Close any existing connection
    esRef.current?.close();

    setStatus('connecting');
    const sseUrl = `${API_BASE_URL}${endpoints.sse.stream}`;
    const es = new EventSource(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    esRef.current = es;

    const scheduleReconnect = () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      const delay = Math.min(
        INITIAL_RETRY_DELAY * 2 ** Math.max(retryCountRef.current - 1, 0),
        MAX_RETRY_DELAY
      );
      console.log(`[SSE] Retrying in ${delay}ms (attempt ${retryCountRef.current})`);
      retryTimeoutRef.current = setTimeout(() => connectSSERef.current(), delay);
    };

    es.addEventListener('open', () => {
      console.log('[SSE] Connected successfully');
      setStatus('connected');
      retryCountRef.current = 0;
      stopPollingRef.current();
    });

    es.addEventListener('message', (e: any) => {
      if (!e.data) return;
      try {
        const parsed = JSON.parse(e.data);
        console.log("PARSEDD...", parsed)
        // Skip heartbeat events
        if (!parsed.type && parsed.timestamp) return;

        const event: SSEEvent = {
          type: normalizeEventType(parsed.type ?? 'notification'),
          data: {
            ...(parsed.data ?? {}),
            message: parsed.message,
            createdAt: parsed.createdAt,
          },
          timestamp: String(parsed.timestamp ?? Date.now()),
        };console.log('[SSE:stream] Event received:', JSON.stringify(event, null, 2));
        handleEventRef.current(event);
      } catch {
        // malformed data — ignore
      }
    });

    // Listen for named event types the server may send
    for (const eventName of ['notification', 'heartbeat', 'connected']) {
      es.addEventListener(eventName, (e: any) => {
        if (!e.data) return;
        try {
          const parsed = JSON.parse(e.data);
          console.log("PARSEDD...2", parsed)
          if (eventName === 'heartbeat' || eventName === 'connected') return;

          const event: SSEEvent = {
            type: normalizeEventType(parsed.type ?? eventName),
            data: {
              ...(parsed.data ?? {}),
              message: parsed.message,
              createdAt: parsed.createdAt,
            },
            timestamp: String(parsed.timestamp ?? Date.now()),
          };console.log(`[SSE:${eventName}] Event received:`, JSON.stringify(event, null, 2));
          handleEventRef.current(event);
        } catch {
          // ignore
        }
      });
    }

    es.addEventListener('error', (e: any) => {
      console.warn('[SSE] Error:', e);
      es.close();
      esRef.current = null;
      setStatus('disconnected');
      retryCountRef.current++;

      if (retryCountRef.current > MAX_SSE_RETRIES) {
        console.log('[SSE] Max retries exceeded, switching to long-poll');
        startPollingRef.current();
      } else {
        scheduleReconnect();
      }
    });
  }, [enabled]);

  connectSSERef.current = connectSSE;

  // ─── Lifecycle ─────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      connectSSE();
    }

    return () => {
      esRef.current?.close();
      esRef.current = null;
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
