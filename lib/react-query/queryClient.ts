import { Sentry } from '@/lib/sentry';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Centralized configuration for all queries and mutations
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      Sentry.withScope((scope) => {
        scope.setTag('react_query', 'query');
        scope.setContext('query', { queryKey: JSON.stringify(query.queryKey) });
        Sentry.captureException(error);
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      Sentry.withScope((scope) => {
        scope.setTag('react_query', 'mutation');
        scope.setContext('mutation', {
          mutationKey: mutation.options.mutationKey
            ? JSON.stringify(mutation.options.mutationKey)
            : undefined,
        });
        Sentry.captureException(error);
      });
    },
  }),
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Cache time: How long unused data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Network mode: online only (don't run queries offline)
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

/**
 * Query key factory
 * Centralized query keys for cache management and invalidation
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'current-user'] as const,
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
  },
  
  // Trips
  trips: {
    all: ['trips'] as const,
    lists: () => [...queryKeys.trips.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.trips.lists(), filters] as const,
    details: () => [...queryKeys.trips.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.trips.details(), id] as const,
    participants: (tripId: string) =>
      [...queryKeys.trips.detail(tripId), 'participants'] as const,
    joinRequests: (tripId: string) =>
      [...queryKeys.trips.detail(tripId), 'join-requests'] as const,
  },
  
  // Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    participants: (eventId: string) => 
      [...queryKeys.events.detail(eventId), 'participants'] as const,
  },
  
  // Groups (Chat)
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: () => [...queryKeys.groups.lists()] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
    members: (groupId: string) =>
      [...queryKeys.groups.detail(groupId), 'members'] as const,
    messages: (groupId: string) =>
      [...queryKeys.groups.detail(groupId), 'messages'] as const,
  },

  // Standalone messages
  messages: {
    all: ['messages'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    cycles: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId, 'cycles'] as const,
    activeCycle: (groupId: string) =>
      [...queryKeys.expenses.cycles(groupId), 'active'] as const,
    balances: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId, 'balances'] as const,
    summary: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId, 'summary'] as const,
    settlements: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId, 'settlements'] as const,
    list: (groupId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.expenses.all, 'group', groupId, 'list', filters ?? {}] as const,
    detail: (expenseId: string) =>
      [...queryKeys.expenses.all, 'detail', expenseId] as const,
    comments: (expenseId: string) =>
      [...queryKeys.expenses.all, 'detail', expenseId, 'comments'] as const,
    groupAll: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // Profile (medical & emergency)
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
  },
};
