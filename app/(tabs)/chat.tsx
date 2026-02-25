import ChatListCard from '@/components/chat/ChatListCard';
import ChatListHeader from '@/components/chat/ChatListHeader';
import type { DMMessage, MessageItem, TripMessage } from '@/types/chat';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import {
  // SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock Data ──────────────────────────────────────────

const MESSAGES: MessageItem[] = [
  {
    id: '1',
    type: 'trip',
    title: 'Summer in Bali 🌴',
    timestamp: '12:45 PM',
    status: 'expense',
    actorName: 'Sarah',
    actionText: 'added $45 for Dinner',
    iconName: '💰',
    gradientColors: ['#fb923c', '#ec4899'],
    avatarUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=150&q=80',
  } as TripMessage,
  {
    id: '2',
    type: 'dm',
    title: 'Alex Rivera',
    timestamp: '10:12 AM',
    preview: 'Are we still on for the flight at 8?',
    isRead: false,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  } as DMMessage,
  {
    id: '3',
    type: 'trip',
    title: 'Weekend Roadtrip 🚗',
    timestamp: 'Yesterday',
    status: 'settled',
    actionText: 'John paid you $20 for Fuel',
    iconName: '🚗',
    gradientColors: ['#60a5fa', '#4f46e5'],
  } as TripMessage,
  {
    id: '4',
    type: 'dm',
    title: 'Maria Chen',
    timestamp: 'Sat',
    preview: 'The photos from the hike look great!',
    isRead: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  } as DMMessage,
  {
    id: '5',
    type: 'trip',
    title: 'Swiss Alps Hiking',
    timestamp: 'Friday',
    status: 'new',
    actionText: '$15.00 for Park Entry',
    iconName: '⛰️',
    gradientColors: ['#34d399', '#0d9488'],
    avatarUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80',
  } as TripMessage,
  {
    id: '6',
    type: 'dm',
    title: 'David Kim',
    timestamp: 'May 12',
    preview: 'Did you see the latest itinerary?',
    isRead: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  } as DMMessage,
];

// ─── Screen ─────────────────────────────────────────────

export default function MessagesScreen() {
  const isDark = useColorScheme() === 'dark';

  const renderItem = useCallback(
    ({ item }: { item: MessageItem }) => <ChatListCard item={item} />,
    [],
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlashList
        data={MESSAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ChatListHeader />}
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
});