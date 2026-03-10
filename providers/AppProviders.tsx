import { useInitializeAuth } from '@/hooks/api/useAuth';
import { queryClient } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { AuthProvider } from './AuthContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Inner component to trigger auth initialization.
 * Must be inside ReduxProvider and QueryClientProvider.
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
          {/* <RealtimeProvider> */}
            {children}
          {/* </RealtimeProvider> */}
        </AuthProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

