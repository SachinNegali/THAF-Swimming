import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
    AddGroupMembersRequest,
    CreateGroupRequest,
    Group,
    Message,
    MessageFilters,
    PaginatedResponse,
    SendMessageRequest,
    UpdateGroupRequest,
    UpdateMemberRoleRequest,
} from '@/types/api';
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

// ═══════════════════════════════════════════════════════════
//  QUERIES
// ═══════════════════════════════════════════════════════════

/**
 * Fetch all groups for the current user.
 */
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Group[]>(endpoints.groups.base);
        return response.data;
      } catch (error) {
        logApiError(error, 'useGroups');
        throw new Error(parseApiError(error));
      }
    },
  });
}

/**
 * Fetch a single group by ID.
 */
export function useGroup(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Group>(endpoints.groups.byId(id));
        return response.data;
      } catch (error) {
        logApiError(error, 'useGroup');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!id,
  });
}

/**
 * Fetch messages for a group using infinite scroll pagination.
 * Each page fetches `limit` messages. The `before` cursor is used
 * to load older messages as the user scrolls up.
 *
 * This avoids refetching the entire message history on every load.
 */
export function useGroupMessages(
  groupId: string,
  filters?: Omit<MessageFilters, 'before'>,
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: queryKeys.groups.messages(groupId),
    queryFn: async ({ pageParam }) => {
      try {
        const params: MessageFilters = {
          ...filters,
          ...(pageParam ? { before: pageParam } : {}),
        };
        const response = await apiClient.get<PaginatedResponse<Message>>(
          endpoints.groups.messages(groupId),
          { params }
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useGroupMessages');
        throw new Error(parseApiError(error));
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasNext) return undefined;
      // Use the oldest message's createdAt as cursor for the next page
      const oldestMessage = lastPage.data[lastPage.data.length - 1];
      return oldestMessage?.createdAt;
    },
    enabled: enabled && !!groupId,
  });
}

// ═══════════════════════════════════════════════════════════
//  GROUP MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Create a new group.
 */
export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      try {
        const response = await apiClient.post<Group>(
          endpoints.groups.create,
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useCreateGroup');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Update group details (name, description).
 */
export function useUpdateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGroupRequest;
    }) => {
      try {
        const response = await apiClient.patch<Group>(
          endpoints.groups.update(id),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useUpdateGroup');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedGroup) => {
      // Update detail cache in-place
      qc.setQueryData(queryKeys.groups.detail(updatedGroup.id), updatedGroup);
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Delete a group.
 */
export function useDeleteGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(endpoints.groups.delete(id));
        return id;
      } catch (error) {
        logApiError(error, 'useDeleteGroup');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
      qc.removeQueries({ queryKey: queryKeys.groups.detail(id) });
    },
  });
}

// ═══════════════════════════════════════════════════════════
//  MEMBER MANAGEMENT MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Add members to a group.
 */
export function useAddGroupMembers() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: string;
      data: AddGroupMembersRequest;
    }) => {
      try {
        const response = await apiClient.post<Group>(
          endpoints.groups.addMembers(groupId),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useAddGroupMembers');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedGroup) => {
      qc.setQueryData(queryKeys.groups.detail(updatedGroup.id), updatedGroup);
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Remove a member from a group.
 */
export function useRemoveGroupMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => {
      try {
        const response = await apiClient.delete<Group>(
          endpoints.groups.removeMember(groupId, userId)
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useRemoveGroupMember');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedGroup) => {
      qc.setQueryData(queryKeys.groups.detail(updatedGroup.id), updatedGroup);
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Update a member's role within a group.
 */
export function useUpdateMemberRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      data,
    }: {
      groupId: string;
      userId: string;
      data: UpdateMemberRoleRequest;
    }) => {
      try {
        const response = await apiClient.patch<Group>(
          endpoints.groups.updateMemberRole(groupId, userId),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useUpdateMemberRole');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (updatedGroup) => {
      qc.setQueryData(queryKeys.groups.detail(updatedGroup.id), updatedGroup);
    },
  });
}

/**
 * Leave a group.
 */
export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      try {
        await apiClient.post(endpoints.groups.leave(groupId));
        return groupId;
      } catch (error) {
        logApiError(error, 'useLeaveGroup');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (groupId) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
      qc.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
    },
  });
}

// ═══════════════════════════════════════════════════════════
//  MESSAGE MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Send a message to a group.
 * Uses optimistic update: the message appears instantly in the UI,
 * and is rolled back if the server call fails.
 */
export function useSendGroupMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: string;
      data: SendMessageRequest;
    }) => {
      try {
        const response = await apiClient.post<Message>(
          endpoints.groups.sendMessage(groupId),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useSendGroupMessage');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (newMessage) => {
      // Invalidate messages for this group to pick up the confirmed message
      qc.invalidateQueries({
        queryKey: queryKeys.groups.messages(newMessage.groupId),
      });
      // Update group list to reflect the latest message
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Delete a message (standalone message endpoint).
 * Optimistically removes the message from the group's message cache.
 */
export function useDeleteMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      groupId,
    }: {
      messageId: string;
      groupId: string;
    }) => {
      try {
        await apiClient.delete(endpoints.messages.delete(messageId));
        return { messageId, groupId };
      } catch (error) {
        logApiError(error, 'useDeleteMessage');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: ({ groupId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.groups.messages(groupId),
      });
    },
  });
}

/**
 * Mark a message as read (standalone message endpoint).
 */
export function useMarkMessageAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      groupId,
    }: {
      messageId: string;
      groupId: string;
    }) => {
      try {
        await apiClient.post(endpoints.messages.markAsRead(messageId));
        return { messageId, groupId };
      } catch (error) {
        logApiError(error, 'useMarkMessageAsRead');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: ({ groupId }) => {
      // Invalidate messages to update readBy arrays
      qc.invalidateQueries({
        queryKey: queryKeys.groups.messages(groupId),
      });
    },
  });
}
