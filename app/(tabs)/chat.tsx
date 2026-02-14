// import { ChatListItem } from "@/components/ChatListItem";
// import { CommunityCard } from "@/components/CommunityCard";
// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "@/hooks/use-color-scheme";
// import { Chat, Community } from "@/types/chatTypes";
// import { Ionicons } from "@expo/vector-icons";
// import React, { useCallback, useState } from "react";
// import {
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// // Mock data for chats
// const MOCK_CHATS: Chat[] = [
//   {
//     id: "1",
//     name: "San Francisco Riders",
//     lastMessage: "Hey, anyone going to LA this weekend?",
//     timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//     unreadCount: 3,
//     isGroup: true,
//   },
//   {
//     id: "2",
//     name: "John Doe",
//     lastMessage: "Thanks for the ride!",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
//     unreadCount: 0,
//     isGroup: false,
//     isOnline: true,
//     participants: ["currentUser", "john"],
//   },
//   {
//     id: "3",
//     name: "Weekend Travelers",
//     lastMessage: "Meeting at 8 AM tomorrow",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
//     unreadCount: 1,
//     isGroup: true,
//   },
//   {
//     id: "4",
//     name: "Sarah Smith",
//     lastMessage: "See you soon!",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
//     unreadCount: 0,
//     isGroup: false,
//     isOnline: false,
//     participants: ["currentUser", "sarah"],
//   },
//   {
//     id: "5",
//     name: "NYC Commuters",
//     lastMessage: "Traffic is crazy today",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
//     unreadCount: 5,
//     isGroup: true,
//   },
// ];

// // Mock data for communities
// const MOCK_COMMUNITIES: Community[] = [
//   {
//     id: "1",
//     name: "California Road Trips",
//     description: "Share your road trip experiences and find travel companions across California",
//     memberCount: 1250,
//     category: "Travel",
//     isJoined: true,
//   },
//   {
//     id: "2",
//     name: "Daily Commuters",
//     description: "Connect with people on your daily commute route and share rides",
//     memberCount: 3400,
//     category: "Commute",
//     isJoined: false,
//   },
//   {
//     id: "3",
//     name: "Weekend Adventures",
//     description: "Plan weekend getaways and outdoor activities with fellow adventurers",
//     memberCount: 890,
//     category: "Adventure",
//     isJoined: true,
//   },
//   {
//     id: "4",
//     name: "City to City",
//     description: "Long distance travel community for interstate journeys",
//     memberCount: 2100,
//     category: "Long Distance",
//     isJoined: false,
//   },
// ];

// type TabType = "chats" | "communities";

// export default function ChatScreen() {
//   const colorScheme = useColorScheme();
//   const colors = Colors[colorScheme ?? "light"];
//   const [activeTab, setActiveTab] = useState<TabType>("chats");
//   const [communities, setCommunities] = useState(MOCK_COMMUNITIES);

//   const handleJoinToggle = useCallback((communityId: string) => {
//     setCommunities((prev) =>
//       prev.map((community) =>
//         community.id === communityId
//           ? { ...community, isJoined: !community.isJoined }
//           : community
//       )
//     );
//   }, []);

//   const renderChatItem = useCallback(
//     ({ item }: { item: Chat }) => <ChatListItem chat={item} />,
//     []
//   );

//   const renderCommunityItem = useCallback(
//     ({ item }: { item: Community }) => (
//       <CommunityCard community={item} onJoinToggle={handleJoinToggle} />
//     ),
//     [handleJoinToggle]
//   );

//   const renderEmptyChats = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="chatbubbles-outline" size={64} color={colors.tabIconDefault} />
//       <Text style={[styles.emptyText, { color: colors.text }]}>
//         No chats yet
//       </Text>
//       <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
//         Start a conversation or create a group
//       </Text>
//     </View>
//   );

//   const renderEmptyCommunities = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="people-outline" size={64} color={colors.tabIconDefault} />
//       <Text style={[styles.emptyText, { color: colors.text }]}>
//         No communities
//       </Text>
//       <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
//         Join a community to get started
//       </Text>
//     </View>
//   );

