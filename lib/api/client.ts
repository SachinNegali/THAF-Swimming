import { TokenManager } from '@/lib/api/tokenManager';
import { store } from '@/store';
import { logout, updateTokens } from '@/store/slices/authSlice';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './endpoints';

/**
 * Axios instance with interceptors for authentication and error handling.
 *
 * Token strategy:
 * - Request interceptor reads the **in-memory** access token from
 *   TokenManager (synchronous — no async storage hit per request).
 * - Response interceptor catches 401s, uses the refresh token to
 *   get a new access token, persists it, and retries the original request.
 * - A mutex (`isRefreshing` + `failedQueue`) prevents multiple
 *   concurrent refresh calls if several requests 401 simultaneously.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Refresh mutex ──────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  for (const { resolve, reject } of failedQueue) {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  }
  failedQueue = [];
};

// ─── Request interceptor ────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getAccessToken();
    // console.log("THIS IS TOKEN IN A CALLL",  token)
    // console.log("THIS IS API BASE URL", API_BASE_URL)
    console.log("THIS IS CONFIG URL...", config?.url)

    if (token && config.headers) {
      // Use set method if available (AxiosHeaders), otherwise direct assignment
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor (401 → refresh → retry) ──────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and if we haven't retried yet
    // Skip auth endpoints — they should never trigger a token refresh
    const isAuthRequest = originalRequest.url?.includes('/auth/');
    if (error.response?.status !== 401 || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = TokenManager.getRefreshToken();
      console.log("THIS IS REFRESH TOKEN IN A CALLL",  refreshToken)
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint (uses a fresh axios instance to avoid interceptor loop)
      console.log('[Auth] Attempting token refresh...');
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      console.log('[Auth] Refresh response status:', response.status, 'data keys:', Object.keys(response.data ?? {}));

      // Backend returns the same nested tokens format
      const { access, refresh } = response.data.tokens ?? response.data;

      const newAccessToken = access?.token ?? response.data.accessToken ?? (typeof access === 'string' ? access : null);
      const newRefreshToken = refresh?.token ?? response.data.refreshToken ?? (typeof refresh === 'string' ? refresh : null);

      if (!newAccessToken) {
        console.error('[Auth] Refresh failed: No access token in response', response.data);
        throw new Error('No access token in refresh response');
      }

      console.log('[Auth] Refresh successful. New access token acquired.');

      // Persist new tokens (in memory + SecureStore)
      await TokenManager.setTokens(newAccessToken, newRefreshToken || refreshToken);

      // Keep Redux in sync
      store.dispatch(
        updateTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || refreshToken,
        })
      );

      // Process any waiting requests
      processQueue(null, newAccessToken);

      // Retry the original request
      if (originalRequest.headers) {
        if (typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        } else {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
      }

      console.log(`[Auth] Retrying original request: ${originalRequest.url}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      const refreshStatus =
        refreshError instanceof AxiosError
          ? refreshError.response?.status
          : undefined;

      console.log('[Auth] Refresh failed — status:', refreshStatus, 'error:', refreshError instanceof Error ? refreshError.message : refreshError);

      if (refreshStatus === 401 || refreshStatus === 403 || !TokenManager.getRefreshToken()) {
        console.log('[Auth] Logging out — refresh rejected or no refresh token');
        await TokenManager.clearTokens();
        store.dispatch(logout());
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * API Error type
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
