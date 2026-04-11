import { CreateGroupBottomSheet } from '@/components/chat/CreateGroupBottomSheet';
import ChatListCard from '@/components/chat/ChatListCard';
import ChatListHeader from '@/components/chat/ChatListHeader';
import { PublicProfileScreen } from '@/components/profile/publicProfile';
import { MOCK_USER } from '@/dummy-data/journeys';
import { useGroups } from '@/hooks/api/useChats';
import { useSearchUsers, type UserSearchResult } from '@/hooks/api/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import { selectUser } from '@/store/selectors';
import type { Group } from '@/types/api';
import type { MessageItem, TripMessage } from '@/types/chat';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSelector } from 'react-redux';

// ─── Helpers ────────────────────────────────────────────

/** Map a Group from the API to our MessageItem type */
function mapGroupToMessageItem(group: Group, currentUserId: string): MessageItem {
  const lastMsg = group.lastMessage;

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

  // For DMs, display the other person's name instead of the group name
  let title = group.name;
  if (group.type === 'dm') {
    const other = group.members?.find((m) => m.userId !== currentUserId);
    if (other?.user) {
      title = `${other.user.fName} ${other.user.lName}`.trim();
    }
  }

  return {
    id: group.id ?? (group as any)._id,
    type: group.type === 'dm' ? 'dm' : 'trip',
    title,
    timestamp,
    status: lastMsg ? 'expense' : 'new',
    actorName: lastMsg
      ? lastMsg.senderId === currentUserId
        ? 'You'
        : lastMsg.senderId
      : undefined,
    actionText: lastMsg?.content ?? 'No messages yet',
    iconName: group.type === 'dm' ? '👤' : '💬',
    gradientColors: group.type === 'dm' ? ['#f472b6', '#ec4899'] : ['#60a5fa', '#4f46e5'],
  } as TripMessage;
}

// ─── Screen ─────────────────────────────────────────────

function UserSearchResultItem({ user, isDark, onPress }: { user: UserSearchResult; isDark: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.userRow, isDark && styles.userRowDark]} onPress={onPress}>
      {user.picture ? (
        <Image source={{ uri: user.picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, isDark && styles.avatarFallbackDark]}>
          <Text style={styles.avatarFallbackText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isDark && styles.textLight]}>{user.name}</Text>
        <Text style={styles.userHandle}>@{user.userId}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const isDark = useColorScheme() === 'dark';
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';
  const [activeTab, setActiveTab] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);

  // Fetch groups from API
  const { data: groups, isLoading, error } = useGroups();

  // Extract initial users from existing chats for the create group sheet
  const initialUsers: UserSearchResult[] = useMemo(() => {
    if (!groups) return [];
    const usersMap = new Map<string, UserSearchResult>();
    groups.forEach((group) => {
      group.members?.forEach((member) => {
        if (member.userId !== currentUserId && member.user) {
          usersMap.set(member.userId, {
            id: member.userId,
            name: `${member.user.fName} ${member.user.lName}`.trim(),
            userId: (member.user as any).userId || member.user.email,
            picture: (member.user as any).profilePicture || (member.user as any).picture || '',
          });
        }
      });
    });
    return Array.from(usersMap.values());
  }, [groups, currentUserId]);

  console.log("groups!!!!!!!!......!!!!", groups)

  const debouncedQuery = useDebounce(searchQuery, 400);

  // Search users — only fires after 400ms debounce and 3+ chars
  const {
    data: searchData,
    isFetching: isSearchFetching,
  } = useSearchUsers(debouncedQuery);

  // Map to MessageItem
  const messages: MessageItem[] = useMemo(() => {
    if (!groups) return [];
    return groups.map((g) => mapGroupToMessageItem(g, currentUserId));
  }, [groups, currentUserId]);

  // Filter by tab
  const filteredMessages = useMemo(() => {
    if (activeTab === 'All') return messages;
    if (activeTab === 'DMs') return messages.filter((m) => m.type === 'dm');
    if (activeTab === 'Trips') return messages.filter((m) => m.type !== 'dm');
    return messages;
  }, [messages, activeTab]);
  
  console.log("FILTEREDDD MESSAGFESSSS......!!!", filteredMessages)
  const handleSearchToggle = useCallback(() => {
    setIsSearching((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MessageItem }) => {
      console.log("Message item\n", item)
      return(<ChatListCard item={item} />)},
    [],
  );

  const renderUserItem = useCallback(
    ({ item }: { item: UserSearchResult }) => (
      <UserSearchResultItem 
        user={item} 
        isDark={isDark} 
        onPress={() => {
          setSelectedUser(item);
          setIsOpen(true);
        }} 
      />
    ),
    [isDark],
  );

  const header = (
    <ChatListHeader
      onTabChange={setActiveTab}
      isSearching={isSearching}
      onSearchToggle={handleSearchToggle}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onComposePress={() => setIsCreateGroupVisible(true)}
    />
  );

  if (isSearching) {
    const searchResults = searchData?.users ?? [];
    console.log(".....!! Search results...", searchResults)
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <FlashList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isSearchFetching ? (
                <ActivityIndicator size="large" />
              ) : debouncedQuery.trim().length < 3 ? (
                <Text style={styles.emptyText}>Type at least 3 characters to search</Text>
              ) : (
                <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
              )}
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={64}
        />
        <PublicProfileScreen
          user={selectedUser ? {
            id: selectedUser.id,
            name: selectedUser.name,
            username: selectedUser.userId,
            email: '',
            bio: 'No bio yet',
            location: '',
            level: 1,
            avatarUrl: selectedUser.picture || 'https://via.placeholder.com/150',
            joinedDate: '',
            stats: { countries: 0, trips: 0, followers: '0' }
          } : MOCK_USER}
          isOpen={isOpen}
          setIsOpen={(open) => {
            setIsOpen(open);
            if (!open) setSelectedUser(null);
          }}
          onNavigate={() => console.log('navigate')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlashList
        data={filteredMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
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
      
      <CreateGroupBottomSheet
        visible={isCreateGroupVisible}
        onClose={() => setIsCreateGroupVisible(false)}
        initialUsers={initialUsers}
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
  textLight: {
    color: '#ffffff',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  userRowDark: {
    backgroundColor: '#1a2232',
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: 'rgba(43, 108, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackDark: {
    backgroundColor: 'rgba(43, 108, 238, 0.25)',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2b6cee',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0d121b',
  },
  userHandle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
});