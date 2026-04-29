import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { ChatThread } from '../../types';
import { Avatar } from '../core/Avatar';
import { Kicker } from '../core/Kicker';

interface ThreadRowProps {
  thread: ChatThread;
  onPress: () => void;
}

const LIVE_COLOR = '#ff4444';

export const ThreadRow = React.memo(({ thread, onPress }: ThreadRowProps) => {
  const isUnread = thread.unread > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isUnread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.avatarWrap}>
        <Avatar name={thread.title} size={48} tone={thread.tone} />
        {thread.live && <View style={styles.liveDot} />}
        {thread.kind === 'group' && !thread.live && thread.members && (
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>{thread.members}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topLine}>
          <View style={styles.titleRow}>
            {thread.pinned && (
              <Svg width="10" height="10" viewBox="0 0 12 12" fill={colors.n500}>
                <Path d="M6 1l2 3 3 .5-2 2 .5 3L6 8l-3 1.5.5-3-2-2 3-.5z" />
              </Svg>
            )}
            <Text
              numberOfLines={1}
              style={[styles.title, isUnread && styles.titleUnread]}
            >
              {thread.title}
            </Text>
            {thread.live && <Kicker style={styles.liveKicker}>LIVE</Kicker>}
          </View>
          <Text style={styles.time}>{thread.time}</Text>
        </View>

        <View style={styles.bottomLine}>
          <Text
            numberOfLines={1}
            style={[styles.last, isUnread && styles.lastUnread]}
          >
            {thread.last}
          </Text>
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{thread.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  rowUnread: {
    backgroundColor: colors.paper,
  },
  rowPressed: {
    backgroundColor: colors.paper2,
  },
  avatarWrap: {
    position: 'relative',
  },
  liveDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: LIVE_COLOR,
    borderWidth: 2.5,
    borderColor: colors.paper,
  },
  memberBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.paper,
  },
  memberBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '500',
    color: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: colors.ink,
    fontFamily: fonts.sans,
    flexShrink: 1,
  },
  titleUnread: {
    fontWeight: '600',
  },
  liveKicker: {
    color: LIVE_COLOR,
    letterSpacing: 1,
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
  },
  bottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  last: {
    flex: 1,
    fontSize: 13,
    color: colors.n600,
    fontFamily: fonts.sans,
  },
  lastUnread: {
    color: colors.ink,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '500',
    color: colors.white,
  },
});
