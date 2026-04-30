import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Composer } from '../../components/chatV2/Composer';
import { ExpenseSheet } from '../../components/chatV2/ExpenseSheet';
import { ExpenseView } from '../../components/chatV2/ExpenseView';
import { MediaGrid } from '../../components/chatV2/MediaGrid';
import { MessageBubble } from '../../components/chatV2/MessageBubble';
import { PlusSheet } from '../../components/chatV2/PlusSheet';
import { ThreadTabs, ThreadTabSpec } from '../../components/chatV2/ThreadTabs';
import { Avatar } from '../../components/core/Avatar';
import {
  useFindDM,
  useGroup,
  useGroupMessages,
  useSendDMMessage,
  useSendGroupMessage,
} from '../../hooks/api/useChats';
import { useCreateExpense, useExpenses } from '../../hooks/api/useExpenses';
import { IconBack, IconMore } from '../../icons/Icons';
import { selectUser } from '../../store/selectors';
import { colors, fonts } from '../../theme';
import type { Message } from '../../types/api';
import type { ChatExpense, ChatExpenseStatus, ChatMember, ChatMessage, ChatTabId } from '../../types';
import type { Expense } from '../../types/expenses';

const ME_ID = 'you';

function toneFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h % 4;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface MemberInfo {
  name: string;
  tone: number;
}

function mapMessage(
  msg: Message,
  currentUserId: string,
  members: Record<string, MemberInfo>,
): ChatMessage | null {
  if (msg.isDeleted) return null;

  const isMe = msg.sender === currentUserId;
  const info = members[msg.sender];
  const from = isMe ? 'You' : info?.name ?? 'Member';
  const tone = info?.tone ?? toneFromId(msg.sender);
  const time = formatTime(msg.createdAt);

  if (msg.type === 'spend') {
    const spend = msg.metadata?.spend;
    if (!spend) {
      return { kind: 'msg', from, tone, me: isMe, text: msg.content, time };
    }
    const perHead = spend.splitCount > 0 ? Math.round(spend.amount / spend.splitCount) : spend.amount;
    const paidByName = spend.paidBy?.name ?? from;
    return {
      kind: 'expense',
      from,
      tone,
      me: isMe,
      title: spend.note?.trim() || spend.category || 'Expense',
      amount: `${spend.currency === 'INR' ? '₹' : ''}${spend.amount}`,
      split: `${spend.splitCount} ways · ${spend.currency === 'INR' ? '₹' : ''}${perHead}/ea`,
      paidBy: paidByName,
      status: 'pending',
      payCta: isMe ? 'Details' : `Pay ${spend.currency === 'INR' ? '₹' : ''}${perHead}`,
      time,
    };
  }

  if (msg.type === 'image') {
    const first = msg.metadata?.images?.[0];
    return {
      kind: 'image',
      from,
      tone,
      me: isMe,
      caption: msg.content || undefined,
      filename: first?.imageId ? `IMG · ${first.imageId.slice(0, 6)}` : 'IMG',
      time,
    };
  }

  return { kind: 'msg', from, tone, me: isMe, text: msg.content, time };
}

function expenseStatus(e: Expense, currentUserId: string): ChatExpenseStatus {
  if (e.splits.every((s) => s.settled)) return 'settled';
  const paidById =
    typeof e.paidBy === 'string' ? e.paidBy : e.paidBy?._id ?? '';
  return paidById === currentUserId ? 'owed' : 'pending';
}

function paidByName(e: Expense, currentUserId: string): string {
  if (typeof e.paidBy === 'string') {
    return e.paidBy === currentUserId ? 'You' : 'Member';
  }
  if (e.paidBy?._id === currentUserId) return 'You';
  const fName = e.paidBy?.fName ?? '';
  const lName = e.paidBy?.lName ?? '';
  return `${fName} ${lName}`.trim() || e.paidBy?.name || 'Member';
}

