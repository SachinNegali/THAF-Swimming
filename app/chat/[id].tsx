import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Chat, Message } from "@/types/chatTypes";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Mock messages data
const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    type: "text",
    content: "Hey! Are you still going to LA this weekend?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    senderId: "user1",
    senderName: "John Doe",
    isCurrentUser: false,
  },
  {
    id: "2",
    type: "text",
    content: "Yes! Planning to leave Friday evening",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    senderId: "currentUser",
    senderName: "You",
    isCurrentUser: true,
  },
  {
    id: "3",
    type: "text",
    content: "Perfect! I can give you a ride if you want",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    senderId: "user1",
    senderName: "John Doe",
    isCurrentUser: false,
  },
  {
    id: "4",
    type: "image",
    content: "Check out this route!",
    imageUrl: "https://picsum.photos/400/300",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    senderId: "user1",
    senderName: "John Doe",
    isCurrentUser: false,
  },
  {
    id: "5",
    type: "text",
    content: "That looks great! What time should we meet?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    senderId: "currentUser",
    senderName: "You",
    isCurrentUser: true,
  },
  {
    id: "6",
    type: "link",
    content: "https://maps.google.com/directions",
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    senderId: "user1",
    senderName: "John Doe",
    isCurrentUser: false,
    linkPreview: {
      title: "Route to Los Angeles",
      description: "Fastest route via I-5 S, approximately 6 hours",
      imageUrl: "https://picsum.photos/400/200",
    },
  },
  {
    id: "7",
    type: "text",
    content: "Sounds good! See you Friday at 5 PM",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    senderId: "currentUser",
    senderName: "You",
    isCurrentUser: true,
  },
];

export default function ChatConversationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  
  // Get params and parse them
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    isGroup: string;
    avatar?: string;
    isOnline?: string;
    participants?: string;
  }>();

  // Reconstruct chat object from params
  const chat: Partial<Chat> = {
    id: params.id,
    name: params.name,
    isGroup: params.isGroup === "true",
    avatar: params.avatar,
    isOnline: params.isOnline === "true",
    participants: params.participants ? JSON.parse(params.participants) : undefined,
  };
  
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "text",
      content,
      timestamp: new Date().toISOString(),
      senderId: "currentUser",
      senderName: "You",
      isCurrentUser: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.tabIconDefault + "30" }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {chat.name || "Chat"}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
            {chat.isGroup ? "Tap for group info" : chat.isOnline ? "Online" : "Offline"}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/groupInfo")} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Pressable style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Messages List - Inverted for chat behavior */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        inverted
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        // Optimization props for SSE updates
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
      />

      {/* Message Input */}
      <MessageInput onSend={handleSendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerAction: {
    padding: 4,
  },
  messagesList: {
    paddingVertical: 8,
  },
});
