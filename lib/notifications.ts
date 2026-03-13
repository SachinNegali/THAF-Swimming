import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Types ─────────────────────────────────────────────────
export interface NotificationData {
  type?: string;
  chatId?: string;
  tripId?: string;
  groupId?: string;
  eventId?: string;
  [key: string]: unknown;
}

// ─── Android Channel ──────────────────────────────────────
/**
 * Creates the default Android notification channel.
 * No-op on iOS. Must be called before any notification is displayed.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E6F4FE',
      sound: 'default',
    });
  }
}

// ─── Registration ─────────────────────────────────────────
/**
 * Requests permissions, creates the Android channel, and returns
 * the Expo push token. Returns `null` when running on a simulator
 * or if the user denies the permission prompt.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices.
  // Safety check if native module is missing
  if (!Device || typeof Device.isDevice === 'undefined') {
    console.warn('ExpoDevice native module is not available');
    return null;
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Ensure Android channel exists before requesting permissions
  await setupNotificationChannel();

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get the native FCM device push token (for Firebase Admin SDK)
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    console.log('FCM Token:', tokenData.data);
    return tokenData.data as string;
  } catch (error) {
    console.error('Failed to get FCM device token:', error);
    return null;
  }
}

// ─── Deeplink Resolution ──────────────────────────────────
/**
 * Maps notification data to an in-app route for deeplink navigation.
 * Falls back to the home tab if the notification type is unrecognised.
 */
export function resolveNotificationRoute(data: NotificationData): string {
  switch (data.type) {
    case 'chat_message':
      return data.chatId ? `/chat/${data.chatId}` : '/(tabs)';

    case 'trip_invite':
    case 'trip_update':
      return data.tripId ? `/tripDetails?id=${data.tripId}` : '/(tabs)';

    case 'group_invite':
    case 'group_update':
      return data.groupId ? `/groupInfo?id=${data.groupId}` : '/(tabs)';

    case 'event_update':
    case 'event_invite':
      return '/(tabs)/explore';

    default:
      return '/(tabs)';
  }
}
