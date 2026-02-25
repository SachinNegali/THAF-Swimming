import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Try to use expo-secure-store (encrypted, hardware-backed).
 * Falls back to AsyncStorage when the native module is absent
 * (e.g. running inside Expo Go where SecureStore isn't linked).
 */
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // Native module unavailable — will use AsyncStorage instead.
  console.warn(
    'expo-secure-store native module not found — falling back to AsyncStorage.',
  );
}

/**
 * TokenManager — in-memory + secure storage for auth tokens.
 *
 * Design rationale:
 * - Tokens are kept **in memory** so the axios interceptor can read them
 *   synchronously without hitting async storage on every request.
 * - On login / refresh, tokens are **persisted** to SecureStore (or
 *   AsyncStorage as fallback) so they survive app restarts. On app
 *   launch, `loadTokens()` hydrates the in-memory cache.
 * - On logout, both in-memory and persisted tokens are cleared.
 */

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

// ─── Storage helpers (SecureStore → AsyncStorage fallback) ──
async function setItem(key: string, value: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

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
      setItem(KEYS.ACCESS_TOKEN, accessToken),
      setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  // ── Update only the access token (after a silent refresh) ─
  setAccessToken: async (accessToken: string) => {
    _accessToken = accessToken;
    await setItem(KEYS.ACCESS_TOKEN, accessToken);
  },

  // ── Load from storage into memory (call on app launch) ─
  loadTokens: async (): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> => {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(KEYS.ACCESS_TOKEN),
      getItem(KEYS.REFRESH_TOKEN),
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
      deleteItem(KEYS.ACCESS_TOKEN),
      deleteItem(KEYS.REFRESH_TOKEN),
    ]);
  },
};
