/**
 * refreshAccessToken — shared token-refresh helper.
 *
 * Used by axios-based flows (via client.ts interceptor), WebSocket tracking
 * (useTracking), SSE chat (useSSE), and the long-poll fallback
 * (usePollingFallback). All four need the same semantics:
 *
 *   1. Call POST /auth/refresh with the current refresh token.
 *   2. On success: persist the new tokens (SecureStore via TokenManager) AND
 *      sync Redux via updateTokens — callers that read from Redux pick up
 *      the new value on their next render.
 *   3. On 401/403 from the refresh endpoint: clear tokens and dispatch
 *      logout so the app falls back to the auth screen.
 *   4. Dedupe concurrent calls — if a refresh is already in flight, return
 *      the same promise so parallel subscribers don't hammer the endpoint.
 *
 * Note: we intentionally use fetch (not apiClient) to avoid the axios
 * interceptor's own 401→refresh path, which would recurse.
 */

import { store } from '../../store';
import { logout, updateTokens } from '../../store/slices/authSlice';
import { API_BASE_URL } from './endpoints';
import { TokenManager } from './tokenManager';

let inFlight: Promise<string> | null = null;

export interface RefreshError extends Error {
  status?: number;
}

export function refreshAccessToken(): Promise<string> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        const err: RefreshError = new Error('No refresh token available');
        err.status = 401;
        throw err;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const err: RefreshError = new Error(`Token refresh failed (${response.status})`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const { access, refresh } = data.tokens ?? data;
      const newAccessToken =
        access?.token ?? data.accessToken ?? (typeof access === 'string' ? access : null);
      const newRefreshToken =
        refresh?.token ?? data.refreshToken ?? (typeof refresh === 'string' ? refresh : refreshToken);

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

      await TokenManager.setTokens(newAccessToken, newRefreshToken);
      store.dispatch(
        updateTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken }),
      );

      return newAccessToken;
    } catch (err) {
      const status = (err as RefreshError)?.status;
      if (status === 401 || status === 403) {
        await TokenManager.clearTokens();
        store.dispatch(logout());
      }
      throw err;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
