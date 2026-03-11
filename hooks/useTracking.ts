/**
 * useTracking — Real-time WebSocket location tracking hook
 *
 * Connects to the tracking server, sends/receives 40-byte binary
 * location messages, and manages connection lifecycle.
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
  wsUrl: string;            // "ws://<HOST>:9001"
  accessToken: string;
  groupId: string;
  numericUserId: number;    // from objectIdToNumericId()
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

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  const [isConnected, setIsConnected] = useState(false);
  const [peerLocations, setPeerLocations] = useState<Map<number, PeerLocation>>(new Map());
  const [myLocation, setMyLocation] = useState<Location.LocationObject | null>(null);
  const [groupSize, setGroupSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ─── Location send loop ──────────────────────────────
  const startLocationUpdates = useCallback(
    async (ws: WebSocket) => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      intervalRef.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          setMyLocation(loc);

          if (ws.readyState === WebSocket.OPEN) {
            const msg = encodeLocationUpdate(
              numericUserId,
              loc.coords.latitude,
              loc.coords.longitude,
              Math.round((loc.coords.speed ?? 0) * 3.6), // m/s → km/h
              Math.round(loc.coords.heading ?? 0),
              1, // status: active
            );
            ws.send(msg);
          }
        } catch (err) {
          console.warn('[Tracking] Location error:', err);
        }
      }, updateIntervalMs);
    },
    [numericUserId, updateIntervalMs],
  );

  const stopLocationUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── Connect ─────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${wsUrl}/?token=${encodeURIComponent(accessToken)}&groupId=${encodeURIComponent(groupId)}`;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      startLocationUpdates(ws);
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
          if (msg.type === 'welcome') {
            setGroupSize(msg.groupSize);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      stopLocationUpdates();

      if (enabled) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [wsUrl, accessToken, groupId, enabled, startLocationUpdates, stopLocationUpdates]);

  // ─── Disconnect ──────────────────────────────────────
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    stopLocationUpdates();
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, [stopLocationUpdates]);

  // ─── AppState: pause in background ───────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && enabled) connect();
      else if (state === 'background') disconnect();
    });
    return () => sub.remove();
  }, [connect, disconnect, enabled]);

  // ─── Auto connect / disconnect ───────────────────────
  useEffect(() => {
    if (enabled) connect();
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return { isConnected, peerLocations, myLocation, groupSize, error, connect, disconnect };
}
