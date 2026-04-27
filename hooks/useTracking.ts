/**
 * useTracking — Real-time WebSocket location tracking hook
 *
 * Connects to the tracking server, sends/receives 40-byte binary
 * location messages, and manages connection lifecycle.
 *
 * GPS location is fetched INDEPENDENTLY of WebSocket so the map
 * always loads even when the server is unreachable.
 *
 * Fallback: after MAX_WS_RECONNECT_BEFORE_POLL consecutive failures the hook
 * automatically activates HTTP long-polling. When WebSocket reconnects
 * successfully, polling is stopped and WS resumes as primary transport.
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { refreshAccessToken } from '../lib/api/refreshToken';
import { TokenManager } from '../lib/api/tokenManager';
import {
  decodeLocationUpdate,
  encodeLocationUpdate,
  LocationUpdate,
} from '../services/tracking/binaryProtocol';
import { usePollingFallback } from './usePollingFallback';

// ─── Constants ───────────────────────────────────────────
/**
 * Number of consecutive WS close events before activating the long-poll
 * fallback. At exponential backoff (1 s, 2 s, 4 s, 8 s, 16 s) this
 * corresponds to ~31 s of retrying before switching transports.
 */
const MAX_WS_RECONNECT_BEFORE_POLL = 2;

// ─── Types ───────────────────────────────────────────────
export interface PeerLocation extends LocationUpdate {
  receivedAt: number;
}

export interface IncomingQuickAction {
  actionId: string;
  label: string;
  priority: string;
  senderUserId: string;
  senderName: string;
  timestamp: number;
}

export interface PeerProfile {
  userId: string;
  numericId: number;
  fName?: string;
  lName?: string;
  name: string;
  picture?: string;
}

export interface UseTrackingOptions {
  wsUrl: string;
  accessToken: string;
  groupId: string;
  numericUserId: number;
  updateIntervalMs?: number;
  enabled?: boolean;
  onQuickAction?: (action: IncomingQuickAction) => void;
}

export interface UseTrackingReturn {
  isConnected: boolean;
  isPolling: boolean;
  peerLocations: Map<number, PeerLocation>;
  /** Maps numericId → full peer profile (userId, name, picture, …) from the welcome roster */
  peerProfileMap: Map<number, PeerProfile>;
  myLocation: Location.LocationObject | null;
  groupSize: number;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendQuickAction: (actionId: string, label: string, priority: string, senderName: string) => void;
}

