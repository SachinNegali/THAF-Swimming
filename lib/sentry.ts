import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

const routingInstrumentation = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.warn('[Sentry] No DSN configured — skipping initialization. Set EXPO_PUBLIC_SENTRY_DSN to enable.');
    }
    return;
  }

  if (isRunningInExpoGo()) {
    if (__DEV__) {
      console.warn('[Sentry] Running in Expo Go — skipping native initialization.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
    enabled: !__DEV__,

    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    integrations: [routingInstrumentation],

    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30_000,

    attachScreenshot: true,
    attachViewHierarchy: true,

    enableCaptureFailedRequests: true,

    beforeSend(event) {
      if (__DEV__) {
        console.log('[Sentry] Event captured:', event.event_id);
      }
      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },
  });
}

export { routingInstrumentation };
export { Sentry };
