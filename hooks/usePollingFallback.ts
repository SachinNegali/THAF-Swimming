/**
 * usePollingFallback — HTTP long-polling fallback for location tracking.
 *
 * Dormant by default. Activated via startPolling() when WebSocket fails.
 * Feeds decoded location frames into the same onLocationUpdate handler
 * as the WebSocket path, so the map UI is transport-agnostic.
 *
 * Transport rules (enforced by caller):
 * - Only one transport is active at a time (WS or polling, never both sending).
 * - When WS reconnects, the caller must call stopPolling().
 */

import { useCallback, useRef, useState } from 'react';
import { refreshAccessToken } from '../lib/api/refreshToken';
import {
  decodeLocationUpdate,
  encodeLocationUpdate,
  LocationUpdate,
} from '../services/tracking/binaryProtocol';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PollingLocation {
  lat: number;
  lng: number;
  speed: number;   // km/h
  bearing: number; // degrees
}

export interface UsePollingFallbackOptions {
  /**
   * HTTP base URL of the tracking server.
   * Derive from wsUrl by replacing wss:// → https:// (or ws:// → http://).
   * e.g. "https://api.tankhalfull.com/tracking"
   */
  pollBaseUrl: string;
  numericUserId: number;
  updateIntervalMs?: number;
  /** Returns current GPS location for outbound frames; null if not ready. */
  getLocation: () => PollingLocation | null;
  /** Called for every decoded inbound location frame — same handler as WS path. */
  onLocationUpdate: (update: LocationUpdate) => void;
}

export interface UsePollingFallbackReturn {
  isPolling: boolean;
  startPolling: (groupId: string, accessToken: string) => void;
  stopPolling: () => void;
  error: Error | null;
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Interruptible sleep — rejects with AbortError when signal fires. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function usePollingFallback({
  pollBaseUrl,
  numericUserId,
  updateIntervalMs = 2000,
  getLocation,
  onLocationUpdate,
}: UsePollingFallbackOptions): UsePollingFallbackReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Session-level abort controller — aborted by stopPolling()
  const sessionAbortRef = useRef<AbortController | null>(null);
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling session state (stable refs — no stale-closure issues)
  const groupIdRef = useRef('');
  const tokenRef = useRef('');
  const sinceRef = useRef(0);
  const activeRef = useRef(false);

  // Keep caller-provided callbacks stable
  const getLocationRef = useRef(getLocation);
  getLocationRef.current = getLocation;
  const onLocationUpdateRef = useRef(onLocationUpdate);
  onLocationUpdateRef.current = onLocationUpdate;
  const numericUserIdRef = useRef(numericUserId);
  numericUserIdRef.current = numericUserId;
  const updateIntervalRef = useRef(updateIntervalMs);
  updateIntervalRef.current = updateIntervalMs;

