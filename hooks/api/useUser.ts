import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import { useAppDispatch } from '@/store/hooks';
import { setOnboarded } from '@/store/slices/appSlice';
import { setUser } from '@/store/slices/authSlice';
import type { User } from '@/types/state';
import { useMutation, useQuery } from '@tanstack/react-query';

export interface UserSearchResult {
  id: string;
  name: string;
  userId: string;
  picture: string;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export function useSearchUsers(q: string, page = 1, limit = 10) {
  console.log(q, "q called....")
  return useQuery({
    queryKey: [...queryKeys.users.lists(), 'search', q, page, limit],
    queryFn: async () => {
      try {
        const response = await apiClient.get<UserSearchResponse>(
          endpoints.users.search,
          { params: { q, page, limit } },
        );
        console.log(response.data, "search response")
        return response.data;
      } catch (error) {
        logApiError(error, 'useSearchUsers');
        throw new Error(parseApiError(error));
      }
    },
    enabled: q.trim().length >= 3,
    staleTime: 30 * 1000,
  });
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<User>(endpoints.users.byId(id));
        return response.data;
      } catch (error) {
        logApiError(error, 'useUser');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!id,
  });
}

export interface UpdateUserRequest {
  fName?: string;
  lName?: string;
  userId?: string;
}

export function useUpdateUser() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: UpdateUserRequest): Promise<User> => {
      try {
        const response = await apiClient.patch<User>(endpoints.users.me, data);
        return response.data;
      } catch (error) {
        logApiError(error, 'useUpdateUser');
        throw new Error(parseApiError(error));
      }
    },

    onSuccess: (updatedUser) => {
      dispatch(setUser(updatedUser));
      if (updatedUser.userId) {
        dispatch(setOnboarded(true));
      }
    },
  });
}