//   return (
//     <View style={[styles.container, { backgroundColor: colors.background }]}>
//       {/* Custom Tab Switcher */}
//       <View style={[styles.tabBar, { borderBottomColor: colors.tabIconDefault + "30" }]}>
//         <Pressable
//           style={[
//             styles.tab,
//             activeTab === "chats" && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
//           ]}
//           onPress={() => setActiveTab("chats")}
//         >
//           <Text
//             style={[
//               styles.tabText,
//               { color: activeTab === "chats" ? colors.tint : colors.tabIconDefault },
//             ]}
//           >
//             Chats
//           </Text>
//         </Pressable>

//         <Pressable
//           style={[
//             styles.tab,
//             activeTab === "communities" && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
//           ]}
//           onPress={() => setActiveTab("communities")}
//         >
//           <Text
//             style={[
//               styles.tabText,
//               { color: activeTab === "communities" ? colors.tint : colors.tabIconDefault },
//             ]}
//           >
//             Communities
//           </Text>
//         </Pressable>
//       </View>

//       {/* Content */}
//       {activeTab === "chats" ? (
//         <FlatList
//           data={MOCK_CHATS}
//           renderItem={renderChatItem}
//           keyExtractor={(item) => item.id}
//           ListEmptyComponent={renderEmptyChats}
//           showsVerticalScrollIndicator={false}
//         />
//       ) : (
//         <FlatList
//           data={communities}
//           renderItem={renderCommunityItem}
//           keyExtractor={(item) => item.id}
//           ListEmptyComponent={renderEmptyCommunities}
//           contentContainerStyle={styles.communitiesList}
//           showsVerticalScrollIndicator={false}
//         />
//       )}

//       {/* Floating Action Button */}
//       {activeTab === "chats" && (
//         <Pressable
//           style={[styles.fab, { backgroundColor: colors.tint }]}
//           onPress={() => {
//             // TODO: Navigate to create group screen
//             console.log("Create new chat");
//           }}
//         >
//           <Ionicons name="add" size={28} color="#fff" />
//         </Pressable>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   tabBar: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     paddingTop: 60,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 16,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tabText: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   emptyContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 60,
//     gap: 12,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   emptySubtext: {
//     fontSize: 14,
//   },
//   communitiesList: {
//     padding: 16,
//   },
//   fab: {
//     position: "absolute",
//     bottom: 24,
//     right: 24,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
// });






import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// --- Types ---

type MessageType = 'trip' | 'dm';

interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: string;
  avatarUrl?: string;
  title: string;
}

interface TripMessage extends BaseMessage {
  type: 'trip';
  status: 'expense' | 'settled' | 'new';
  actorName?: string;
  actionText: string;
  iconName: string; // Using text placeholders for icons
  gradientColors: [string, string];
}

interface DMMessage extends BaseMessage {
  type: 'dm';
  preview: string;
  isRead: boolean;
}

type MessageItem = TripMessage | DMMessage;

// --- Mock Data ---

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
    gradientColors: ['#fb923c', '#ec4899'], // Orange to Pink
    avatarUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: '2',
    type: 'dm',
    title: 'Alex Rivera',
    timestamp: '10:12 AM',
    preview: 'Are we still on for the flight at 8?',
    isRead: false,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: '3',
    type: 'trip',
    title: 'Weekend Roadtrip 🚗',
    timestamp: 'Yesterday',
    status: 'settled',
    actionText: 'John paid you $20 for Fuel',
    iconName: '🚗',
    gradientColors: ['#60a5fa', '#4f46e5'], // Blue to Indigo
  },
  {
    id: '4',
    type: 'dm',
    title: 'Maria Chen',
    timestamp: 'Sat',
    preview: 'The photos from the hike look great!',
    isRead: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: '5',
    type: 'trip',
    title: 'Swiss Alps Hiking',
    timestamp: 'Friday',
    status: 'new',
    actionText: '$15.00 for Park Entry',
    iconName: '⛰️',
    gradientColors: ['#34d399', '#0d9488'], // Emerald to Teal
    avatarUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: '6',
    type: 'dm',
    title: 'David Kim',
    timestamp: 'May 12',
    preview: 'Did you see the latest itinerary?',
    isRead: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
];

// --- Components ---

