import ChatListCard from '@/components/chat/ChatListCard';
import ChatListHeader from '@/components/chat/ChatListHeader';
import { useGroups } from '@/hooks/api/useChats';
import { selectUser } from '@/store/selectors';
import type { Group } from '@/types/api';
import type { MessageItem, TripMessage } from '@/types/chat';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSelector } from 'react-redux';

// ─── Helpers ────────────────────────────────────────────

/** Map a Group from the API to our MessageItem type */
function mapGroupToMessageItem(group: Group, currentUserId: string): MessageItem {
  const lastMsg = group.lastMessage;
  const memberCount = group.members?.length ?? 0;

  // Format timestamp
  let timestamp = '';
  if (lastMsg?.createdAt) {
    const d = new Date(lastMsg.createdAt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    timestamp = isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // For now we treat all groups as trip-type items
  // (DMs would need a separate API or a `isDirect` flag on the Group model)
  return {
    id: group.id ?? (group as any)._id,
    type: 'trip',
    title: group.name,
    timestamp,
    status: lastMsg ? 'expense' : 'new',
    actorName: lastMsg
      ? lastMsg.senderId === currentUserId
        ? 'You'
        : lastMsg.senderId
      : undefined,
    actionText: lastMsg?.content ?? 'No messages yet',
    iconName: '💬',
    gradientColors: ['#60a5fa', '#4f46e5'],
  } as TripMessage;
}

// ─── Screen ─────────────────────────────────────────────

export default function MessagesScreen() {
  const isDark = useColorScheme() === 'dark';
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';
  const [activeTab, setActiveTab] = useState('All');

  // Fetch groups from API
  const { data: groups, isLoading, error } = useGroups();

  // Map to MessageItem
  const messages: MessageItem[] = useMemo(() => {
    if (!groups || !Array.isArray(groups)) return [];
    return groups.map((g) => mapGroupToMessageItem(g, currentUserId));
  }, [groups, currentUserId]);

  // Filter by tab
  const filteredMessages = useMemo(() => {
    if (activeTab === 'All') return messages;
    if (activeTab === 'DMs') return messages.filter((m) => m.type === 'dm');
    if (activeTab === 'Trips') return messages.filter((m) => m.type === 'trip');
    return messages;
  }, [messages, activeTab]);

  const renderItem = useCallback(
    ({ item }: { item: MessageItem }) => <ChatListCard item={item} />,
    [],
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlashList
        data={filteredMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ChatListHeader onTabChange={setActiveTab} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" />
            ) : error ? (
              <Text style={styles.emptyText}>
                Failed to load chats. Pull to retry.
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                No conversations yet. Start a new chat!
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f8',
  },
  containerDark: {
    backgroundColor: '#101622',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});