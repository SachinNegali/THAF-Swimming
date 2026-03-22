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
  setInitialized,
} from '@/store/slices/authSlice';
import { setOnboarded } from '@/store/slices/appSlice';
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
        const { idToken } = await signInWithGoogle();

        // Step 2: Send ONLY the idToken to backend for verification
        const payload: GoogleAuthRequest = { idToken };
        const response = await apiClient.post<AuthResponse>(
          endpoints.auth.google,
          payload,
        );

        const authData = response.data;
        const accessToken = authData.tokens.access.token;
        const refreshToken = authData.tokens.refresh.token;

        // Step 3: Store tokens BEFORE returning — this is critical.
        // If we did this in onSuccess, React Query would resolve the mutation
        // first, triggering navigation & API calls before tokens are stored.
        await TokenManager.setTokens(accessToken, refreshToken);

        // Step 4: Update Redux (triggers isAuthenticated → navigation)
        dispatch(
          setCredentials({
            user: authData.user,
            accessToken,
            refreshToken,
          }),
        );

        // Step 5: Set onboarding status based on whether userId is set
        dispatch(setOnboarded(!!authData.user.userId));

        // Step 6: Cache user in React Query
        qc.setQueryData(queryKeys.auth.currentUser(), authData.user);

        return authData;
      } catch (error) {
        // Don't surface cancellation or in-progress as errors
        if (error instanceof GoogleAuthError) {
          if (
            error.code === GoogleAuthErrorCodes.CANCELLED ||
            error.code === GoogleAuthErrorCodes.IN_PROGRESS
          ) {
            throw error;
          }
        }

        logApiError(error, 'useGoogleLogin');
        throw new Error(parseApiError(error));
      } finally {
        dispatch(setAuthLoading(false));
      }
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

/**
 * Hook to initialize authentication on app launch.
 *
 * FLOW:
 * 1. Load tokens from SecureStore
 * 2. If present, fetch /users/me to verify and get profile
 * 3. Update Redux state
 * 4. Set isInitialized = true
 */
export function useInitializeAuth() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        // Step 1: Load tokens from storage
        const { accessToken, refreshToken } = await TokenManager.loadTokens();

        if (accessToken && refreshToken) {
          try {
            // Step 2: Verify tokens by fetching user profile
            const response = await apiClient.get<AuthResponse['user']>(
              endpoints.users.me
            );
            const user = response.data;

            // Step 3: Update Redux
            dispatch(
              setCredentials({
                user,
                accessToken,
                refreshToken,
              })
            );

            // Step 4: Set onboarding status based on whether userId is set
            dispatch(setOnboarded(!!(user as any).userId));

            // Step 5: Populate Query Cache
            qc.setQueryData(queryKeys.auth.currentUser(), user);
          } catch (error) {
            // If verification fails (e.g. 401), the axios interceptor
            // will have already tried to refresh. If we're here, it means
            // both tokens are invalid or the network is down.
            console.warn('[useInitializeAuth] Verification failed:', error);
            await TokenManager.clearTokens();
            dispatch(logoutAction());
          }
        }
      } catch (error) {
        console.error('[useInitializeAuth] Critical failure:', error);
      } finally {
        // Always mark as initialized so splash screen can move on
        dispatch(setInitialized(true));
      }
    },
  });
}
