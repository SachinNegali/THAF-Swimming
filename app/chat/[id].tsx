import ChatBubble from '@/components/chat/ChatBubble';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import DateHeader from '@/components/chat/DateHeader';
import ExpenseCard from '@/components/chat/ExpenseCard';
import { SPACING } from '@/constants/theme';
import {
  useFindDM,
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
import { router, useLocalSearchParams } from 'expo-router';
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

function mapMessageToListItem(msg: Message, currentUserId: string): ListItem {
  const isMe = msg.senderId === currentUserId;
  console.log(".....!!THIS IS MESSAGE", msg)
  console.log(".....!!THIS IS CURRENT USER ID", currentUserId, msg.senderId)

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

function insertDateHeaders(items: ListItem[]): ListItem[] {
  const result: ListItem[] = [];
  let lastDate = '';

  for (const item of items) {
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
  const {
    id: groupId,
    recipientId,
    recipientName,
  } = useLocalSearchParams<{
    id: string;
    recipientId?: string;
    recipientName?: string;
  }>();

  console.log(".....!!WHAT ARE THESEEE", groupId, recipientId, recipientName)
  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'textMuted');
  const isDark = useColorScheme() === 'dark';
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  // Pending DM: user tapped "Message" on a profile but hasn't sent anything yet.
  // We don't create the group or fetch messages until the first message is sent.
  const isPendingDM = groupId === 'dm' && !!recipientId;

  // ─── Check for existing DM ─────────────────────────────
  // If we land on 'dm', check if a group already exists.
  const { data: existingGroup } = useFindDM(
    recipientId ?? '',
    isPendingDM
  );

  // ─── Data Fetching (skipped for pending DM) ──────────
  const { data: group, isLoading: groupLoading } = useGroup(
    groupId,
    !isPendingDM && !!groupId,
  );

  const {
    data: plainPages,
    isLoading: plainLoading,
    fetchNextPage,
    hasNextPage,
  } = useGroupMessages(
    groupId,
    recipientId,
    undefined,
    true, // Always enabled if we have groupId or recipientId (handled by hook)
  );
  console.log("PLAIN PAGES....", plainPages)

  console.log("FIX SHIT....groupId", groupId)
  console.log("FIX SHIT....recipientId", recipientId)
  const markRead = useMarkMessageAsRead();

  // If we found an existing group (either via find-dm or from the messages list),
  // update the URL params to use the real ID.
  React.useEffect(() => {
    if (!isPendingDM) return;

    let realId = existingGroup?.id;
    if (!realId && plainPages?.pages?.[0]?.data?.[0]) {
      realId = plainPages.pages[0].data[0].groupId;
    }

    if (realId) {
      console.log('[Chat] Found real groupId, switching to:', realId);
      router.setParams({ id: realId });
    }
  }, [existingGroup, plainPages, isPendingDM]);

  console.log("....!!THIS IS ROUTER",router)

  // ─── Map to ListItem ───────────────────────────────────
  const flattenedData = useMemo(() => {
    if (isPendingDM) return [];

    let items: ListItem[] = [];
    if (plainPages?.pages) {
      const allMessages = plainPages.pages
        .flatMap((page) => page.data ?? [])
        .filter(Boolean);
      items = allMessages.map((msg) =>
        mapMessageToListItem(msg, currentUserId),
      );
    }
    return insertDateHeaders(items);
  }, [plainPages, currentUserId, isPendingDM]);

  const isLoading = !isPendingDM && (groupLoading || plainLoading);

  // ─── Header title / subtitle ─────────────────────────
  // const headerTitle = isPendingDM
  //   ? recipientName ?? 'New Message'
  //   : group?.name ?? 'Chat';
  const headerTitle = recipientName ?? "Messages"
console.log("FIX SHIT....MEMBERS", group?.members)
  const memberNames = isPendingDM
    ? ''
    : group?.members
        ?.map((m) => (m.userId === currentUserId ? 'You' : m.user?.fName))
        .join(', ') ?? '';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ChatHeader title={headerTitle} subtitle={memberNames} isDm={group?.type === 'dm'}/>

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
              if (hasNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              isPendingDM ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Text style={{ color: mutedColor, fontSize: 14 }}>
                    Send a message to start the conversation
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        <ChatInput
          groupId={isPendingDM ? undefined : groupId}
          recipientId={isPendingDM ? recipientId : undefined}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
