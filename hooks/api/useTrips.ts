import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
  AddParticipantsRequest,
  CreateTripRequest,
  JoinRequest,
  PaginatedResponse,
  Trip,
  TripFilters,
  UpdateTripRequest,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Filter params type ──────────────────────────────────
export interface TripFilterParams {
  from?: string;
  to?: string;
  startDate?: string; // ISO date string
  endDate?: string;
}

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
        const response = await apiClient.get<PaginatedResponse<Trip>>(
          endpoints.trips.base,
          { params: filters }
        );
        const some = (response?.data as any)?.trips?.filter((x: any) => x.description == "maybe")
        console.log("MAYBEEE", some?.[0]?.destination, some?.[0]?.startLocation, some?.[0]?.endLocation, some?.[0]?.startDate, some?.[0]?.endDate)
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
        console.log("THE FUXK IS GET....", endpoints.trips.byId(id))
        console.log("THE FUXK IS GET....", response.data, response)
        return response.data;
      } catch (error) {
        logApiError(error, 'useTrip');
        const e = error as any; console.log("WHAT Error", e, e?.response?.data, e?.response, e?.message);
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
      console.log("THE FUXK IS CREATE DATA....", data)
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
      qc.invalidateQueries({ queryKey: queryKeys.trips.joinRequests(updatedTrip.id) });
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
      qc.invalidateQueries({ queryKey: queryKeys.trips.joinRequests(updatedTrip.id) });
    },
  });
}

/**
 * Filter/search trips by from, to, startDate, endDate.
 * Calls GET /trip/filter — only fires when params is non-null.
 * Pass null to keep the query idle (shows user's own trips instead).
 */
export function useFilterTrips(params: TripFilterParams | null) {
  return useQuery({
    queryKey: ['trips', 'filter', params],
    queryFn: async () => {
      try {
        const qs = new URLSearchParams();
        if (params?.from)      qs.set('from', params.from);
        if (params?.to)        qs.set('to', params.to);
        if (params?.startDate) qs.set('startDate', params.startDate);
        if (params?.endDate)   qs.set('endDate', params.endDate);
        console.log("THE FUXK IS GET....", endpoints.trips.filter, qs.toString())
        const response = await apiClient.get<{ trips: Trip[]; pagination: any }>(
          `${endpoints.trips.filter}?${qs.toString()}`
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useFilterTrips');
        throw new Error(parseApiError(error));
      }
    },
    enabled: params !== null,
  });
}


/**
 * Send a join request for a trip.
 * On success: invalidates the trip detail so server-side state (e.g.
 * pending request markers) is refreshed.
 */
export function useRequestToJoinTrip() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      try {
        const response = await apiClient.post<{ message: string }>(
          endpoints.trips.join(tripId)
        );
        return { tripId, ...response.data };
      } catch (error) {
        logApiError(error, 'useRequestToJoinTrip');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: ({ tripId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
    },
  });
}

/**
 * Fetch pending join requests for a trip.
 * Server returns 403 ("Only the creator can view join requests") for
 * non-creators — callers should gate this query with `enabled` based on
 * whether the viewer is the trip creator.
 */
export function useTripJoinRequests(tripId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trips.joinRequests(tripId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ joinRequests: JoinRequest[] }>(
          endpoints.trips.joinRequests(tripId)
        );
        // console.log("THE FUXK IS GET....", endpoints.trips.joinRequests(tripId))
        console.log("THE FUXK IS GET.... TRIPS REQUESTSSS...", response.data, response)
        return response.data.joinRequests ?? [];
      } catch (error) {
        logApiError(error, 'useTripJoinRequests');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!tripId,
  });
}

// export function useUserTrip(id: string, enabled = true) {
//   return useQuery({
//     queryKey: queryKeys.trips.detail(id),
//     queryFn: async () => {
//       try {
//         const response = await apiClient.get<Trip>(endpoints.trips.byId(id));
//         console.log("THE FUXK IS GET....", endpoints.trips.byId(id))
//         console.log("THE FUXK IS GET....", response.data, response)
//         return response.data;
//       } catch (error) {
//         logApiError(error, 'useTrip');
//         const e = error as any; console.log("WHAT Error", e, e?.response?.data, e?.response, e?.message);
//         throw new Error(parseApiError(error));
//       }
//     },
//     enabled: enabled && !!id,
//   });
// }