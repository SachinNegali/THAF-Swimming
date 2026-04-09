import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
  AddGroupMembersRequest,
  CreateDMRequest,
  CreateGroupRequest,
  Group,
  GroupMember,
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
import axios from 'axios';

// ═══════════════════════════════════════════════════════════
//  NORMALIZERS — bridge between MongoDB _id / wrapped responses
//  and the typed Group shape used in the app.
// ═══════════════════════════════════════════════════════════

function normalizeMember(m: any): GroupMember {
  return {
    ...m,
    userId: m.userId ?? m.user?._id ?? '',
  };
}

function normalizeGroup(raw: any): Group {
  return {
    ...raw,
    id: raw.id ?? raw._id,
    type: raw.type ?? 'group',
    members: (raw.members ?? []).map(normalizeMember),
  };
}

/** POST /group and POST /group/dm both return { message, group } */
function extractGroup(responseData: any): Group {
  const raw = responseData?.group ?? responseData;
  return normalizeGroup(raw);
}

/** GET /group returns either { groups: [...] } or [...] directly */
function extractGroupList(responseData: any): Group[] {
  const list: any[] = Array.isArray(responseData)
    ? responseData
    : responseData?.groups ?? [];
  return list.map(normalizeGroup);
}

/** GET /group/:id/messages may return { messages, pagination } or { data, pagination } */
function extractMessages(responseData: any): PaginatedResponse<Message> {
  const messages: Message[] = responseData?.data ?? responseData?.messages ?? [];
  return { ...responseData, data: messages };
}

// ═══════════════════════════════════════════════════════════
//  QUERIES
// ═══════════════════════════════════════════════════════════

/**
 * Fetch all groups/DMs for the current user.
 * Filters out empty DMs (created but no messages yet) — those only appear
 * after the first message is sent.
 */
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>(endpoints.groups.base);
        const groups = extractGroupList(response.data);
        // Hide DMs that have never had a message sent
        return groups.filter(
          (g) => !(g.type === 'dm' && !g.lastMessage),
        );
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
        const response = await apiClient.get<any>(endpoints.groups.byId(id));

        return normalizeGroup(response.data?.group ?? response.data);
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
 */
export function useGroupMessages(
  groupId: string,
  recipientId?: string,
  filters?: Omit<MessageFilters, 'before'>,
  enabled = true
) {
  const isDM = groupId === 'dm' && !!recipientId;

  return useInfiniteQuery({
    queryKey: isDM
      ? ['groups', 'messages', 'dm', recipientId]
      : queryKeys.groups.messages(groupId),
    queryFn: async ({ pageParam }) => {
      try {
        const params: MessageFilters = {
          ...filters,
          ...(pageParam ? { before: pageParam } : {}),
        };
        const endpoint = isDM
          ? endpoints.groups.dmMessages(recipientId!)
          : endpoints.groups.messages(groupId);

        const response = await apiClient.get<any>(endpoint, { params });
        return extractMessages(response.data);
      } catch (error) {
        logApiError(error, 'useGroupMessages');
        throw new Error(parseApiError(error));
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasNext) return undefined;
      const oldestMessage = lastPage.data[lastPage.data.length - 1];
      return oldestMessage?.createdAt;
    },
    enabled: enabled && (!!groupId || !!recipientId),
  });
}

// ═══════════════════════════════════════════════════════════
//  GROUP MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Create a new group (proactive — all members are notified immediately).
 * API: POST /group/
 */
export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      try {
        const response = await apiClient.post<any>(endpoints.groups.create, data);

        return extractGroup(response.data);
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
 * Get or create a DM with a specific user (lazy — only called on first message send).
 * API: POST /group/dm  { recipientId }
 * Returns an existing DM if one already exists with that user.
 */
export function useCreateOrGetDM() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDMRequest) => {
      try {
        const response = await apiClient.post<any>(endpoints.groups.createDM, data);

        return extractGroup(response.data);
      } catch (error) {
        logApiError(error, 'useCreateOrGetDM');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Check if a DM already exists with a user without creating it.
 * API: GET /group/dm?recipientId=...
 */
export function useFindDM(recipientId: string, enabled = true) {
  return useQuery({
    queryKey: ['groups', 'find-dm', recipientId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>(`${endpoints.groups.createDM}/${recipientId}/messages`, {
          params: { recipientId },
        });
        // If the backend returns a group object, normalize and return it.
        // If it returns 404 or null, the query will return null/undefined.
        return response.data?.group ? normalizeGroup(response.data.group) : null;
      } catch (error) {
        // If 404, just return null (no DM exists)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        logApiError(error, 'useFindDM');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!recipientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        const response = await apiClient.patch<any>(
          endpoints.groups.update(id),
          data
        );
        return extractGroup(response.data);
      } catch (error) {
        logApiError(error, 'useUpdateGroup');
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
        const response = await apiClient.post<any>(
          endpoints.groups.addMembers(groupId),
          data
        );
        console.log("THIS IS ENDPOINT IN USE GROUPS", endpoints.groups.addMembers(groupId), groupId, data)
        return extractGroup(response.data);
      } catch (error) {
        console.log("THIS IS ERROR IN USE GROUPS", error)
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
        const response = await apiClient.delete<any>(
          endpoints.groups.removeMember(groupId, userId)
        );
        return extractGroup(response.data);
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
        const response = await apiClient.patch<any>(
          endpoints.groups.updateMemberRole(groupId, userId),
          data
        );
        return extractGroup(response.data);
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

export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      try {
        await apiClient.post(endpoints.groups.leave(groupId));
        console.log("THIS IS ENDPOINT IN USE GROUPS", endpoints.groups.leave(groupId), groupId)
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
        console.log("RESPONSEEEEEE SEND GROUP", response)
        console.log("RESPONSEEEEEE SEND GROUP data", response?.data)
        return response.data;
      } catch (error) {
        logApiError(error, 'useSendGroupMessage');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (responseData) => {
      const msg = (responseData as any)?.data ?? responseData;
      const groupId = msg.group ?? msg.groupId;
      if (groupId) {
        qc.invalidateQueries({
          queryKey: queryKeys.groups.messages(groupId),
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

/**
 * Send a message in a DM conversation (creates the DM group if needed).
 * API: POST /group/dm/:recipientId/messages  { content, type?, metadata? }
 */
export function useSendDMMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientId,
      data,
    }: {
      recipientId: string;
      data: SendMessageRequest;
    }) => {
      try {
        const response = await apiClient.post<any>(
          endpoints.groups.sendDMMessage(recipientId),
          data
        );
        console.log("RESPONSEEEEEE SEND DM", response)
        console.log("RESPONSEEEEEE SEND DM data", response?.data)
        return response.data;
      } catch (error) {
        logApiError(error, 'useSendDMMessage');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (responseData) => {
      const msg = responseData?.data ?? responseData;
      const groupId = msg.group ?? msg.groupId;
      if (groupId) {
        qc.invalidateQueries({
          queryKey: queryKeys.groups.messages(groupId),
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

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
        console.log("THIS IS ENDPOINT IN USE GROUPS", endpoints.messages.markAsRead(messageId), messageId)
        return { messageId, groupId };
      } catch (error) {
        logApiError(error, 'useMarkMessageAsRead');
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
