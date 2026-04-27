import { apiClient } from '@/lib/api/client';
import { API_BASE_URL, endpoints } from '@/lib/api/endpoints';
import { logApiError } from '@/lib/api/errorHandler';
import { refreshAccessToken } from '@/lib/api/refreshToken';
import { TokenManager } from '@/lib/api/tokenManager';
import { showLocalMessageNotification } from '@/lib/notifications';
import { queryKeys } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import { updateUpload } from '@/stores/uploadStore';
import type { Group, Message, PaginatedResponse, SSEEvent, SSEEventType } from '@/types/api';
import type {
  MediaReadySSEEvent,
  MessageImageUpdatedSSEEvent,
  UploadSSEEvent,
} from '@/types/upload';
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
    'message.updated': 'message_updated',
    'message:updated': 'message_updated',
    'message.deleted': 'message_deleted',
    'message.read': 'message_read',
    'group.updated': 'group_updated',
    'member.added': 'member_added',
    'member.removed': 'member_removed',
    'member.role_updated': 'member_role_updated',
    'trip.updated': 'trip_updated',
    'notification': 'notification',
    'upload:status': 'upload_status',
    'upload.status': 'upload_status',
    'message.image_updated': 'message_image_updated',
    'message:image-updated': 'message_image_updated',
    'message:media-ready': 'message_media_ready',
    'message.media-ready': 'message_media_ready',
    'message.media_ready': 'message_media_ready',
    'settlement.updated': 'settlement_updated',
    'settlement:updated': 'settlement_updated',
    'expense.settled': 'expense_settled',
    'expense:settled': 'expense_settled',
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
  // Guards token refresh to one attempt per connection cycle — reset on 'open'
  const hasTriedRefreshRef = useRef(false);

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
            // Backend may push either (a) a flat shape { messageId, message, senderId }
            // or (b) a full Message document (spend messages include metadata.spend).
            const fullMsg = data.message && typeof data.message === 'object'
              ? (data.message as Partial<Message>)
              : null;

            const inferredType: Message['type'] =
              (fullMsg?.type as Message['type']) ?? (data.type as Message['type']) ?? 'text';

            const contentStr = fullMsg?.content ??
              (typeof data.message === 'string' ? (data.message as string) : (data.content as string)) ?? '';

            const metadata = fullMsg?.metadata ?? (data.metadata as Message['metadata']);

            const newMessage: Message = {
              _id: (fullMsg?._id as string) ?? (data.messageId as string) ?? '',
              group: groupId,
              sender: (fullMsg?.sender as string) ?? (data.senderId as string) ?? '',
              content: contentStr,
              type: inferredType,
              isDeleted: !!fullMsg?.isDeleted,
              readBy: (fullMsg?.readBy as string[]) ?? [],
              deliveredTo: (fullMsg?.deliveredTo as string[]) ?? [],
              createdAt: (fullMsg?.createdAt as string) ?? (data.createdAt as string) ?? new Date().toISOString(),
              updatedAt: (fullMsg?.updatedAt as string) ?? (data.createdAt as string) ?? new Date().toISOString(),
              metadata,
              createdBy: (fullMsg?.createdBy as string) ?? (data.createdBy as string),
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

            // If this is a spend message, also refresh balances/summary/expenses.
            if (newMessage.type === 'spend') {
              qc.invalidateQueries({
                queryKey: queryKeys.expenses.groupAll(groupId),
              });
            }

            // Show a local notification for the incoming message
            // Look up group info from the cached groups list
            const cachedGroups = qc.getQueryData<Group[]>(queryKeys.groups.list());
            const matchedGroup = cachedGroups?.find(
              (g) => (g.id ?? g._id) === groupId,
            );
            const isDm = matchedGroup?.type === 'dm';
            const groupDisplayName = matchedGroup?.name;

            // Resolve sender display name from the group's member list
            const senderMember = matchedGroup?.members?.find(
              (m) => m.userId === newMessage.sender || m.user?._id === newMessage.sender,
            );
            const senderName = senderMember?.user
              ? `${senderMember.user.fName} ${senderMember.user.lName}`.trim()
              : undefined;

            showLocalMessageNotification({
              senderId: newMessage.sender,
              content: newMessage.content,
              groupId,
              senderName,
              isDm,
              groupName: groupDisplayName,
            });
          }
          break;
        case 'message_updated': {
          if (!groupId) break;
          const messageId = (data.messageId as string) ?? (data._id as string);
          const nextContent = data.content as string | undefined;
          const nextMetadata = data.metadata as Message['metadata'] | undefined;
          type MessagesCache =
            | { pages: PaginatedResponse<Message>[]; pageParams: unknown[] }
            | undefined;
          qc.setQueryData<MessagesCache>(
            queryKeys.groups.messages(groupId),
            (old) => {
              if (!old?.pages?.length || !messageId) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((m) =>
                    m._id === messageId
                      ? {
                          ...m,
                          content: nextContent ?? m.content,
                          metadata: nextMetadata
                            ? { ...(m.metadata ?? {}), ...nextMetadata }
                            : m.metadata,
                          updatedAt: new Date().toISOString(),
                        }
                      : m,
                  ),
                })),
              };
            },
          );
          qc.invalidateQueries({
            queryKey: queryKeys.expenses.groupAll(groupId),
          });
          break;
        }
        case 'message_deleted':
        case 'message_read':
          if (groupId) {
            const messageId =
              (data.messageId as string) ?? (data._id as string);
            if (type === 'message_deleted' && messageId) {
              type MessagesCache =
                | { pages: PaginatedResponse<Message>[]; pageParams: unknown[] }
                | undefined;
              qc.setQueryData<MessagesCache>(
                queryKeys.groups.messages(groupId),
                (old) => {
                  if (!old?.pages?.length) return old;
                  return {
                    ...old,
                    pages: old.pages.map((page) => ({
                      ...page,
                      data: page.data.filter((m) => m._id !== messageId),
                    })),
                  };
                },
              );
              qc.invalidateQueries({
                queryKey: queryKeys.expenses.groupAll(groupId),
              });
            } else {
              qc.invalidateQueries({ queryKey: queryKeys.groups.messages(groupId) });
            }
            qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
          }
          break;
        case 'settlement_updated':
          if (groupId) {
            qc.invalidateQueries({
              queryKey: queryKeys.expenses.balances(groupId),
            });
            qc.invalidateQueries({
              queryKey: queryKeys.expenses.settlements(groupId),
            });
          }
          break;
        case 'expense_settled':
          if (groupId) {
            qc.invalidateQueries({
              queryKey: queryKeys.expenses.balances(groupId),
            });
            qc.invalidateQueries({
              queryKey: queryKeys.expenses.settlements(groupId),
            });
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

        case 'upload_status': {
          const upload = data as unknown as UploadSSEEvent;
          if (upload.status === 'completed') {
            updateUpload(upload.imageId, {
              status: 'completed',
              thumbnailUrl: upload.thumbnailUrl ?? null,
              optimizedUrl: upload.optimizedUrl ?? null,
              width: upload.width ?? null,
              height: upload.height ?? null,
            });
          } else if (upload.status === 'failed') {
            updateUpload(upload.imageId, { status: 'failed' });
          }
          break;
        }

        case 'message_image_updated': {
          const payload = data as unknown as MessageImageUpdatedSSEEvent;
          const gId = payload.groupId;
          if (!gId) break;

          type MessagesCache =
            | { pages: PaginatedResponse<Message>[]; pageParams: unknown[] }
            | undefined;

          qc.setQueryData<MessagesCache>(
            queryKeys.groups.messages(gId),
            (old) => {
              if (!old?.pages?.length) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((m) => {
                    if (m._id !== payload.messageId) return m;
                    const existing = m.metadata?.images ?? [];
                    const idx = existing.findIndex(
                      (i) => i.imageId === payload.imageId,
                    );
                    const nextImages =
                      idx === -1
                        ? [...existing, payload.image]
                        : existing.map((i, n) =>
                            n === idx ? payload.image : i,
                          );
                    return {
                      ...m,
                      metadata: { ...(m.metadata ?? {}), images: nextImages },
                    };
                  }),
                })),
              };
            },
          );
          break;
        }

        case 'message_media_ready': {
          const media = data as unknown as MediaReadySSEEvent;
          const gId = media.groupId;
          if (!gId || !media.images) break;

          type MessagesCache =
            | { pages: PaginatedResponse<Message>[]; pageParams: unknown[] }
            | undefined;

          qc.setQueryData<MessagesCache>(
            queryKeys.groups.messages(gId),
            (old) => {
              if (!old?.pages?.length) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((m) =>
                    m._id === media.messageId
                      ? {
                          ...m,
                          metadata: {
                            ...(m.metadata ?? {}),
                            images: media.images!,
                          },
                        }
                      : m,
                  ),
                })),
              };
            },
          );
          break;
        }
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
      hasTriedRefreshRef.current = false;
      stopPollingRef.current();
    });

    es.addEventListener('message', (e: any) => {
      if (!e.data) return;
      try {
        console.log("PARSEDD THIS IS E DATA....", e.data)
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
    for (const eventName of [
      'notification',
      'heartbeat',
      'connected',
      'upload:status',
      'message.image_updated',
      'message:image-updated',
      'message:media-ready',
      'message.media_ready',
      'message.updated',
      'message:updated',
      'message.deleted',
      'settlement.updated',
      'settlement:updated',
      'expense.settled',
      'expense:settled',
    ]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (es as any).addEventListener(eventName, (e: any) => {
        if (!e.data) return;
        try {
          console.log(" PARSEDD THIS IS E DATA....2", e.data)
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

      // EventSource doesn't surface HTTP status codes, so an expired token
      // and a network blip look identical. Attempt a refresh once per
      // connect cycle before counting this against retry budget — otherwise
      // we'd burn all 5 retries with the same dead token and fall to polling.
      if (!hasTriedRefreshRef.current && TokenManager.getRefreshToken()) {
        hasTriedRefreshRef.current = true;
        console.log('[SSE] Error — attempting token refresh before reconnect');
        refreshAccessToken()
          .then(() => {
            console.log('[SSE] Token refreshed, reconnecting SSE');
            retryCountRef.current = 0;
            connectSSERef.current();
          })
          .catch((err: any) => {
            console.warn('[SSE] Token refresh failed:', err?.message ?? err);
            // 401/403: helper already logged out; stop here.
            if (err?.status === 401 || err?.status === 403) return;
            retryCountRef.current++;
            if (retryCountRef.current > MAX_SSE_RETRIES) {
              startPollingRef.current();
            } else {
              scheduleReconnect();
            }
          });
        return;
      }

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