const ChatThreadV2Screen = React.memo(() => {
  const router = useRouter();
  const { id, recipientId, recipientName } = useLocalSearchParams<{
    id?: string;
    recipientId?: string;
    recipientName?: string;
  }>();

  const groupId = id ?? '';
  const isPendingDM = groupId === 'dm' && !!recipientId;

  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const { data: existingDM } = useFindDM(recipientId ?? '', isPendingDM);

  const { data: group, isLoading: groupLoading } = useGroup(
    groupId,
    !isPendingDM && !!groupId,
  );

  const {
    data: messagePages,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGroupMessages(groupId, recipientId, undefined, true);

  const sendGroup = useSendGroupMessage();
  const sendDM = useSendDMMessage();

  // If a real DM resolves, swap the URL param to the canonical group id.
  useEffect(() => {
    if (!isPendingDM) return;
    let realId: string | undefined = existingDM?.id;
    if (!realId && messagePages?.pages?.[0]?.data?.[0]) {
      realId = messagePages.pages[0].data[0].group;
    }
    if (realId) {
      router.setParams({ id: realId });
    }
  }, [existingDM, messagePages, isPendingDM, router]);

  // ─── Member directory (real userIds) ────────────────────
  const memberInfo = useMemo<Record<string, MemberInfo>>(() => {
    const map: Record<string, MemberInfo> = {};
    group?.members?.forEach((m) => {
      const userId = m.userId || m.user?._id;
      if (!userId) return;
      const name = m.user
        ? `${m.user.fName ?? ''} ${m.user.lName ?? ''}`.trim() || m.user.email
        : userId;
      map[userId] = { name, tone: toneFromId(userId) };
    });
    return map;
  }, [group]);

  // ─── ExpenseSheet members (uses 'you' alias for current user) ──
  const sheetMembers = useMemo<ChatMember[]>(() => {
    const list: ChatMember[] = [];
    const seen = new Set<string>();
    list.push({ id: ME_ID, name: 'You', tone: toneFromId(currentUserId) });
    seen.add(currentUserId);
    group?.members?.forEach((m) => {
      const uid = m.userId || m.user?._id;
      if (!uid || seen.has(uid)) return;
      seen.add(uid);
      const name = m.user
        ? m.user.fName?.trim() || `${m.user.fName ?? ''} ${m.user.lName ?? ''}`.trim() || m.user.email
        : uid;
      list.push({ id: uid, name, tone: toneFromId(uid) });
    });
    return list;
  }, [group, currentUserId]);

  // ─── Flatten + map messages (oldest → newest, like /chat/[id]) ──
  const flatMessages = useMemo<Message[]>(() => {
    if (!messagePages?.pages) return [];
    return messagePages.pages.flatMap((p) => p.data ?? []).filter(Boolean) as Message[];
  }, [messagePages]);

  const uiMessages = useMemo<ChatMessage[]>(() => {
    return flatMessages
      .map((m) => mapMessage(m, currentUserId, memberInfo))
      .filter((m): m is ChatMessage => m !== null);
  }, [flatMessages, currentUserId, memberInfo]);

  const mediaCount = useMemo(
    () =>
      flatMessages.reduce(
        (acc, m) => acc + (m.metadata?.images?.length ?? (m.type === 'image' ? 1 : 0)),
        0,
      ),
    [flatMessages],
  );

  // ─── Expenses (only valid for real groups) ──────────────
  const expensesEnabled = !isPendingDM && !!groupId;
  const { data: expensesData } = useExpenses(groupId, {}, expensesEnabled);
  const realExpenses: Expense[] = expensesData?.data ?? [];

  const chatExpenses = useMemo<ChatExpense[]>(() => {
    return realExpenses.map((e) => ({
      id: e._id,
      title: e.note?.trim() || e.category,
      by: paidByName(e, currentUserId),
      amount: e.amount,
      split: e.splits.length > 0 ? Math.round(e.amount / e.splits.length) : e.amount,
      status: expenseStatus(e, currentUserId),
      day: new Date(e.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [realExpenses, currentUserId]);

  const { youOwe, youAreOwed, expenseTotalLabel } = useMemo(() => {
    let owe = 0;
    let owed = 0;
    let total = 0;
    realExpenses.forEach((e) => {
      total += e.amount;
      const paidById =
        typeof e.paidBy === 'string' ? e.paidBy : e.paidBy?._id ?? '';
      e.splits.forEach((s) => {
        if (s.settled) return;
        const userId = typeof s.user === 'string' ? s.user : s.user?._id;
        if (paidById === currentUserId && userId !== currentUserId) {
          owed += s.amount;
        } else if (userId === currentUserId && paidById !== currentUserId) {
          owe += s.amount;
        }
      });
    });
    const totalLabel =
      total >= 1000 ? `₹${(total / 1000).toFixed(1)}k` : `₹${total}`;
    return { youOwe: owe, youAreOwed: owed, expenseTotalLabel: totalLabel };
  }, [realExpenses, currentUserId]);

  const tabs = useMemo<ThreadTabSpec[]>(
    () => [
      { id: 'messages', label: 'Messages' },
      { id: 'media', label: `Media · ${mediaCount}` },
      { id: 'expenses', label: `Expenses · ${expenseTotalLabel}` },
    ],
    [mediaCount, expenseTotalLabel],
  );

  // ─── Header derivation ──────────────────────────────────
  const isDM = group?.type === 'dm' || isPendingDM;
  const headerTitle = useMemo(() => {
    if (isPendingDM) return recipientName ?? 'Direct message';
    if (isDM) {
      const other = group?.members?.find(
        (m) => (m.userId || m.user?._id) !== currentUserId,
      );
      if (other?.user) {
        return `${other.user.fName ?? ''} ${other.user.lName ?? ''}`.trim() ||
          other.user.email ||
          group?.name ||
          'Direct message';
      }
    }
    return group?.name || recipientName || 'Conversation';
  }, [group, isDM, isPendingDM, recipientName, currentUserId]);

  const headerTone = useMemo(
    () => toneFromId(group?.id ?? recipientId ?? groupId ?? 'x'),
    [group, recipientId, groupId],
  );
  const memberCount = group?.members?.length ?? (isDM ? 2 : 0);

  // ─── Tabs / sheet state ────────────────────────────────
  const [tab, setTab] = useState<ChatTabId>('messages');
  const [sheet, setSheet] = useState<'plus' | 'expense' | null>(null);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handlePlus = useCallback(() => setSheet('plus'), []);
  const handlePickExpense = useCallback(() => {
    if (!expensesEnabled) {
      setSheet(null);
      return;
    }
    setSheet('expense');
  }, [expensesEnabled]);
  const handleAddExpense = useCallback(() => {
    if (!expensesEnabled) return;
    setSheet('expense');
  }, [expensesEnabled]);
  const closeSheet = useCallback(() => setSheet(null), []);

  // ─── Send text ──────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      try {
        if (isPendingDM && recipientId) {
          const response = await sendDM.mutateAsync({
            recipientId,
            data: { content: trimmed },
          });
          const realGroupId =
            (response as any)?.group ?? (response as any)?.data?.groupId;
          if (realGroupId) {
            router.setParams({ id: realGroupId });
          }
          return;
        }
        if (!groupId) return;
        await sendGroup.mutateAsync({
          groupId,
          data: { content: trimmed },
        });
      } catch (err) {
        console.warn('[ChatThreadV2] Send failed:', err);
      }
    },
    [groupId, isPendingDM, recipientId, sendDM, sendGroup, router],
  );

  // ─── Create expense ─────────────────────────────────────
  const createExpense = useCreateExpense(expensesEnabled ? groupId : '');

  const handleExpenseSubmit = useCallback(
    (data: {
      amount: number;
      title: string;
      category: string;
      paidBy: string;
      splitWith: string[];
    }) => {
      if (!expensesEnabled) return;
      const realPaidBy = data.paidBy === ME_ID ? currentUserId : data.paidBy;
      const realSplitWith = data.splitWith.map((sid) =>
        sid === ME_ID ? currentUserId : sid,
      );
      const memberIds = Array.from(
        new Set([realPaidBy, ...realSplitWith]),
      ).filter(Boolean);
      if (!realPaidBy || memberIds.length === 0) return;
      createExpense.mutate(
        {
          amount: data.amount,
          category: data.category,
          note: data.title,
          splitType: 'equal',
          paidBy: realPaidBy,
          memberIds,
        },
        {
          onError: (err: any) => {
            console.warn('[ChatThreadV2] Create expense failed:', err?.message);
          },
        },
      );
    },
    [expensesEnabled, currentUserId, createExpense],
  );

  // ─── Auto-scroll on new messages ────────────────────────
  const scrollRef = useRef<ScrollView | null>(null);
  const isInitialScrollRef = useRef(true);
  const isNearBottomRef = useRef(true);
  const lastCountRef = useRef(0);

  useEffect(() => {
    if (tab !== 'messages') return;
    if (uiMessages.length === 0) return;

    const count = uiMessages.length;
    if (isInitialScrollRef.current) {
      isInitialScrollRef.current = false;
      lastCountRef.current = count;
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 120);
      return () => clearTimeout(t);
    }
    if (count > lastCountRef.current && isNearBottomRef.current) {
      lastCountRef.current = count;
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(t);
    }
    lastCountRef.current = count;
  }, [uiMessages.length, tab]);

  const onScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottomRef.current = distanceFromBottom < 150;
  }, []);

  const onScrollEndDrag = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      if (contentOffset.y < 80 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const isLoading = !isPendingDM && (groupLoading || messagesLoading);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.iconBtn}>
          <IconBack size={18} color={colors.ink} />
        </Pressable>
        <View style={styles.avatarWrap}>
          <Avatar name={headerTitle} size={36} tone={headerTone} />
        </View>
        <View style={styles.headerBody}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {headerTitle}
          </Text>
          <Text style={styles.headerMeta}>
            {isDM ? 'Direct message' : `${memberCount} members`}
          </Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <IconMore size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ThreadTabs tabs={tabs} active={tab} onChange={setTab} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            onScrollEndDrag={onScrollEndDrag}
            scrollEventThrottle={100}
          >
            {tab === 'messages' && (
              <View style={styles.messages}>
                {isFetchingNextPage && (
                  <View style={styles.loadMore}>
                    <ActivityIndicator color={colors.n500} size="small" />
                  </View>
                )}
                {uiMessages.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>
                      {isPendingDM
                        ? 'Send a message to start the conversation'
                        : 'No messages yet'}
                    </Text>
                  </View>
                ) : (
                  uiMessages.map((m, i) => <MessageBubble key={i} m={m} />)
                )}
              </View>
            )}
            {tab === 'media' && (
              mediaCount > 0 ? (
                <MediaGrid count={Math.min(mediaCount, 24)} />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No media shared yet</Text>
                </View>
              )
            )}
            {tab === 'expenses' && (
              expensesEnabled ? (
                <ExpenseView
                  expenses={chatExpenses}
                  youOwe={youOwe}
                  youAreOwed={youAreOwed}
                  onAdd={handleAddExpense}
                />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    Expenses are available once the conversation starts
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        )}

        {tab === 'messages' && <Composer onPlus={handlePlus} onSend={handleSend} />}
      </KeyboardAvoidingView>

      <PlusSheet
        visible={sheet === 'plus'}
        onClose={closeSheet}
        onPickExpense={handlePickExpense}
      />
      <ExpenseSheet
        visible={sheet === 'expense'}
        onClose={closeSheet}
        members={sheetMembers}
        onSubmit={handleExpenseSubmit}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  headerMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.n500,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  messages: {
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    color: colors.n500,
    fontFamily: fonts.sans,
    textAlign: 'center',
  },
});

export default ChatThreadV2Screen;