// 1. Optimized List Item: Trip Group
const TripGroupItem = memo(({ item }: { item: TripMessage }) => {
  const isDark = useColorScheme() === 'dark';
  
  // Determine status color/text
  let statusColor = '#2b6cee'; // Primary blue
  let statusText = item.actorName || 'Update';
  
  if (item.status === 'settled') {
    statusColor = '#22c55e'; // Green
    statusText = 'Settled';
  } else if (item.status === 'new') {
    statusText = 'New:';
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={[styles.row, isDark && styles.rowDark]}
      // onPress={() => router.push(`/chat/${item.id}`)}
      onPress={() => router.push(`/groupInfo/${item.id}`)}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <View style={[styles.groupAvatar, { backgroundColor: item.gradientColors[0] }]}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.groupImage} />
          ) : (
            <Text style={styles.groupIconText}>{item.iconName}</Text>
          )}
        </View>
        {/* Status Badge */}
        <View style={[styles.badge, isDark && styles.badgeDark]}>
          <Text style={{ fontSize: 10 }}>
            {item.status === 'settled' ? '✅' : '💳'}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
            {item.timestamp}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text style={[styles.actorName, { color: statusColor }]}>
            {statusText}
          </Text>
          <Text style={[styles.messageText, isDark && styles.messageTextDark]} numberOfLines={1}>
            {item.actionText}
          </Text>
        </View>
      </View>

      {/* Unread Indicator (Only if not settled) */}
      {item.status !== 'settled' && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
});

// 2. Optimized List Item: Direct Message
const DirectMessageItem = memo(({ item }: { item: DMMessage }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={[styles.row, isDark && styles.rowDark]}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatarUrl }} style={styles.dmAvatar} />
      </View>

      {/* Content Section */}
      <View style={[styles.content, styles.dmContentBorder]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
            {item.timestamp}
          </Text>
        </View>
        
        <Text 
          style={[
            styles.messageText, 
            isDark && styles.messageTextDark,
            !item.isRead && styles.messageTextUnread
          ]} 
          numberOfLines={1}
        >
          {item.preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// 3. Header Component
const Header = () => {
  const isDark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'DMs', 'Trips'];

  return (
    <View style={[styles.headerContainer, isDark && styles.headerContainerDark]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>🧭</Text>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>Messages</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.iconButton, isDark && styles.iconButtonDark]}>
            <Text>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.composeButton}>
            <Text style={{ color: 'white' }}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
              activeTab === tab && isDark && styles.tabButtonActiveDark
            ]}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === tab ? styles.tabTextActive : styles.tabTextInactive,
                isDark && activeTab !== tab && styles.tabTextInactiveDark
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// --- Main Screen ---

export default function MessagesScreen() {
  const isDark = useColorScheme() === 'dark';

  // Render Item Logic
  const renderItem = useCallback(({ item }: { item: MessageItem }) => {
    if (item.type === 'trip') {
      return <TripGroupItem item={item} />;
    }
    return <DirectMessageItem item={item} />;
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <FlashList
        data={MESSAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        // estimatedItemSize={80}
        ListHeaderComponent={<Header />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// --- Styles ---

const { width } = Dimensions.get('window');

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
  textLight: {
    color: '#ffffff',
  },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f6f6f8',
    // iOS Blur effect simulation via opacity/background
  },
  headerContainerDark: {
    backgroundColor: '#101622',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
    color: '#2b6cee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0d121b',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(43, 108, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDark: {
    backgroundColor: 'rgba(43, 108, 238, 0.2)',
  },
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2b6cee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2b6cee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tabContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonActiveDark: {
    backgroundColor: '#374151', // gray-700
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2b6cee',
  },
  tabTextInactive: {
    color: '#6b7280',
  },
  tabTextInactiveDark: {
    color: '#9ca3af',
  },

  // List Item Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f6f6f8',
  },
  rowDark: {
    backgroundColor: '#101622',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  
  // Trip Group Specific
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupIconText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f6f6f8',
  },
  badgeDark: {
    backgroundColor: '#101622',
    borderColor: '#101622',
  },
  
  // DM Specific
  dmAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(43, 108, 238, 0.2)',
  },
  dmContentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 12,
    marginBottom: -12, // Offset padding to align row height
  },

  // Text Content
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0d121b',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timestampDark: {
    color: '#6b7280',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  messageTextDark: {
    color: '#9ca3af',
  },
  messageTextUnread: {
    color: '#374151',
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2b6cee',
    marginLeft: 8,
  },
});