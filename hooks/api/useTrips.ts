import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
  AddParticipantsRequest,
  CreateTripRequest,
  PaginatedResponse,
  Trip,
  TripFilters,
  UpdateTripRequest,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Queries ────────────────────────────────────────────

/**
 * Fetch all trips for the current user with optional filters.
 * Uses `queryKeys.trips.list(filters)` so different filter combos
 * get their own cache entry — avoids unnecessary refetches.
 */
export function useTrips(filters?: TripFilters) {
  return useQuery({
    queryKey: queryKeys.trips.list(filters as Record<string, unknown>),
    queryFn: async () => {
      try {
        console.log("THE FUCK IS BASE URL....", endpoints.trips.base)
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
 * Fetch a single trip by ID.
 * `enabled` guard prevents unnecessary calls when ID isn't available yet.
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

// ─── Mutations ──────────────────────────────────────────

/**
 * Create a new trip.
 * On success: invalidates trip lists so the new trip appears.
 */
export function useCreateTrip() {
  const qc = useQueryClient();

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
      qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
    },
  });
}

/**
 * Update an existing trip (uses PATCH per Postman collection).
 * On success: invalidates both the list and the specific detail cache.
 */
export function useUpdateTrip() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTripRequest }) => {
      try {
        const response = await apiClient.patch<Trip>(
          endpoints.trips.update(id),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useUpdateTrip');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedTrip) => {
      // Update detail cache in-place to avoid an extra network round-trip
      qc.setQueryData(queryKeys.trips.detail(updatedTrip.id), updatedTrip);
      qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
    },
  });
}

/**
 * Delete a trip with optimistic removal from list caches.
 * If the server call fails, previous data is restored automatically.
 */
export function useDeleteTrip() {
  const qc = useQueryClient();

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
    onMutate: async (id) => {
      // Cancel in-flight queries to avoid overwriting our optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.trips.lists() });

      // Snapshot previous data for rollback
      const previousLists = qc.getQueriesData<PaginatedResponse<Trip>>({
        queryKey: queryKeys.trips.lists(),
      });

      // Optimistically remove the trip from all list caches
      qc.setQueriesData<PaginatedResponse<Trip>>(
        { queryKey: queryKeys.trips.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((trip) => trip.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      return { previousLists };
    },
    onError: (_error, _id, context) => {
      // Rollback on error
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          if (data) qc.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: (id) => {
      qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      if (id) qc.removeQueries({ queryKey: queryKeys.trips.detail(id) });
    },
  });
}

/**
 * Add participants to a trip.
 * On success: invalidates the trip detail and participant caches.
 */
export function useAddTripParticipants() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      data,
    }: {
      tripId: string;
      data: AddParticipantsRequest;
    }) => {
      try {
        const response = await apiClient.post<Trip>(
          endpoints.trips.addParticipants(tripId),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useAddTripParticipants');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedTrip) => {
      qc.setQueryData(queryKeys.trips.detail(updatedTrip.id), updatedTrip);
      qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
    },
  });
}

/**
 * Remove a participant from a trip.
 * On success: invalidates the trip detail cache.
 */
export function useRemoveTripParticipant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      userId,
    }: {
      tripId: string;
      userId: string;
    }) => {
      try {
        const response = await apiClient.delete<Trip>(
          endpoints.trips.removeParticipant(tripId, userId)
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useRemoveTripParticipant');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedTrip) => {
      qc.setQueryData(queryKeys.trips.detail(updatedTrip.id), updatedTrip);
      qc.invalidateQueries({ queryKey: queryKeys.trips.lists() });
    },
  });
}