// ─── Hook ────────────────────────────────────────────────
export function useTracking(options: UseTrackingOptions): UseTrackingReturn {
  const {
    wsUrl,
    accessToken,
    groupId,
    numericUserId,
    updateIntervalMs = 2000,
    enabled = true,
  } = options;

  // ─── Refs ────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Prevents reconnect after intentional disconnect (effect cleanup / user call)
  const disposedRef = useRef(false);

  // Guards token refresh to one attempt per connection cycle — reset on onopen
  const hasTriedRefreshRef = useRef(false);

  // Store latest option values so callbacks never go stale
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onQuickActionRef = useRef(options.onQuickAction);
  onQuickActionRef.current = options.onQuickAction;

  // ─── State ───────────────────────────────────────────
  const [isConnected, setIsConnected] = useState(false);
  const [peerLocations, setPeerLocations] = useState<Map<number, PeerLocation>>(new Map());
  const [peerProfileMap, setPeerProfileMap] = useState<Map<number, PeerProfile>>(new Map());
  const [myLocation, setMyLocation] = useState<Location.LocationObject | null>(null);
  const [groupSize, setGroupSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Keep myLocation in a ref so the WS send-loop reads the latest value
  const myLocationRef = useRef<Location.LocationObject | null>(null);
  useEffect(() => { myLocationRef.current = myLocation; }, [myLocation]);

  // ─── Shared location-update handler (WS + polling use the same path) ──────
  const handleLocationUpdate = useCallback((update: LocationUpdate) => {
    setPeerLocations((prev) => {
      const next = new Map(prev);
      next.set(update.userId, { ...update, receivedAt: Date.now() });
      return next;
    });
  }, []);

  // Keep handleLocationUpdate accessible inside WS callbacks without re-creating connect
  const handleLocationUpdateRef = useRef(handleLocationUpdate);
  handleLocationUpdateRef.current = handleLocationUpdate;

  // ─── Polling fallback ────────────────────────────────
  // Derive HTTP base URL from wsUrl: wss:// → https://, ws:// → http://
  const pollBaseUrl = wsUrl
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://');

  const getLocation = useCallback(() => {
    const loc = myLocationRef.current;
    if (!loc) return null;
    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      speed: Math.round((loc.coords.speed ?? 0) * 3.6),
      bearing: Math.round(loc.coords.heading ?? 0),
    };
  }, []);

  const { isPolling, startPolling, stopPolling, error: pollError } = usePollingFallback({
    pollBaseUrl,
    numericUserId,
    updateIntervalMs,
    getLocation,
    onLocationUpdate: handleLocationUpdate,
  });

  // Expose polling controls to WS callbacks via refs (stable, no dep issues)
  const startPollingRef = useRef(startPolling);
  startPollingRef.current = startPolling;
  const stopPollingRef = useRef(stopPolling);
  stopPollingRef.current = stopPolling;
  const isPollingRef = useRef(isPolling);
  isPollingRef.current = isPolling;

  // Surface polling errors into the unified error state
  useEffect(() => {
    if (pollError) setError(pollError.message);
  }, [pollError]);

  // ═══════════════════════════════════════════════════════
  // 1. GPS — always on, independent of WebSocket / ride mode
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!Location || !Location.requestForegroundPermissionsAsync) {
      setError('Location module is not available');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setError('Location permission denied');
          return;
        }

        // One-shot position so the map renders immediately
        try {
          const initial = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) setMyLocation(initial);
        } catch (e) {
          console.warn('[Tracking] Initial GPS error:', e);
        }

        // Continuous watch
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: updateIntervalMs,
            distanceInterval: 2,
          },
          (loc) => { if (!cancelled) setMyLocation(loc); },
        );

        if (cancelled) {
          sub.remove();
        } else {
          locationSubRef.current = sub;
        }
      } catch (e) {
        console.warn('[Tracking] GPS setup error:', e);
      }
    })();

    return () => {
      cancelled = true;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, [updateIntervalMs]);

  // ═══════════════════════════════════════════════════════
  // 2. WS send-loop — forwards latest GPS over the socket
  // ═══════════════════════════════════════════════════════
  const startSendLoop = useCallback((ws: WebSocket) => {
    if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);

    sendIntervalRef.current = setInterval(() => {
      const loc = myLocationRef.current;
      if (!loc || ws.readyState !== WebSocket.OPEN) return;

      const { numericUserId: uid } = optionsRef.current;
      const msg = encodeLocationUpdate(
        uid,
        loc.coords.latitude,
        loc.coords.longitude,
        Math.round((loc.coords.speed ?? 0) * 3.6),
        Math.round(loc.coords.heading ?? 0),
        1,
      );
      ws.send(msg);
    }, optionsRef.current.updateIntervalMs ?? 2000);
  }, []);

  const stopSendLoop = useCallback(() => {
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════
  // 3. Connect — stable identity, reads everything from refs
  // ═══════════════════════════════════════════════════════
  const connect = useCallback(() => {
    // Already connected?
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[Tracking] Already connected/connecting, skipping');
      return;
    }

    // Don't reconnect after intentional dispose
    if (disposedRef.current) return;

    const { wsUrl: url, groupId: gid } = optionsRef.current;
    // Prefer TokenManager — it's updated synchronously by refreshAccessToken,
    // whereas optionsRef.current.accessToken lags one React render behind.
    const token = TokenManager.getAccessToken() ?? optionsRef.current.accessToken;

    // Safety: don't connect with empty token
    if (!token) {
      console.log('[Tracking] No access token, skipping connect');
      return;
    }

    const fullUrl = `${url}/?token=${encodeURIComponent(token)}&groupId=${encodeURIComponent(gid)}`;
    console.log('[Tracking] Connecting WS:', fullUrl);

    const ws = new WebSocket(fullUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Tracking] WS connected ✓');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      hasTriedRefreshRef.current = false;
      startSendLoop(ws);

      // WS is back — stop polling fallback if it was active
      if (isPollingRef.current) {
        console.log('[Tracking] WebSocket restored, stopping poll fallback');
        stopPollingRef.current();
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer && event.data.byteLength === 40) {
        const update = decodeLocationUpdate(event.data);
        handleLocationUpdateRef.current(update);
      } else if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          console.log('[Tracking] WS text message:', msg.type);
          console.log('[Tracking] WS text message: message', msg);

          if (msg.type === 'welcome') {
            setGroupSize(msg.groupSize);
            if (msg.roster) {
              setPeerProfileMap(new Map(
                Object.entries(msg.roster).map(
                  ([nid, profile]) => [Number(nid), profile as PeerProfile],
                ),
              ));
            }
          } else if (msg.type === 'peer_joined') {
            setGroupSize(msg.groupSize);
            setPeerProfileMap((prev) => {
              const next = new Map(prev);
              const u = msg.user ?? {};
              const joinedName = [u.fName, u.lName].filter(Boolean).join(' ').trim();
              next.set(msg.numericId, {
                userId: u.userId ?? msg.userId,
                numericId: u.numericId ?? msg.numericId,
                fName: u.fName,
                lName: u.lName,
                name: u.name ?? (joinedName || `Rider ${msg.numericId}`),
                picture: u.picture,
              });
              return next;
            });
          } else if (msg.type === 'peer_left') {
            setGroupSize(msg.groupSize);
            setPeerProfileMap((prev) => {
              const next = new Map(prev);
              next.delete(msg.numericId);
              return next;
            });
            setPeerLocations((prev) => {
              const next = new Map(prev);
              next.delete(msg.numericId);
              return next;
            });
          } else if (msg.type === 'quick_action') {
            onQuickActionRef.current?.(msg as IncomingQuickAction);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    };

    ws.onerror = (e: any) => {
      const errMsg = e?.message || 'unknown error';
      console.warn('[Tracking] WS error:', errMsg, e);
      setError(`WebSocket error: ${errMsg}`);
    };

    ws.onclose = (e: any) => {
      console.log(
        '[Tracking] WS closed — code:', e?.code,
        'reason:', e?.reason,
        'attempts:', reconnectAttempts.current,
        'disposed:', disposedRef.current,
      );
      setIsConnected(false);
      stopSendLoop();

      if (disposedRef.current || !optionsRef.current.enabled) return;

      const scheduleRetryOrPoll = () => {
        if (disposedRef.current || !optionsRef.current.enabled) return;
        if (reconnectAttempts.current >= MAX_WS_RECONNECT_BEFORE_POLL) {
          // Max retries exhausted — activate long-poll fallback
          if (!isPollingRef.current) {
            console.log('[Tracking] WebSocket failed after max retries, falling back to long-polling');
            const { groupId: gid } = optionsRef.current;
            const tok = TokenManager.getAccessToken() ?? optionsRef.current.accessToken;
            startPollingRef.current(gid, tok);
          }
        } else {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
          console.log(`[Tracking] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      // The WS URL carries the access token, so an expired token looks like a
      // plain close. Attempt a refresh once per connect cycle before giving up
      // on WS — otherwise we'd backoff-then-poll with the same dead token.
      if (!hasTriedRefreshRef.current && TokenManager.getRefreshToken()) {
        hasTriedRefreshRef.current = true;
        console.log('[Tracking] WS closed — attempting token refresh before reconnect');
        refreshAccessToken()
          .then(() => {
            if (disposedRef.current || !optionsRef.current.enabled) return;
            console.log('[Tracking] Token refreshed, reconnecting WS');
            reconnectAttempts.current = 0;
            connect();
          })
          .catch((err: any) => {
            console.warn('[Tracking] Token refresh failed:', err?.message ?? err);
            // 401/403 already cleared tokens + dispatched logout inside the
            // helper; leave WS down and let the auth flow take over.
            if (err?.status === 401 || err?.status === 403) return;
            scheduleRetryOrPoll();
          });
        return;
      }

      scheduleRetryOrPoll();
    };
  }, [startSendLoop, stopSendLoop]);

  // ═══════════════════════════════════════════════════════
  // 4. Disconnect — sets disposedRef to prevent auto-reconnect
  // ═══════════════════════════════════════════════════════
  const disconnect = useCallback(() => {
    console.log('[Tracking] disconnect() called');
    disposedRef.current = true; // prevent onclose from reconnecting

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopSendLoop();
    stopPollingRef.current(); // stop polling fallback if active

    if (wsRef.current) {
      wsRef.current.onclose = null;  // remove handler before close to avoid stale callback
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [stopSendLoop]);

  // ═══════════════════════════════════════════════════════
  // 5. Auto-connect + AppState — single effect
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    disposedRef.current = false; // allow connecting

    if (enabled) {
      connect();
    }

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && optionsRef.current.enabled) {
        disposedRef.current = false; // allow reconnect when coming back
        reconnectAttempts.current = 0; // reset attempts so WS gets a fresh chance
        stopPollingRef.current();      // stop any active polling first
        connect();
      } else if (state === 'background') {
        disconnect();
      }
    });

    return () => {
      sub.remove();
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // ═══════════════════════════════════════════════════════
  // 6. Send quick action over WS
  // ═══════════════════════════════════════════════════════
  const sendQuickAction = useCallback(
    (actionId: string, label: string, priority: string, senderName: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: 'quick_action', actionId, label, priority, senderName }));
    },
    [],
  );

  return { isConnected, isPolling, peerLocations, peerProfileMap, myLocation, groupSize, error, connect, disconnect, sendQuickAction };
}
