import * as SecureStore from 'expo-secure-store';

/**
 * TokenManager — in-memory + secure storage for auth tokens.
 *
 * Design rationale:
 * - Tokens are kept **in memory** so the axios interceptor can read them
 *   synchronously without hitting async storage on every request.
 * - On login / refresh, tokens are **persisted** to SecureStore so
 *   they survive app restarts. On app launch, `loadTokens()` hydrates
 *   the in-memory cache from SecureStore.
 * - On logout, both in-memory and persisted tokens are cleared.
 */

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

// ─── In-memory cache ────────────────────────────────────
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export const TokenManager = {
  // ── Getters (synchronous — used by interceptors) ──────
  getAccessToken: () => _accessToken,
  getRefreshToken: () => _refreshToken,

  // ── Set & persist ─────────────────────────────────────
  setTokens: async (accessToken: string, refreshToken: string) => {
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  // ── Update only the access token (after a silent refresh) ─
  setAccessToken: async (accessToken: string) => {
    _accessToken = accessToken;
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
  },

  // ── Load from SecureStore into memory (call on app launch) ─
  loadTokens: async (): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    ]);

    _accessToken = accessToken;
    _refreshToken = refreshToken;

    return { accessToken, refreshToken };
  },

  // ── Clear everything (on logout) ──────────────────────
  clearTokens: async () => {
    _accessToken = null;
    _refreshToken = null;

    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    ]);
  },
};
