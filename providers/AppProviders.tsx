import { TokenManager } from '@/lib/api/tokenManager';
import { queryClient } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Centralized provider wrapper for the entire app.
 * Order matters: Redux → React Query → Other providers.
 *
 * On mount, hydrates tokens from SecureStore into memory + Redux
 * so the axios interceptor has the access token ready from the start.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { accessToken, refreshToken } = await TokenManager.loadTokens();

        if (accessToken && refreshToken) {
          // We have persisted tokens — restore auth state in Redux.
          // User details will be fetched when needed or cached from last session.
          const existingUser = store.getState().auth.user;
          if (existingUser) {
            store.dispatch(
              setCredentials({
                user: existingUser,
                accessToken,
                refreshToken,
              })
            );
          }
        }
      } catch (err) {
        console.warn('Failed to load persisted tokens:', err);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  // Don't render until tokens are hydrated to prevent unauthenticated flashes
  if (!isReady) return null;

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
