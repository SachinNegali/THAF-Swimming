import type { DMMessage, MessageItem, TripMessage } from '@/types/chat';
import { router } from 'expo-router';
import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// ─── Sub-renderers ──────────────────────────────────────

function TripAvatar({ item, isDark }: { item: TripMessage; isDark: boolean }) {
  return (
    <View style={styles.avatarContainer}>
      <View style={[styles.groupAvatar, { backgroundColor: item.gradientColors[0] }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.groupImage} />
        ) : (
          <Text style={styles.groupIconText}>{item.iconName}</Text>
        )}
      </View>
      <View style={[styles.badge, isDark && styles.badgeDark]}>
        <Text style={{ fontSize: 10 }}>
          {item.status === 'settled' ? '✅' : '💳'}
        </Text>
      </View>
    </View>
  );
}

function DMAvatar({ item }: { item: DMMessage }) {
  return (
    <View style={styles.avatarContainer}>
      <Image source={{ uri: item.avatarUrl }} style={styles.dmAvatar} />
    </View>
  );
}

function TripSubtitle({ item }: { item: TripMessage }) {
  let statusColor = '#2b6cee';
  let statusText = item.actorName || 'Update';

  if (item.status === 'settled') {
    statusColor = '#22c55e';
    statusText = 'Settled';
  } else if (item.status === 'new') {
    statusText = 'New:';
  }

  return (
    <View style={styles.messageRow}>
      <Text style={[styles.actorName, { color: statusColor }]}>{statusText}</Text>
      <Text style={styles.messageText} numberOfLines={1}>
        {item.actionText}
      </Text>
    </View>
  );
}

function DMSubtitle({ item, isDark }: { item: DMMessage; isDark: boolean }) {
  return (
    <Text
      style={[
        styles.messageText,
        isDark && styles.messageTextDark,
        !item.isRead && styles.messageTextUnread,
      ]}
      numberOfLines={1}
    >
      {item.preview}
    </Text>
  );
}

// ─── Main Component ─────────────────────────────────────

interface ChatListCardProps {
  item: MessageItem;
}

const ChatListCard = memo(({ item }: ChatListCardProps) => {
  const isDark = useColorScheme() === 'dark';
  const isTrip = item.type === 'trip';
  console.log("THIS IS THAT ITEMMMM.....", item)
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.row, isDark && styles.rowDark]}
      // onPress={() => router.push(`/chat/${item.id}`)}
      onPress={() => router.push(`/chat/${item.id}?recipientId=${item.id}&recipientName=${item.title}`)}
    >
      {/* Avatar */}
      {isTrip ? (
        <TripAvatar item={item as TripMessage} isDark={isDark} />
      ) : (
        <DMAvatar item={item as DMMessage} />
      )}

      {/* Content */}
      <View style={[styles.content, !isTrip && styles.dmContentBorder]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDark && styles.textLight]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
            {item.timestamp}
          </Text>
        </View>

        {isTrip ? (
          <TripSubtitle item={item as TripMessage} />
        ) : (
          <DMSubtitle item={item as DMMessage} isDark={isDark} />
        )}
      </View>

      {/* Unread indicator */}
      {isTrip && (item as TripMessage).status !== 'settled' && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
});

export default ChatListCard;

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
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
  textLight: {
    color: '#ffffff',
  },

  // Avatar shared
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },

  // Trip avatar
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

  // DM avatar
  dmAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(43, 108, 238, 0.2)',
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  dmContentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 12,
    marginBottom: -12,
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