  // ── Outbound: send location frames at the same interval as WS ────────────
  const startSendLoop = useCallback(() => {
    if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);

    sendIntervalRef.current = setInterval(async () => {
      if (!activeRef.current) return;

      const loc = getLocationRef.current();
      if (!loc) return;

      const buffer = encodeLocationUpdate(
        numericUserIdRef.current,
        loc.lat,
        loc.lng,
        loc.speed,
        loc.bearing,
        1, // active status
      );
      const data = arrayBufferToBase64(buffer);

      const doSend = (token: string) =>
        fetch(`${pollBaseUrl}/poll/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ groupId: groupIdRef.current, data }),
        });

      try {
        let response = await doSend(tokenRef.current);

        if (response.status === 401) {
          const newToken = await refreshAccessToken();
          tokenRef.current = newToken;
          response = await doSend(newToken);
        }

        if (!response.ok) {
          console.warn('[Polling] POST /poll/send failed:', response.status);
        }
      } catch (e) {
        console.warn('[Polling] POST /poll/send error:', e);
      }
    }, updateIntervalRef.current);
  }, [pollBaseUrl]);

  const stopSendLoop = useCallback(() => {
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
  }, []);

  // ── Inbound: long-poll loop — re-polls immediately after every response ───
  const runPollLoop = useCallback(async (signal: AbortSignal) => {
    const INITIAL_BACKOFF = 2_000;
    const MAX_BACKOFF = 15_000;
    let backoff = INITIAL_BACKOFF;

    const buildUrl = (token: string) =>
      `${pollBaseUrl}/poll/updates` +
      `?groupId=${encodeURIComponent(groupIdRef.current)}` +
      `&since=${sinceRef.current}` +
      `&token=${encodeURIComponent(token)}`;

    while (activeRef.current && !signal.aborted) {
      try {
        let response = await fetch(buildUrl(tokenRef.current), { signal });

        // ── 401 → refresh once, then retry ──────────────────────────────────
        if (response.status === 401) {
          try {
            const newToken = await refreshAccessToken();
            tokenRef.current = newToken;
            response = await fetch(buildUrl(newToken), { signal });
          } catch (refreshErr) {
            // refreshAccessToken handles clearTokens + logout on 401/403 itself.
            const e =
              refreshErr instanceof Error ? refreshErr : new Error('Auth failed');
            setError(e);
            activeRef.current = false;
            setIsPolling(false);
            return;
          }
        }

        // Still 401 after refresh — give up
        if (response.status === 401) {
          const e = new Error('Authentication failed after token refresh');
          setError(e);
          activeRef.current = false;
          setIsPolling(false);
          return;
        }

        // ── 5xx / other server error → backoff and retry ─────────────────────
        if (!response.ok) {
          console.warn(`[Polling] GET /poll/updates ${response.status} — retrying in ${backoff}ms`);
          await sleep(backoff, signal);
          backoff = Math.min(backoff * 2, MAX_BACKOFF);
          continue;
        }

        backoff = INITIAL_BACKOFF; // reset on success

        // ── Parse and forward messages ────────────────────────────────────────
        const json = await response.json();
        const messages: Array<{ userId: string; data: string; ts: number }> =
          json.messages ?? [];

        for (const msg of messages) {
          try {
            const buffer = base64ToArrayBuffer(msg.data);
            const update = decodeLocationUpdate(buffer);
            onLocationUpdateRef.current(update);
            if (msg.ts > sinceRef.current) {
              sinceRef.current = msg.ts;
            }
          } catch (e) {
            console.warn('[Polling] Failed to decode message:', e);
          }
        }

        // Immediately re-poll (spec: "re-poll immediately after every response")
      } catch (err) {
        if (signal.aborted || (err as any)?.name === 'AbortError') break;

        console.warn(`[Polling] GET /poll/updates error — retrying in ${backoff}ms:`, err);
        try {
          await sleep(backoff, signal);
        } catch {
          break; // aborted during backoff sleep
        }
        backoff = Math.min(backoff * 2, MAX_BACKOFF);
      }
    }
  }, [pollBaseUrl]);

  // ── startPolling ─────────────────────────────────────────────────────────
  const startPolling = useCallback((groupId: string, accessToken: string) => {
    if (activeRef.current) {
      console.log('[Polling] Already active, skipping');
      return;
    }

    console.log('[Polling] Starting long-poll fallback for group:', groupId);
    groupIdRef.current = groupId;
    tokenRef.current = accessToken;
    sinceRef.current = 0;
    activeRef.current = true;
    setIsPolling(true);
    setError(null);

    const controller = new AbortController();
    sessionAbortRef.current = controller;

    runPollLoop(controller.signal).catch((e) => {
      if ((e as any)?.name !== 'AbortError') {
        console.warn('[Polling] Poll loop exited unexpectedly:', e);
      }
    });

    startSendLoop();
  }, [runPollLoop, startSendLoop]);

  // ── stopPolling ──────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (!activeRef.current) return;
    console.log('[Polling] Stopping long-poll fallback');

    activeRef.current = false;
    sessionAbortRef.current?.abort();
    sessionAbortRef.current = null;
    stopSendLoop();
    setIsPolling(false);

    // Notify server (best-effort — do not block on this)
    const token = tokenRef.current;
    const groupId = groupIdRef.current;
    if (token && groupId) {
      fetch(
        `${pollBaseUrl}/poll/leave` +
          `?groupId=${encodeURIComponent(groupId)}` +
          `&token=${encodeURIComponent(token)}`,
        { method: 'DELETE' },
      ).catch((e) => console.warn('[Polling] DELETE /poll/leave failed (non-critical):', e));
    }

    sinceRef.current = 0;
    tokenRef.current = '';
    groupIdRef.current = '';
  }, [pollBaseUrl, stopSendLoop]);

  return { isPolling, startPolling, stopPolling, error };
}
