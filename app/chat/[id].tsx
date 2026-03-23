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
import React, { useCallback, useMemo } from 'react';
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

  // ─── Data Fetching ─────────────────────────────────────
  const { data: group, isLoading: groupLoading } = useGroup(
    groupId,
    !!groupId,
  );

  const {
    data: plainPages,
    isLoading: plainLoading,
    fetchNextPage,
    hasNextPage,
  } = useGroupMessages(groupId, undefined, !!groupId);

  // Mark as read
  const markRead = useMarkMessageAsRead();

  // ─── Map to ListItem ───────────────────────────────────
  const flattenedData = useMemo(() => {
    let items: ListItem[] = [];

    if (plainPages?.pages) {
      const allMessages = plainPages.pages.flatMap((page) => page.data);
      items = allMessages.map((msg) =>
        mapMessageToListItem(msg, currentUserId),
      );
    }

    return insertDateHeaders(items);
  }, [plainPages, currentUserId]);

  const isLoading = groupLoading || plainLoading;

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
              Loading messages…
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
              if (hasNextPage) {
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