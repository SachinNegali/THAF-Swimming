import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/core/Avatar';
import { Kicker } from '../components/core/Kicker';
import { Composer } from '../components/chatV2/Composer';
import { ExpenseSheet } from '../components/chatV2/ExpenseSheet';
import { ExpenseView } from '../components/chatV2/ExpenseView';
import { MediaGrid } from '../components/chatV2/MediaGrid';
import { MessageBubble } from '../components/chatV2/MessageBubble';
import { PlusSheet } from '../components/chatV2/PlusSheet';
import { ThreadTabs, ThreadTabSpec } from '../components/chatV2/ThreadTabs';
import { DEMO_CHAT_EXPENSES, DEMO_CHAT_MEMBERS, DEMO_CHAT_MESSAGES, DEMO_CHAT_THREADS } from '../data/demoData';
import { IconBack, IconMore } from '../icons/Icons';
import { colors, fonts } from '../theme';
import { ChatTabId } from '../types';

const LIVE_COLOR = '#ff4444';

const TABS: ThreadTabSpec[] = [
  { id: 'messages', label: 'Messages' },
  { id: 'media', label: 'Media · 12' },
  { id: 'expenses', label: 'Expenses · ₹3.2k' },
];

const ChatThreadV2Screen = React.memo(() => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const thread = useMemo(
    () => DEMO_CHAT_THREADS.find((t) => t.id === id) || DEMO_CHAT_THREADS[0],
    [id]
  );

  const [tab, setTab] = useState<ChatTabId>('messages');
  const [sheet, setSheet] = useState<'plus' | 'expense' | null>(null);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handlePlus = useCallback(() => setSheet('plus'), []);
  const handlePickExpense = useCallback(() => setSheet('expense'), []);
  const handleAddExpense = useCallback(() => setSheet('expense'), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.iconBtn}>
          <IconBack size={18} color={colors.ink} />
        </Pressable>
        <View style={styles.avatarWrap}>
          <Avatar name={thread.title} size={36} tone={thread.tone} />
          {thread.live && <View style={styles.liveDot} />}
        </View>
        <View style={styles.headerBody}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {thread.title}
          </Text>
          <Text style={[styles.headerMeta, thread.live && styles.headerMetaLive]}>
            {thread.live ? 'Live · 4 riders on route' : `${thread.members ?? 4} members`}
          </Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <IconMore size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ThreadTabs tabs={TABS} active={tab} onChange={setTab} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'messages' && (
            <View style={styles.messages}>
              {DEMO_CHAT_MESSAGES.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
            </View>
          )}
          {tab === 'media' && <MediaGrid count={9} />}
          {tab === 'expenses' && (
            <ExpenseView
              expenses={DEMO_CHAT_EXPENSES}
              youOwe={515}
              youAreOwed={255}
              onAdd={handleAddExpense}
            />
          )}
        </ScrollView>

        {tab === 'messages' && <Composer onPlus={handlePlus} />}
      </KeyboardAvoidingView>

      <PlusSheet
        visible={sheet === 'plus'}
        onClose={closeSheet}
        onPickExpense={handlePickExpense}
      />
      <ExpenseSheet
        visible={sheet === 'expense'}
        onClose={closeSheet}
        members={DEMO_CHAT_MEMBERS}
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
  liveDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: LIVE_COLOR,
    borderWidth: 2,
    borderColor: colors.paper,
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
  headerMetaLive: {
    color: LIVE_COLOR,
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
});

export default ChatThreadV2Screen;
