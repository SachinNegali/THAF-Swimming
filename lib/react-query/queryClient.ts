import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Centralized configuration for all queries and mutations
 */
export const queryClient = new QueryClient({
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

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
};
