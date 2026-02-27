import { useDeviceRegistration } from '@/hooks/api/useDeviceRegistration';
import {
    NotificationData,
    registerForPushNotificationsAsync,
    resolveNotificationRoute,
} from '@/lib/notifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    addNotification,
    setExpoPushToken,
    setPermissionStatus,
} from '@/store/slices/notificationSlice';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';

// ─── Foreground notification behaviour ────────────────────
// Show the notification banner even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Manages the push-notification lifecycle:
 *  • Registers for push on mount (when authenticated)
 *  • Sends token to backend via device registration API
 *  • Listens for incoming notifications (foreground)
 *  • Handles notification taps → deeplink navigation
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { mutate: registerDevice } = useDeviceRegistration();

  // Refs for listener subscriptions
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ── 1. Register when authenticated ──────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    (async () => {
      const token = await registerForPushNotificationsAsync();

      if (cancelled) return;

      if (token) {
        dispatch(setExpoPushToken(token));
        dispatch(setPermissionStatus('granted'));

        // Send token to the backend
        registerDevice(token);

        console.log('Expo push token:', token);
      } else {
        dispatch(setPermissionStatus('denied'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ── 2. Notification listeners ───────────────────────────
  useEffect(() => {
    // Fires when notification is received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;
        dispatch(
          addNotification({
            id: notification.request.identifier,
            title: title ?? '',
            body: body ?? '',
            data: (data as Record<string, unknown>) ?? {},
            receivedAt: new Date().toISOString(),
          })
        );
      });

    // Fires when the user taps a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as NotificationData;

        const route = resolveNotificationRoute(data);

        // Use setTimeout to ensure navigation happens after the app is
        // fully mounted (handles cold-start tap scenarios).
        setTimeout(() => {
          router.push(route as any);
        }, 100);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── 3. Handle notification that launched the app ────────
  useEffect(() => {
    // If the app was opened by tapping a notification (cold start),
    // handle the initial notification response.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const data = response.notification.request.content
        .data as NotificationData;
      const route = resolveNotificationRoute(data);

      setTimeout(() => {
        router.push(route as any);
      }, 500); // Slightly longer delay for cold-start
    });
  }, []);

  return <>{children}</>;
}
