import { useInitializeAuth } from '@/hooks/api/useAuth';
import { queryClient } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Inner component to trigger auth initialization.
 * Must be inside ReduxProvider and QueryClientProvider.
 * Centralized provider wrapper for the entire app.
 * Order matters: Redux → React Query → Notifications → Realtime.
 *
 * On mount, hydrates tokens from SecureStore into memory + Redux
 * so the axios interceptor has the access token ready from the start.
 */
function AuthInitializer() {
  const { mutate: initializeAuth } = useInitializeAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return null;
}

/**
 * Centralized provider wrapper for the entire app.
 * Order matters: Redux → React Query → Auth → Realtime → Children.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
        <AuthProvider>
         <NotificationProvider>
          {/* <RealtimeProvider> */}
            {children}
          {/* </RealtimeProvider> */}
          </NotificationProvider>
        </AuthProvider>
          {/* <NotificationProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
           </NotificationProvider> */}
      </QueryClientProvider>
    </ReduxProvider>
  );
}

