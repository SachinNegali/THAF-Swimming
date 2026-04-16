import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
  CreateEmergencyContactRequest,
  Profile,
  ProfileFieldError,
  UpdateEmergencyContactRequest,
  UpdateProfileRequest,
} from '@/types/profile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Platform, ToastAndroid } from 'react-native';

/**
 * Shape of a validation error coming back from the `/profile` API.
 * Matches the zod error contract: `{ message, errors: [{ field, message }] }`.
 */
export interface ProfileValidationError {
  status?: number;
  message: string;
  fieldErrors: ProfileFieldError[];
}

export function asProfileError(err: unknown): ProfileValidationError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: ProfileFieldError[] }
      | undefined;
    return {
      status: err.response?.status,
      message: data?.message ?? parseApiError(err),
      fieldErrors: Array.isArray(data?.errors) ? data!.errors! : [],
    };
  }
  return { message: parseApiError(err), fieldErrors: [] };
}

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
  // iOS/web: callers can read `error.message` off the mutation result.
}

// ─── Read ────────────────────────────────────────────────

export function useProfile(enabled = true) {
  return useQuery<Profile, ProfileValidationError>({
    queryKey: queryKeys.profile.me(),
    queryFn: async (): Promise<Profile> => {
      try {
        const res = await apiClient.get<Profile>(endpoints.profile.base);
        return res.data;
      } catch (err) {
        logApiError(err, 'useProfile');
        throw asProfileError(err);
      }
    },
    enabled,
  });
}

// ─── Update top-level profile ───────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<Profile, ProfileValidationError, UpdateProfileRequest>({
    mutationFn: async (data) => {
      try {
        const res = await apiClient.patch<Profile>(
          endpoints.profile.base,
          data,
        );
        return res.data;
      } catch (err) {
        logApiError(err, 'useUpdateProfile');
        throw asProfileError(err);
      }
    },
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile.me(), profile);
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
      showToast('Profile updated');
    },
    onError: (err) => {
      showToast(err.message);
    },
  });
}

// ─── Emergency contacts: add / update / delete ──────────

export function useAddEmergencyContact() {
  const qc = useQueryClient();
  return useMutation<
    Profile,
    ProfileValidationError,
    CreateEmergencyContactRequest
  >({
    mutationFn: async (data) => {
      try {
        const res = await apiClient.post<Profile>(
          endpoints.profile.emergencyContacts,
          data,
        );
        return res.data;
      } catch (err) {
        logApiError(err, 'useAddEmergencyContact');
        throw asProfileError(err);
      }
    },
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile.me(), profile);
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
      showToast('Emergency contact added');
    },
    onError: (err) => {
      showToast(err.message);
    },
  });
}

export function useUpdateEmergencyContact() {
  const qc = useQueryClient();
  return useMutation<
    Profile,
    ProfileValidationError,
    { contactId: string; data: UpdateEmergencyContactRequest }
  >({
    mutationFn: async ({ contactId, data }) => {
      try {
        const res = await apiClient.patch<Profile>(
          endpoints.profile.emergencyContact(contactId),
          data,
        );
        return res.data;
      } catch (err) {
        logApiError(err, 'useUpdateEmergencyContact');
        throw asProfileError(err);
      }
    },
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile.me(), profile);
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
      showToast('Emergency contact updated');
    },
    onError: (err) => {
      showToast(err.message);
    },
  });
}

export function useDeleteEmergencyContact() {
  const qc = useQueryClient();
  return useMutation<Profile, ProfileValidationError, string>({
    mutationFn: async (contactId) => {
      try {
        const res = await apiClient.delete<Profile>(
          endpoints.profile.emergencyContact(contactId),
        );
        return res.data;
      } catch (err) {
        logApiError(err, 'useDeleteEmergencyContact');
        throw asProfileError(err);
      }
    },
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile.me(), profile);
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
      showToast('Emergency contact removed');
    },
    onError: (err) => {
      showToast(err.message);
    },
  });
}
