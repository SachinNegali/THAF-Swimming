import { queryClient } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Centralized provider wrapper for the entire app
 * Order matters: Redux → React Query → Other providers
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
