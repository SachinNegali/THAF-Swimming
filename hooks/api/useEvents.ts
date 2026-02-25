import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
    CreateEventRequest,
    Event,
    EventFilters,
    PaginatedResponse,
    UpdateEventRequest,
    User,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch all events with optional filters
 */
export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(filters as Record<string, unknown>),
    queryFn: async () => {
      try {
        const response = await apiClient.get<PaginatedResponse<Event>>(
          endpoints.events.base,
          { params: filters }
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useEvents');
        throw new Error(parseApiError(error));
      }
    },
  });
}

/**
 * Fetch a single event by ID
 */
export function useEvent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Event>(endpoints.events.byId(id));
        return response.data;
      } catch (error) {
        logApiError(error, 'useEvent');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!id,
  });
}

/**
 * Create a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEventRequest) => {
      try {
        const response = await apiClient.post<Event>(endpoints.events.create, data);
        return response.data;
      } catch (error) {
        logApiError(error, 'useCreateEvent');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
  });
}

/**
 * Update an existing event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventRequest }) => {
      try {
        const response = await apiClient.patch<Event>(
          endpoints.events.update(id),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useUpdateEvent');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(data.id) });
    },
  });
}

/**
 * Delete an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(endpoints.events.delete(id));
        return id;
      } catch (error) {
        logApiError(error, 'useDeleteEvent');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(id) });
    },
  });
}

/**
 * Join an event
 */
export function useJoinEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      try {
        const response = await apiClient.post<Event>(
          endpoints.events.join(eventId)
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useJoinEvent');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.participants(data.id) });
    },
  });
}

/**
 * Leave an event
 */
export function useLeaveEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      try {
        const response = await apiClient.post<Event>(
          endpoints.events.leave(eventId)
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useLeaveEvent');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.participants(data.id) });
    },
  });
}

/**
 * Fetch event participants
 */
export function useEventParticipants(eventId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events.participants(eventId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<User[]>(
          endpoints.events.participants(eventId)
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useEventParticipants');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!eventId,
  });
}
