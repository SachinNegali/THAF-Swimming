import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';

interface RegisterDevicePayload {
  token: string;
  platform: 'ios' | 'android';
}

/**
 * Registers the device's FCM push token with the backend.
 * Should be called once after obtaining a push token and
 * confirming the user is authenticated.
 */
export function useDeviceRegistration() {
  return useMutation({
    mutationFn: async (token: string) => {
      console.log('Registering device with token:', token);
      const payload: RegisterDevicePayload = {
        token,
        platform: Platform.OS as 'ios' | 'android',
      };
      console.log('Registering device with payload:', payload);
      const { data } = await apiClient.post(
        endpoints.devices.register,
        payload
      );
      return data;
    },
    onError: (error) => {
      console.error('Device registration failed:', error);
    },
  });
}
