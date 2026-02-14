import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import { useAppDispatch } from '@/store/hooks';
import { logout as logoutAction, setAuthLoading, setCredentials } from '@/store/slices/authSlice';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch current user profile
 */
export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<User>(endpoints.auth.currentUser);
        return response.data;
      } catch (error) {
        logApiError(error, 'useCurrentUser');
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      try {
        dispatch(setAuthLoading(true));
        const response = await apiClient.post<AuthResponse>(
          endpoints.auth.login,
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useLogin');
        throw new Error(parseApiError(error));
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    onSuccess: (data) => {
      // Update Redux store with credentials
      dispatch(setCredentials({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));
      
      // Set user in query cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      try {
        dispatch(setAuthLoading(true));
        const response = await apiClient.post<AuthResponse>(
          endpoints.auth.register,
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useRegister');
        throw new Error(parseApiError(error));
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    onSuccess: (data) => {
      dispatch(setCredentials({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));
      
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(endpoints.auth.logout);
      } catch (error) {
        logApiError(error, 'useLogout');
        // Continue with logout even if API call fails
      }
    },
    onSuccess: () => {
      // Clear Redux state
      dispatch(logoutAction());
      
      // Clear all query cache
      queryClient.clear();
    },
  });
}

/**
 * Social login mutation
 */
export function useSocialLogin(provider: 'google' | 'facebook' | 'apple') {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string) => {
      try {
        dispatch(setAuthLoading(true));
        const response = await apiClient.post<AuthResponse>(
          endpoints.auth.socialLogin(provider),
          { token }
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useSocialLogin');
        throw new Error(parseApiError(error));
      } finally {
        dispatch(setAuthLoading(false));
      }
    },
    onSuccess: (data) => {
      dispatch(setCredentials({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));
      
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
    },
  });
}
