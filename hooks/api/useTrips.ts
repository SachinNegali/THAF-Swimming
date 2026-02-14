import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
    CreateTripRequest,
    PaginatedResponse,
    Trip,
    TripFilters,
    UpdateTripRequest,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch all trips with optional filters
 */
export function useTrips(filters?: TripFilters) {
  return useQuery({
    queryKey: queryKeys.trips.list(filters),
    queryFn: async () => {
      try {
        const response = await apiClient.get<PaginatedResponse<Trip>>(
          endpoints.trips.base,
          { params: filters }
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useTrips');
        throw new Error(parseApiError(error));
      }
    },
  });
}

/**
 * Fetch a single trip by ID
 */
export function useTrip(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trips.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Trip>(endpoints.trips.byId(id));
        return response.data;
      } catch (error) {
        logApiError(error, 'useTrip');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!id,
  });
}

/**
 * Create a new trip
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTripRequest) => {
      try {
        const response = await apiClient.post<Trip>(endpoints.trips.create, data);
        return response.data;
      } catch (error) {
        logApiError(error, 'useCreateTrip');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: () => {
      // Invalidate trips list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
    },
  });
}

/**
 * Update an existing trip
 */
export function useUpdateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTripRequest }) => {
      try {
        const response = await apiClient.put<Trip>(
          endpoints.trips.update(id),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useUpdateTrip');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(data.id) });
    },
  });
}

/**
 * Delete a trip
 */
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(endpoints.trips.delete(id));
        return id;
      } catch (error) {
        logApiError(error, 'useDeleteTrip');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (id) => {
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.trips.detail(id) });
    },
  });
}
