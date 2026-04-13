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
import { getUploadsByMessage, subscribeUploadStore } from '@/stores/uploadStore';
import { selectUser } from '@/store/selectors';
import type { Message } from '@/types/api';
import type {
  ExpenseMessage,
  ImageMessage,
  ListItem,
  TextMessage,
} from '@/types/chat';
import { getUploadSnapshot } from '@/stores/uploadStore';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const dayMs = 86_400_000;

  if (diff < dayMs && d.getDate() === now.getDate()) return 'Today';
  if (diff < 2 * dayMs && d.getDate() === new Date(now.getTime() - dayMs).getDate())
    return 'Yesterday';

  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function mapMessageToListItem(msg: Message, currentUserId: string): ListItem {
  const isMe = msg.sender === currentUserId;

  const base = {
    id: msg._id,
    timestamp: formatTime(msg.createdAt),
    senderId: msg.sender,
    senderName: isMe ? 'Me' : msg.sender,
    isMe,
    _createdAt: msg.createdAt, // raw ISO — used by insertDateHeaders
  };

  if (msg.type === 'image') {
    // Check for upload-pipeline images linked via _uploadMessageId
    const uploadMsgId = (msg as any)._uploadMessageId as string | undefined;
    const uploads = uploadMsgId ? getUploadsByMessage(uploadMsgId) : [];

    const images = uploads.length
      ? uploads.map((u) => ({
          imageId: u.imageId,
          localUri: u.localUri,
          status: u.status,
          thumbnailUrl: u.thumbnailUrl,
          optimizedUrl: u.optimizedUrl,
          width: u.width,
          height: u.height,
          error: u.error,
        }))
      : undefined;

    return {
      ...base,
      type: 'image',
      imageUrl: msg.content,
      uploadMessageId: uploadMsgId,
      images,
    } as ImageMessage & { type: 'image'; _createdAt: string };
  }

  return {
    ...base,
    type: 'text',
    content: msg.content,
    status: msg.readBy?.length > 1 ? 'read' : 'sent',
  } as TextMessage & { type: 'text'; _createdAt: string };
}

function insertDateHeaders(items: ListItem[]): ListItem[] {
  const result: ListItem[] = [];
  let lastDateKey = '';

  for (const item of items) {
    if ('senderId' in item) {
      const iso: string = (item as any)._createdAt ?? '';
      const dateKey = iso ? new Date(iso).toDateString() : '';
      if (dateKey && dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        result.push({
          type: 'header',
          title: formatDateLabel(iso),
          id: `header-${dateKey}`,
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

  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'textMuted');
  const isDark = useColorScheme() === 'dark';
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  // Subscribe to upload store so image upload status changes trigger re-renders
  const _uploadSnapshot = useSyncExternalStore(subscribeUploadStore, getUploadSnapshot);

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
  const markRead = useMarkMessageAsRead();

  // If we found an existing group (either via find-dm or from the messages list),
  // update the URL params to use the real ID.
  React.useEffect(() => {
    if (!isPendingDM) return;

    let realId = existingGroup?.id;
    if (!realId && plainPages?.pages?.[0]?.data?.[0]) {
      realId = plainPages.pages[0].data[0].group;
    }

    if (realId) {
      router.setParams({ id: realId });
    }
  }, [existingGroup, plainPages, isPendingDM]);

  // ─── Map to ListItem ───────────────────────────────────
  // Flatten all pages into a single list of messages.
  // We pull `pages[0].data.length` into the dep array explicitly so that
  // React Query's structural sharing can't skip the recompute when a new
  // message is appended to the cache via SSE.
  const allMessages = useMemo(() => {
    if (isPendingDM || !plainPages?.pages) return [] as Message[];
    return plainPages.pages
      .flatMap((page) => page.data ?? [])
      .filter(Boolean) as Message[];
  }, [plainPages, plainPages?.pages?.[0]?.data?.length, isPendingDM]);

  const flattenedData = useMemo(() => {
    const items = allMessages.map((msg) =>
      mapMessageToListItem(msg, currentUserId),
    );
    return insertDateHeaders(items);
    // _uploadSnapshot triggers recalc when upload records change (progress, status, etc.)
  }, [allMessages, currentUserId, _uploadSnapshot]);

  const isLoading = !isPendingDM && (groupLoading || plainLoading);

  // ─── Header title / subtitle ─────────────────────────
  const headerTitle = recipientName ?? 'Messages';
  const memberNames = isPendingDM
    ? ''
    : group?.members
        ?.map((m) => (m.userId === currentUserId ? 'You' : m.user?.fName))
        .join(', ') ?? '';

  // ─── Auto-scroll to bottom ─────────────────────────────
  const listRef = useRef<FlashList<ListItem>>(null);
  const isNearBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (flattenedData.length === 0) return;

    if (isInitialLoadRef.current) {
      // First data load — jump to bottom without animation
      isInitialLoadRef.current = false;
      const t = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 150);
      return () => clearTimeout(t);
    }

    // New message arrived — scroll only if user is near the bottom
    if (isNearBottomRef.current) {
      const t = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [flattenedData.length]);

  const onScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottomRef.current = distanceFromBottom < 150;
  }, []);

  // ─── Render ────────────────────────────────────────────
  const keyExtractor = useCallback((item: ListItem) => item.id, []);
  
  const renderItem = useCallback(({ item, isDm }: { item: ListItem, isDm: boolean }) => {
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
    return <ChatBubble item={item as TextMessage | ImageMessage} isDm={isDm}/>;
  }, []);

  console.log("PAGES MATTADE BESARAAAAA... ", Platform.OS, plainPages)
  console.log("FLATTENED datattat", flattenedData)
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
            ref={listRef}
            data={flattenedData}
            extraData={flattenedData.length}
            // estimatedItemSize={60}
            renderItem={({ item }) => renderItem({ item, isDm: group?.type === 'dm' })}
            keyExtractor={keyExtractor}
            onScroll={onScroll}
            scrollEventThrottle={100}
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
