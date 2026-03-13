/**
 * useTracking — Real-time WebSocket location tracking hook
 *
 * Connects to the tracking server, sends/receives 40-byte binary
 * location messages, and manages connection lifecycle.
 *
 * GPS location is fetched INDEPENDENTLY of WebSocket so the map
 * always loads even when the server is unreachable.
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  decodeLocationUpdate,
  encodeLocationUpdate,
  LocationUpdate,
} from '../services/tracking/binaryProtocol';

// ─── Types ───────────────────────────────────────────────
export interface PeerLocation extends LocationUpdate {
  receivedAt: number;
}

export interface UseTrackingOptions {
  wsUrl: string;
  accessToken: string;
  groupId: string;
  numericUserId: number;
  updateIntervalMs?: number;
  enabled?: boolean;
}

export interface UseTrackingReturn {
  isConnected: boolean;
  peerLocations: Map<number, PeerLocation>;
  myLocation: Location.LocationObject | null;
  groupSize: number;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
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

  // Store latest option values so callbacks never go stale
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // ─── State ───────────────────────────────────────────
  const [isConnected, setIsConnected] = useState(false);
  const [peerLocations, setPeerLocations] = useState<Map<number, PeerLocation>>(new Map());
  const [myLocation, setMyLocation] = useState<Location.LocationObject | null>(null);
  const [groupSize, setGroupSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Keep myLocation in a ref so the WS send-loop reads the latest value
  const myLocationRef = useRef<Location.LocationObject | null>(null);
  useEffect(() => { myLocationRef.current = myLocation; }, [myLocation]);

  // ═══════════════════════════════════════════════════════
  // 1. GPS — runs independently of WebSocket
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled, updateIntervalMs]);

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

    const { wsUrl: url, accessToken: token, groupId: gid } = optionsRef.current;

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
      startSendLoop(ws);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer && event.data.byteLength === 40) {
        const update = decodeLocationUpdate(event.data);
        setPeerLocations((prev) => {
          const next = new Map(prev);
          next.set(update.userId, { ...update, receivedAt: Date.now() });
          return next;
        });
      } else if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          console.log('[Tracking] WS text message:', msg);
          if (msg.type === 'welcome') {
            setGroupSize(msg.groupSize);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    };

    ws.onerror = (e: any) => {
      // React Native's WS error event has a `message` property
      const errMsg = e?.message || 'unknown error';
      console.warn('[Tracking] WS error:', errMsg, e);
      setError(`WebSocket error: ${errMsg}`);
    };

    ws.onclose = (e: any) => {
      console.log('[Tracking] WS closed — code:', e?.code, 'reason:', e?.reason, 'disposed:', disposedRef.current);
      setIsConnected(false);
      stopSendLoop();

      // Only reconnect if we weren't intentionally disposed
      if (!disposedRef.current && optionsRef.current.enabled) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
        console.log(`[Tracking] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
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

  return { isConnected, peerLocations, myLocation, groupSize, error, connect, disconnect };
}
