import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { TokenManager } from '@/lib/api/tokenManager';
import {
  GoogleAuthError,
  GoogleAuthErrorCodes,
  signInWithGoogle,
  signOutGoogle,
} from '@/lib/auth/googleAuth';
import { queryKeys } from '@/lib/react-query/queryClient';
import { useAppDispatch } from '@/store/hooks';
import {
  logout as logoutAction,
  setAuthLoading,
  setCredentials,
} from '@/store/slices/authSlice';
import type { AuthResponse, GoogleAuthRequest } from '@/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Google login mutation.
 *
 * SECURITY FLOW:
 * 1. Trigger native Google account picker via signInWithGoogle()
 * 2. Extract ONLY the idToken (profile data is discarded)
 * 3. POST idToken to /auth/google — backend verifies with Google servers
 * 4. Persist returned tokens to SecureStore via TokenManager
 * 5. Store user + tokens in Redux for in-app access
 * 6. Axios interceptor now reads tokens from TokenManager (in-memory)
 *
 * WHY NOT useSocialLogin?
 * The old useSocialLogin sent email/name/photo from the frontend which is
 * insecure — a malicious client could send a valid idToken with forged
 * profile data. The backend must extract profile info from the idToken itself.
 */
export function useGoogleLogin() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AuthResponse> => {
      dispatch(setAuthLoading(true));

      try {
        // Step 1: Get idToken from Google (discards profile data)
        const data = await signInWithGoogle();
        console.log("GOOGLE SIGNIN DATYA....", data);
        const { idToken } = data;
        // Step 2: Send ONLY the idToken to backend for verification
        const payload: GoogleAuthRequest = { idToken };
        const response = await apiClient.post<AuthResponse>(
          endpoints.auth.google,
          payload,
        );
        console.log("BACKEND RESPONSE....", response.data);
        return response.data;
      } catch (error) {
        // Don't surface cancellation or in-progress as errors
        console.log("ERROR IN GOOGLE LOGIN....", error, error?.response?.data, "...BAD REQ?", {...error});
        if (error instanceof GoogleAuthError) {
          if (
            error.code === GoogleAuthErrorCodes.CANCELLED ||
            error.code === GoogleAuthErrorCodes.IN_PROGRESS
          ) {
            // Rethrow silently — onError can check the code
            throw error;
          }
        }

        logApiError(error, 'useGoogleLogin');
        console.log("ERROR IN PARSE API ERROR....", error, error?.response?.data);
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
        }),
      );

      // 3. Cache user data in React Query
      qc.setQueryData(queryKeys.auth.currentUser(), data.user);
    },
  });
}

/**
 * Logout mutation.
 *
 * SECURITY FLOW:
 * 1. Call backend /auth/logout to invalidate the refresh token server-side
 * 2. Clear tokens from SecureStore + in-memory cache
 * 3. Revoke Google access (forces re-consent on next sign-in)
 * 4. Sign out from Google locally
 * 5. Clear Redux and React Query state
 *
 * Each step is best-effort — if any fails, we continue with the rest.
 * A user should always be able to log out even if the network is down.
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Step 1: Tell backend to invalidate the refresh token (best-effort)
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          await apiClient.post(endpoints.auth.logout, { refreshToken });
        } catch {
          // Best-effort: don't block logout if backend is unreachable.
          // The token will expire naturally.
        }
      }

      // Step 2: Clear tokens from SecureStore + memory
      await TokenManager.clearTokens();

      // Step 3: Revoke Google access + local sign-out
      await signOutGoogle();
    },

    onSuccess: () => {
      // Step 4: Clear all app state
      dispatch(logoutAction());
      qc.clear();
    },
  });
}
