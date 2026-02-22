import { store } from '@/store';
import { logout, updateTokens } from '@/store/slices/authSlice';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './endpoints';
import { TokenManager } from './tokenManager';

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

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status !== 401 || originalRequest._retry) {
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

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint (uses a fresh axios instance to avoid interceptor loop)
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
        refreshToken,
      });

      // Backend returns the same nested tokens format
      const { access, refresh } = response.data.tokens ?? response.data;

      const newAccessToken = access?.token ?? response.data.accessToken;
      const newRefreshToken = refresh?.token ?? response.data.refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

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
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed — log out the user
      processQueue(refreshError, null);
      await TokenManager.clearTokens();
      store.dispatch(logout());
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
