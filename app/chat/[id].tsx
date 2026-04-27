import AddExpenseSheet from '@/components/chat/AddExpenseSheet';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import DateHeader from '@/components/chat/DateHeader';
import ExpenseCard from '@/components/chat/ExpenseCard';
import ExpenseDetailSheet from '@/components/chat/ExpenseDetailSheet';
import SpendBubble from '@/components/chat/SpendBubble';
import { useDeleteExpense } from '@/hooks/api/useExpenses';
import { SPACING } from '@/constants/theme';
import {
  useFindDM,
  useGroup,
  useGroupMessages,
  useMarkMessageAsRead,
} from '@/hooks/api/useChats';
import { useThemeColor } from '@/hooks/use-theme-color';
import { selectUser } from '@/store/selectors';
import { getUpload, getUploadSnapshot, subscribeUploadStore } from '@/stores/uploadStore';
import type { Message } from '@/types/api';
import type {
  ExpenseMessage,
  ImageAttachment,
  ImageMessage,
  ListItem,
  SpendMessage,
  TextMessage,
} from '@/types/chat';
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

  if (msg.type === 'spend') {
    const spend = msg.metadata?.spend;
    if (!spend) {
      return {
        ...base,
        type: 'text',
        content: msg.content,
        status: 'sent',
      } as TextMessage & { type: 'text'; _createdAt: string };
    }
    const item: SpendMessage & { _createdAt: string } = {
      ...base,
      type: 'spend',
      expenseId: spend.expenseId,
      amount: spend.amount,
      currency: spend.currency,
      category: spend.category,
      note: spend.note,
      imageUrl: spend.imageUrl ?? null,
      splitCount: spend.splitCount,
      paidBy: spend.paidBy,
      createdBy: spend.createdBy ?? msg.createdBy ?? msg.sender,
      createdAtIso: msg.createdAt,
      content: msg.content,
      _createdAt: msg.createdAt,
    };
    return item;
  }

  if (msg.type === 'image') {
    // Source of truth: server-driven metadata.images[] (all group members).
    // Merge in the local upload record (sender only) so the sender gets
    // progress/retry UI while the server hasn't returned final URLs yet.
    const serverImages = msg.metadata?.images ?? [];
    const imageIds =
      serverImages.length > 0
        ? serverImages.map((i) => i.imageId)
        : msg.metadata?.imageIds ?? [];

    const images: ImageAttachment[] = imageIds.map((imageId) => {
      const server = serverImages.find((i) => i.imageId === imageId);
      const local = getUpload(imageId);
      const mimeType = server?.mimeType ?? local?.mimeType;
      const mediaType =
        server?.mediaType ??
        (mimeType?.startsWith('video/') ? 'video' : 'image');
      return {
        imageId,
        serverStatus: server?.status ?? 'pending',
        thumbnailUrl: server?.thumbnailUrl ?? null,
        optimizedUrl: server?.optimizedUrl ?? null,
        width: server?.width ?? null,
        height: server?.height ?? null,
        mediaType,
        mimeType,
        localUri: local?.localUri ?? null,
        localStatus: local?.status,
        localError: local?.error ?? null,
      };
    });

    return {
      ...base,
      type: 'image',
      caption: msg.content,
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

  // ─── Expense flow state ────────────────────────────────
  const [addExpenseOpen, setAddExpenseOpen] = React.useState(false);
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);
  const [detailExpenseId, setDetailExpenseId] = React.useState<string | null>(null);

  const deleteExpense = useDeleteExpense(groupId ?? '');

  const handleEditSpend = useCallback((expenseId: string) => {
    setEditingExpenseId(expenseId);
    setAddExpenseOpen(true);
  }, []);

  const handleDeleteSpend = useCallback(
    (expenseId: string) => {
      if (!groupId) return;
      deleteExpense.mutate(expenseId, {
        onError: (err: any) => {
          console.warn('[Chat] Delete expense failed:', err?.message);
        },
      });
    },
    [groupId, deleteExpense],
  );

  const handleOpenDetail = useCallback((expenseId: string) => {
    setDetailExpenseId(expenseId);
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
    if (item.type === 'spend') {
      const spendItem = item as SpendMessage;
      return (
        <SpendBubble
          item={spendItem}
          groupId={groupId ?? ''}
          isCreator={spendItem.createdBy === currentUserId}
          onEdit={handleEditSpend}
          onDelete={handleDeleteSpend}
          onOpenDetail={handleOpenDetail}
        />
      );
    }
    return <ChatBubble item={item as TextMessage | ImageMessage} isDm={isDm}/>;
  }, [groupId, currentUserId, handleEditSpend, handleDeleteSpend, handleOpenDetail]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ChatHeader
        title={headerTitle}
        subtitle={memberNames}
        isDm={group?.type === 'dm'}
        groupId={!isPendingDM ? groupId : undefined}
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
          onAddExpense={
            !isPendingDM && groupId ? () => {
              setEditingExpenseId(null);
              setAddExpenseOpen(true);
            } : undefined
          }
        />
      </KeyboardAvoidingView>

      {groupId && !isPendingDM ? (
        <>
          <AddExpenseSheet
            visible={addExpenseOpen}
            onClose={() => {
              setAddExpenseOpen(false);
              setEditingExpenseId(null);
            }}
            groupId={groupId}
            editingExpenseId={editingExpenseId}
          />
          <ExpenseDetailSheet
            visible={!!detailExpenseId}
            expenseId={detailExpenseId}
            groupId={groupId}
            onClose={() => setDetailExpenseId(null)}
            onEdit={(id) => {
              setDetailExpenseId(null);
              setEditingExpenseId(id);
              setAddExpenseOpen(true);
            }}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}
