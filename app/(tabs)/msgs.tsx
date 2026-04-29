import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Kicker } from '../../components/core/Kicker';
import { Pill } from '../../components/core/Pill';
import { ThreadRow } from '../../components/chatV2/ThreadRow';
import { DEMO_CHAT_THREADS } from '../../data/demoData';
import { IconSearch } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ChatFilter, ChatThread } from '../../types';

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active trips' },
  { id: 'unread', label: 'Unread' },
  { id: 'direct', label: 'Direct' },
];

const MsgsScreen = React.memo(() => {
  const router = useRouter();
  const [filter, setFilter] = useState<ChatFilter>('all');

  const threads = useMemo<ChatThread[]>(() => {
    if (filter === 'all') return DEMO_CHAT_THREADS;
    if (filter === 'active') return DEMO_CHAT_THREADS.filter((t) => t.live);
    if (filter === 'unread') return DEMO_CHAT_THREADS.filter((t) => t.unread > 0);
    return DEMO_CHAT_THREADS.filter((t) => t.kind === 'dm');
  }, [filter]);

  const unreadCount = DEMO_CHAT_THREADS.reduce((acc, t) => acc + (t.unread > 0 ? 1 : 0), 0);

  const openThread = useCallback(
    (thread: ChatThread) => {
      router.push({ pathname: '/chatThreadV2', params: { id: thread.id } });
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Kicker>
              {DEMO_CHAT_THREADS.length} conversations · {unreadCount} unread
            </Kicker>
            <Text style={styles.title}>
              <Text style={styles.titleItalic}>Messages</Text>
            </Text>
          </View>
          <Pressable style={styles.searchBtn}>
            <IconSearch size={16} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <Pill key={f.id} active={filter === f.id} onPress={() => setFilter(f.id)}>
              {f.label}
            </Pill>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {threads.map((t) => (
            <ThreadRow key={t.id} thread={t} onPress={() => openThread(t)} />
          ))}
          {threads.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No conversations match this filter.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.84,
    color: colors.ink,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    maxHeight: 48,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 22,
  },
  list: {
    flexDirection: 'column',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.n500,
    fontFamily: fonts.sans,
  },
});

export default MsgsScreen;
