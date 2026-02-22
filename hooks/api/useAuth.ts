import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { TokenManager } from '@/lib/api/tokenManager';
import { queryKeys } from '@/lib/react-query/queryClient';
import { useAppDispatch } from '@/store/hooks';
import {
    logout as logoutAction,
    setAuthLoading,
    setCredentials,
} from '@/store/slices/authSlice';
import type { AuthResponse, SocialLoginRequest } from '@/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Social login mutation.
 *
 * Flow:
 * 1. POST /auth/social-login with provider + credentials
 * 2. Persist tokens to SecureStore via TokenManager
 * 3. Store user + tokens in Redux for in-app access
 * 4. Axios interceptor now reads tokens from TokenManager (in-memory)
 */
export function useSocialLogin() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: SocialLoginRequest) => {
      try {
        dispatch(setAuthLoading(true));
        const response = await apiClient.post<AuthResponse>(
          endpoints.auth.socialLogin,
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useSocialLogin');
        throw new Error(parseApiError(error));
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    onSuccess: async (data) => {
      const accessToken = data.tokens.access.token;
      const refreshToken = data.tokens.refresh.token;

      // 1. Persist tokens securely (in-memory + SecureStore)
      await TokenManager.setTokens(accessToken, refreshToken);

      // 2. Store in Redux for UI access
      dispatch(
        setCredentials({
          user: data.user,
          accessToken,
          refreshToken,
        })
      );

      // 3. Cache user data in React Query
      qc.setQueryData(queryKeys.auth.currentUser(), data.user);
    },
  });
}

/**
 * Logout — clears tokens from SecureStore and Redux, wipes query cache.
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await TokenManager.clearTokens();
    },
    onSuccess: () => {
      dispatch(logoutAction());
      qc.clear();
    },
  });
}
