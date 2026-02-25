import ChatBubble from '@/components/chat/ChatBubble';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import DateHeader from '@/components/chat/DateHeader';
import ExpenseCard from '@/components/chat/ExpenseCard';
import { SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  ChatSection,
  ExpenseMessage,
  ImageMessage,
  ListItem,
  TextMessage
} from '@/types/chat';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock Data ──────────────────────────────────────────

const MOCK_SECTIONS: ChatSection[] = [
  {
    title: 'July 11',
    data: [
      {
        id: '1',
        type: 'text',
        timestamp: '09:30 AM',
        senderId: 'u1',
        senderName: 'Alice',
        isMe: false,
        senderAvatar: 'https://i.pravatar.cc/150?u=alice',
        content: 'Just landed in Rome! The airport is chaos ✈️',
      } as TextMessage,
      {
        id: '2',
        type: 'text',
        timestamp: '09:45 AM',
        senderId: 'u2',
        senderName: 'Bob',
        isMe: false,
        senderAvatar: 'https://i.pravatar.cc/150?u=bob',
        content: 'Got the rental car. Ready to roll! 🏎️',
      } as TextMessage,
      {
        id: '3',
        type: 'image',
        timestamp: '09:46 AM',
        senderId: 'u2',
        senderName: 'Bob',
        isMe: false,
        senderAvatar: 'https://i.pravatar.cc/150?u=bob',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
      } as ImageMessage,
    ],
  },
  {
    title: 'July 12',
    data: [
      {
        id: '4',
        type: 'expense',
        timestamp: '10:15 AM',
        senderId: 'u3',
        senderName: 'John',
        isMe: false,
        amount: 45.0,
        category: 'Fuel',
        description: 'Gas for the rental',
      } as ExpenseMessage,
      {
        id: '5',
        type: 'text',
        timestamp: '10:42 AM',
        senderId: 'me',
        senderName: 'Me',
        isMe: true,
        content: "Awesome, I'll pay for the lunch today.",
        status: 'read',
      } as TextMessage,
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────

function flattenSections(sections: ChatSection[]): ListItem[] {
  const flattened: ListItem[] = [];
  sections.forEach((section) => {
    flattened.push({ type: 'header', title: section.title, id: `header-${section.title}` });
    flattened.push(...section.data);
  });
  return flattened;
}

// ─── Screen ─────────────────────────────────────────────

export default function GroupChatScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const isDark = useColorScheme() === 'dark';

  const flattenedData = flattenSections(MOCK_SECTIONS);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if ('title' in item && item.type === 'header') {
      return <DateHeader title={item.title} />;
    }
    if (item.type === 'expense') {
      return <ExpenseCard item={item as ExpenseMessage} />;
    }
    return <ChatBubble item={item as TextMessage | ImageMessage} />;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ChatHeader
        title="Euro Trip 2024"
        subtitle="Alice, Bob, John, Sarah"
        balanceLabel="GROUP BALANCE"
        balanceAmount="$1,240.00"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlashList
          data={flattenedData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
        />
        <ChatInput />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}