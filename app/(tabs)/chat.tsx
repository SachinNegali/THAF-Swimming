import { ChatListItem } from "@/components/ChatListItem";
import { CommunityCard } from "@/components/CommunityCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Chat, Community } from "@/types/chatTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Mock data for chats
const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    name: "San Francisco Riders",
    lastMessage: "Hey, anyone going to LA this weekend?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 3,
    isGroup: true,
  },
  {
    id: "2",
    name: "John Doe",
    lastMessage: "Thanks for the ride!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
    isGroup: false,
    isOnline: true,
    participants: ["currentUser", "john"],
  },
  {
    id: "3",
    name: "Weekend Travelers",
    lastMessage: "Meeting at 8 AM tomorrow",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unreadCount: 1,
    isGroup: true,
  },
  {
    id: "4",
    name: "Sarah Smith",
    lastMessage: "See you soon!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0,
    isGroup: false,
    isOnline: false,
    participants: ["currentUser", "sarah"],
  },
  {
    id: "5",
    name: "NYC Commuters",
    lastMessage: "Traffic is crazy today",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    unreadCount: 5,
    isGroup: true,
  },
];

// Mock data for communities
const MOCK_COMMUNITIES: Community[] = [
  {
    id: "1",
    name: "California Road Trips",
    description: "Share your road trip experiences and find travel companions across California",
    memberCount: 1250,
    category: "Travel",
    isJoined: true,
  },
  {
    id: "2",
    name: "Daily Commuters",
    description: "Connect with people on your daily commute route and share rides",
    memberCount: 3400,
    category: "Commute",
    isJoined: false,
  },
  {
    id: "3",
    name: "Weekend Adventures",
    description: "Plan weekend getaways and outdoor activities with fellow adventurers",
    memberCount: 890,
    category: "Adventure",
    isJoined: true,
  },
  {
    id: "4",
    name: "City to City",
    description: "Long distance travel community for interstate journeys",
    memberCount: 2100,
    category: "Long Distance",
    isJoined: false,
  },
];

type TabType = "chats" | "communities";

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [communities, setCommunities] = useState(MOCK_COMMUNITIES);

  const handleJoinToggle = useCallback((communityId: string) => {
    setCommunities((prev) =>
      prev.map((community) =>
        community.id === communityId
          ? { ...community, isJoined: !community.isJoined }
          : community
      )
    );
  }, []);

  const renderChatItem = useCallback(
    ({ item }: { item: Chat }) => <ChatListItem chat={item} />,
    []
  );

  const renderCommunityItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityCard community={item} onJoinToggle={handleJoinToggle} />
    ),
    [handleJoinToggle]
  );

  const renderEmptyChats = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.tabIconDefault} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No chats yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
        Start a conversation or create a group
      </Text>
    </View>
  );

  const renderEmptyCommunities = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.tabIconDefault} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No communities
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
        Join a community to get started
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: colors.tabIconDefault + "30" }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "chats" && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab("chats")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "chats" ? colors.tint : colors.tabIconDefault },
            ]}
          >
            Chats
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            activeTab === "communities" && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab("communities")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "communities" ? colors.tint : colors.tabIconDefault },
            ]}
          >
            Communities
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === "chats" ? (
        <FlatList
          data={MOCK_CHATS}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyChats}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={communities}
          renderItem={renderCommunityItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyCommunities}
          contentContainerStyle={styles.communitiesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      {activeTab === "chats" && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => {
            // TODO: Navigate to create group screen
            console.log("Create new chat");
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingTop: 60,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
  communitiesList: {
    padding: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
