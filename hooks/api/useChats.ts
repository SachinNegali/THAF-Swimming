import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import type {
    Chat,
    CreateChatRequest,
    Message,
    MessageFilters,
    PaginatedResponse,
    SendMessageRequest,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch all chats for current user
 */
export function useChats() {
  return useQuery({
    queryKey: queryKeys.chats.list(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Chat[]>(endpoints.chats.base);
        return response.data;
      } catch (error) {
        logApiError(error, 'useChats');
        throw new Error(parseApiError(error));
      }
    },
  });
}

/**
 * Fetch a single chat by ID
 */
export function useChat(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chats.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Chat>(endpoints.chats.byId(id));
        return response.data;
      } catch (error) {
        logApiError(error, 'useChat');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!id,
  });
}

/**
 * Create a new chat
 */
export function useCreateChat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateChatRequest) => {
      try {
        const response = await apiClient.post<Chat>(endpoints.chats.create, data);
        return response.data;
      } catch (error) {
        logApiError(error, 'useCreateChat');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
  });
}

/**
 * Fetch messages for a chat
 */
export function useMessages(chatId: string, filters?: MessageFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chats.messages(chatId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<PaginatedResponse<Message>>(
          endpoints.chats.messages(chatId),
          { params: filters }
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useMessages');
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && !!chatId,
    // Refetch messages more frequently for real-time feel
    refetchInterval: 5000, // 5 seconds
  });
}

/**
 * Send a message to a chat
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chatId, data }: { chatId: string; data: SendMessageRequest }) => {
      try {
        const response = await apiClient.post<Message>(
          endpoints.chats.sendMessage(chatId),
          data
        );
        return response.data;
      } catch (error) {
        logApiError(error, 'useSendMessage');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (data) => {
      // Invalidate messages for this chat
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.messages(data.chatId) });
      // Invalidate chat list to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
  });
}

/**
 * Delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      try {
        await apiClient.delete(endpoints.chats.deleteMessage(chatId, messageId));
        return { chatId, messageId };
      } catch (error) {
        logApiError(error, 'useDeleteMessage');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: ({ chatId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.messages(chatId) });
    },
  });
}

/**
 * Mark chat as read
 */
export function useMarkChatAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      try {
        await apiClient.post(endpoints.chats.markAsRead(chatId));
        return chatId;
      } catch (error) {
        logApiError(error, 'useMarkChatAsRead');
        throw new Error(parseApiError(error));
      }
    },
    onSuccess: (chatId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
  });
}
