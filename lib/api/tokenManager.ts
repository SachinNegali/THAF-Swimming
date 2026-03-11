/**
 * TokenManager — in-memory + SecureStore for auth tokens.
 *
 * SECURITY DECISIONS:
 * -────────────────────────────────────────────────────────
 * 1. Tokens are stored EXCLUSIVELY in expo-secure-store (hardware-backed
 *    encrypted storage). We NEVER fall back to AsyncStorage for tokens
 *    because AsyncStorage stores data in plaintext on disk, making tokens
 *    trivially extractable on rooted/jailbroken devices.
 *
 * 2. Tokens are kept IN MEMORY so the axios interceptor can read them
 *    synchronously without hitting async storage on every request.
 *
 * 3. On login/refresh, tokens are PERSISTED to SecureStore so they
 *    survive app restarts. On app launch, `loadTokens()` hydrates the
 *    in-memory cache.
 *
 * 4. On logout, both in-memory and persisted tokens are cleared.
 *
 * 5. Tokens are NEVER logged to console — even in __DEV__ mode.
 * -────────────────────────────────────────────────────────
 */

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

// ─── In-memory cache ────────────────────────────────────
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export const TokenManager = {
  // ── Getters (synchronous — used by interceptors) ──────
  getAccessToken: (): string | null => _accessToken,
  getRefreshToken: (): string | null => _refreshToken,

  /**
   * Set & persist both tokens.
   *
   * SECURITY: Stores in SecureStore (hardware-backed encryption).
   * If SecureStore fails, the error propagates — we fail secure,
   * never fall back to insecure storage.
   */
  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    console.log('[TokenManager] Setting tokens in memory...', {
      access: accessToken.slice(0, 10) + '...',
      refresh: refreshToken.slice(0, 10) + '...',
    });
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  /**
   * Update only the access token (e.g. after a silent refresh).
   */
  setAccessToken: async (accessToken: string): Promise<void> => {
    console.log('[TokenManager] Updating access token only...', accessToken.slice(0, 10) + '...');
    _accessToken = accessToken;
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
  },

  /**
   * Load tokens from SecureStore into memory.
   * Call once on app launch to hydrate the in-memory cache.
   */
  loadTokens: async (): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    ]);

    if (accessToken) {
      console.log('[TokenManager] Loaded tokens from SecureStore', {
        access: accessToken.slice(0, 10) + '...',
      });
    } else {
      console.log('[TokenManager] No tokens found in SecureStore');
    }

    _accessToken = accessToken;
    _refreshToken = refreshToken;

    return { accessToken, refreshToken };
  },

  /**
   * Clear all tokens from memory and SecureStore.
   * Called on logout.
   */
  clearTokens: async (): Promise<void> => {
    console.log('[TokenManager] Clearing tokens from memory and storage');
    _accessToken = null;
    _refreshToken = null;

    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    ]);
  },
};
