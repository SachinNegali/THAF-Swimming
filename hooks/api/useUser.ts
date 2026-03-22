import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { setOnboarded } from '@/store/slices/appSlice';
import type { User } from '@/types/state';
import { useMutation } from '@tanstack/react-query';

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
