import ChatBubble from '@/components/chat/ChatBubble';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import DateHeader from '@/components/chat/DateHeader';
import ExpenseCard from '@/components/chat/ExpenseCard';
import { SPACING } from '@/constants/theme';
import {
  useGroup,
  useGroupMessages,
  useMarkMessageAsRead,
} from '@/hooks/api/useChats';
import { useThemeColor } from '@/hooks/use-theme-color';
import { selectUser } from '@/store/selectors';
import type { Message } from '@/types/api';
import type {
  ExpenseMessage,
  ImageMessage,
  ListItem,
  TextMessage,
} from '@/types/chat';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

// ─── Helpers ────────────────────────────────────────────

/** Map a server Message to our ListItem type */
function mapMessageToListItem(msg: Message, currentUserId: string): ListItem {
  const isMe = msg.senderId === currentUserId;

  if (msg.type === 'image') {
    return {
      id: msg.id,
      type: 'image',
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      senderId: msg.senderId,
      senderName: isMe ? 'Me' : msg.senderId,
      isMe,
      imageUrl: msg.content,
    } as ImageMessage & { type: 'image' };
  }

  return {
    id: msg.id,
    type: 'text',
    timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    senderId: msg.senderId,
    senderName: isMe ? 'Me' : msg.senderId,
    isMe,
    content: msg.content,
    status: msg.readBy.length > 1 ? 'read' : 'sent',
  } as TextMessage & { type: 'text' };
}

/** Group messages by date and insert date headers */
function insertDateHeaders(items: ListItem[]): ListItem[] {
  const result: ListItem[] = [];
  let lastDate = '';

  for (const item of items) {
    // Only chat messages (not headers) have senderId
    if ('senderId' in item) {
      const date = (item as any).timestamp?.split(',')[0] ?? '';
      if (date && date !== lastDate) {
        lastDate = date;
        result.push({
          type: 'header',
          title: date,
          id: `header-${date}`,
        });
      }
    }
    result.push(item);
  }

  return result;
}

// ─── Screen ─────────────────────────────────────────────

export default function GroupChatScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'textMuted');
  const isDark = useColorScheme() === 'dark';
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  // ─── E2EE availability (checked lazily) ─────────────────
  const [e2eeReady, setE2eeReady] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);
  const [e2eeLoading, setE2eeLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { CryptoService } = await import('@/lib/crypto');
        setE2eeReady(CryptoService.isInitialized());
      } catch {
        // Native modules unavailable — stay on plaintext
        setE2eeReady(false);
      }
    })();
  }, []);

  // Fetch encrypted messages lazily when e2ee is ready
  useEffect(() => {
    if (!e2eeReady || !groupId) return;

    let cancelled = false;
    setE2eeLoading(true);

    (async () => {
      try {
        const { apiClient } = await import('@/lib/api/client');
        const { endpoints } = await import('@/lib/api/endpoints');
        const { CryptoService } = await import('@/lib/crypto');

        const response = await apiClient.get(
          endpoints.encryptedMessages.list(groupId),
        );
        const encrypted = response.data as any[];
        const decrypted = [];

        for (const msg of encrypted) {
          try {
            const { plaintext } = await CryptoService.decryptDirectMessage(
              msg.senderId,
              msg.senderDeviceId,
              {
                senderDeviceId: msg.senderDeviceId,
                type: msg.type,
                ciphertext: msg.ciphertext,
                ephemeralKey: msg.ephemeralKey,
                oneTimePreKeyId: msg.oneTimePreKeyId,
                messageNumber: msg.messageNumber,
                previousChainLength: msg.previousChainLength,
                attachments: msg.attachments ?? [],
              },
            );
            decrypted.push({ ...msg, content: plaintext });
          } catch {
            decrypted.push({
              ...msg,
              content: '🔒 Unable to decrypt this message',
            });
          }
        }

        if (!cancelled) {
          setDecryptedMessages(decrypted);
          setE2eeLoading(false);
        }
      } catch (err) {
        console.warn('[GroupChat] Encrypted fetch failed:', err);
        if (!cancelled) setE2eeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [e2eeReady, groupId]);

  // ─── Data Fetching (plaintext) ──────────────────────────
  const { data: group, isLoading: groupLoading } = useGroup(
    groupId,
    !!groupId,
  );

  const {
    data: plainPages,
    isLoading: plainLoading,
    fetchNextPage,
    hasNextPage,
  } = useGroupMessages(groupId, undefined, !!groupId && !e2eeReady);

  // Mark as read
  const markRead = useMarkMessageAsRead();

  // ─── Map to ListItem ───────────────────────────────────
  const flattenedData = useMemo(() => {
    let items: ListItem[] = [];

    if (e2eeReady && decryptedMessages.length > 0) {
      items = decryptedMessages.map((msg) => {
        const isMe = msg.senderId === currentUserId;
        return {
          id: msg.id ?? msg._id,
          type: msg.type === 'image' ? 'image' : 'text',
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          senderId: msg.senderId,
          senderName: isMe ? 'Me' : msg.senderId,
          isMe,
          content: msg.content,
          ...(msg.type === 'image' ? { imageUrl: msg.content } : {}),
        } as ListItem;
      });
    } else if (plainPages?.pages) {
      const allMessages = plainPages.pages.flatMap((page) => page.data);
      items = allMessages.map((msg) =>
        mapMessageToListItem(msg, currentUserId),
      );
    }

    return insertDateHeaders(items);
  }, [plainPages, decryptedMessages, e2eeReady, currentUserId]);

  const isLoading = groupLoading || plainLoading || e2eeLoading;

  // ─── Render ────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if ('title' in item && !('senderId' in item)) {
      return (
        <DateHeader
          title={
            (item as { type: 'header'; title: string; id: string }).title
          }
        />
      );
    }
    if (item.type === 'expense') {
      return <ExpenseCard item={item as ExpenseMessage} />;
    }
    return <ChatBubble item={item as TextMessage | ImageMessage} />;
  }, []);

  const memberNames = group?.members
    ?.map((m) => (m.userId === currentUserId ? 'You' : m.userId))
    .join(', ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ChatHeader
        title={group?.name ?? 'Chat'}
        subtitle={memberNames ?? ''}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isLoading ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: SPACING.sm, color: mutedColor }}>
              {e2eeReady ? 'Decrypting messages…' : 'Loading messages…'}
            </Text>
          </View>
        ) : (
          <FlashList
            data={flattenedData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: SPACING.md,
              paddingBottom: 100,
            }}
            onEndReached={() => {
              if (hasNextPage && !e2eeReady) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
          />
        )}
        <ChatInput groupId={groupId} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}