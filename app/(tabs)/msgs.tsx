import { CreateGroupSheet } from '@/components/chatV2/CreateGroupSheet';
import { useGroups } from '@/hooks/api/useChats';
import { useSearchUsers, type UserSearchResult } from '@/hooks/api/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import { selectUser } from '@/store/selectors';
import type { Group } from '@/types/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ThreadRow } from '../../components/chatV2/ThreadRow';
import { Kicker } from '../../components/core/Kicker';
import { Pill } from '../../components/core/Pill';
import { IconPlus, IconSearch, IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ChatFilter, ChatThread } from '../../types';

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active trips' },
  { id: 'unread', label: 'Unread' },
  { id: 'direct', label: 'Direct' },
];

function toneFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h % 4;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function mapGroupToChatThread(group: Group, currentUserId: string): ChatThread {
  const lastMsg = group.lastMessage;
  const isDM = group.type === 'dm';

  let title = group.name;
  if (isDM) {
    const other = group.members?.find((m) => m.userId !== currentUserId);
    if (other?.user) {
      title = `${other.user.fName} ${other.user.lName}`.trim();
    }
  }

  let last = 'No messages yet';
  if (lastMsg?.content) {
    const isSelf = lastMsg.sender === currentUserId;
    last = isSelf ? `You: ${lastMsg.content}` : lastMsg.content;
  }

  const id = group.id ?? (group as any)._id;

  return {
    id,
    title,
    kind: isDM ? 'dm' : 'group',
    members: !isDM ? group.members?.length : undefined,
    last,
    time: formatRelativeTime(lastMsg?.createdAt ?? group.lastActivity ?? group.updatedAt),
    unread: 0,
    tone: toneFromId(id),
  };
}

interface UserResultRowProps {
  user: UserSearchResult;
  onPress: () => void;
}

const UserResultRow = React.memo(({ user, onPress }: UserResultRowProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.userRow, pressed && styles.userRowPressed]}
    >
      {user.picture ? (
        <Image source={{ uri: user.picture }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarFallback}>
          <Text style={styles.userAvatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.userBody}>
        <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
        <Text style={styles.userHandle} numberOfLines={1}>@{user.userId}</Text>
      </View>
    </Pressable>
  );
});

const MsgsScreen = React.memo(() => {
  const router = useRouter();
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const [filter, setFilter] = useState<ChatFilter>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);

  const { data: groups, isLoading, error } = useGroups();

  const debouncedQuery = useDebounce(searchQuery, 400);
  const { data: searchData, isFetching: isSearchFetching } = useSearchUsers(debouncedQuery);

  const threads = useMemo<ChatThread[]>(() => {
    if (!groups) return [];
    return groups.map((g) => mapGroupToChatThread(g, currentUserId));
  }, [groups, currentUserId]);

  const filteredThreads = useMemo(() => {
    if (filter === 'all') return threads;
    if (filter === 'active') return threads.filter((t) => t.kind === 'group');
    if (filter === 'unread') return threads.filter((t) => t.unread > 0);
    return threads.filter((t) => t.kind === 'dm');
  }, [threads, filter]);

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
            picture:
              (member.user as any).profilePicture ||
              (member.user as any).picture ||
              '',
          });
        }
      });
    });
    return Array.from(usersMap.values());
  }, [groups, currentUserId]);

  const unreadCount = threads.reduce((acc, t) => acc + (t.unread > 0 ? 1 : 0), 0);

  const openThread = useCallback(
    (thread: ChatThread) => {
      router.push(
        `/chat/${thread.id}?recipientId=${thread.id}&recipientName=${encodeURIComponent(thread.title)}`,
      );
    },
    [router],
  );

  const openUser = useCallback(
    (user: UserSearchResult) => {
      router.push(
        `/chat/dm?recipientId=${user.id}&recipientName=${encodeURIComponent(user.name)}`,
      );
    },
    [router],
  );

  const toggleSearch = useCallback(() => {
    setIsSearching((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {isSearching ? (
          <Text style={styles.title}>
            <Text style={styles.titleItalic}>Search</Text>
          </Text>
        ) : (
          <>
            <Kicker>
              {threads.length} conversations · {unreadCount} unread
            </Kicker>
            <Text style={styles.title}>
              <Text style={styles.titleItalic}>Messages</Text>
            </Text>
          </>
        )}
      </View>
      <View style={styles.headerActions}>
        <Pressable style={styles.iconBtn} onPress={toggleSearch}>
          {isSearching ? (
            <IconX size={16} color={colors.ink} />
          ) : (
            <IconSearch size={16} color={colors.ink} />
          )}
        </Pressable>
        {!isSearching && (
          <Pressable
            style={[styles.iconBtn, styles.composeBtn]}
            onPress={() => setIsCreateGroupVisible(true)}
          >
            <IconPlus size={16} color={colors.white} />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (isSearching) {
    const searchResults = searchData?.users ?? [];
    const showMinChars = debouncedQuery.trim().length < 3;

    return (
      <SafeAreaView style={styles.screen}>
        {renderHeader()}
        <View style={styles.searchInputWrap}>
          <IconSearch size={14} color={colors.n500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or handle"
            placeholderTextColor={colors.n500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSearchFetching ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : showMinChars ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Type at least 3 characters to search
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No users found for &quot;{searchQuery}&quot;
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {searchResults.map((u) => (
                <UserResultRow key={u.userId} user={u} onPress={() => openUser(u)} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

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
          {isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Failed to load chats. Pull to retry.
              </Text>
            </View>
          ) : filteredThreads.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {threads.length === 0
                  ? 'No conversations yet. Start a new chat!'
                  : 'No conversations match this filter.'}
              </Text>
            </View>
          ) : (
            filteredThreads.map((t) => (
              <ThreadRow key={t.id} thread={t} onPress={() => openThread(t)} />
            ))
          )}
        </View>
      </ScrollView>

      <CreateGroupSheet
        visible={isCreateGroupVisible}
        onClose={() => setIsCreateGroupVisible(false)}
        initialUsers={initialUsers}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeBtn: {
    backgroundColor: colors.ink,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 22,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.n100,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  userRowPressed: {
    backgroundColor: colors.paper2,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  userBody: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  userHandle: {
    fontSize: 13,
    color: colors.n500,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
});

export default MsgsScreen;
