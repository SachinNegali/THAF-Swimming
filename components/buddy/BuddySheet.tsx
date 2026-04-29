import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { Buddy, BuddySheetState, QuickMessage } from '../../types';
import { Avatar } from '../core/Avatar';
import { Kicker } from '../core/Kicker';
import { BuddyRow } from './BuddyRow';
import { QuickMessages } from './QuickMessages';

interface BuddySheetProps {
  state: BuddySheetState;
  buddies: Buddy[];
  quickMsgs: QuickMessage[];
  onToggle: () => void;
  onQuickSend?: (m: QuickMessage) => void;
}

const SOS_COLOR = '#B8463F';

export const BuddySheet = React.memo(({ state, buddies, quickMsgs, onToggle, onQuickSend }: BuddySheetProps) => {
  const expanded = state === 'expanded';
  const lostCount = buddies.filter((b) => b.status === 'lost').length;
  const liveCount = buddies.filter((b) => b.status === 'live').length;
  const stoppedCount = buddies.filter((b) => b.status === 'stopped').length;

  return (
    <View style={styles.sheet}>
      <Pressable onPress={onToggle} style={styles.handleArea}>
        <View style={styles.handle} />
      </Pressable>

      <QuickMessages messages={quickMsgs} onSend={onQuickSend} />

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.expandedHeader}>
            <Kicker>Pack · {buddies.length}</Kicker>
            <Pressable onPress={onToggle}>
              <Text style={styles.hideText}>Hide</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {buddies.map((b) => (
              <BuddyRow key={b.id} buddy={b} />
            ))}
          </ScrollView>
        </View>
      ) : (
        <Pressable onPress={onToggle} style={styles.collapsed}>
          <View style={styles.summaryLeft}>
            <View style={styles.avatarStack}>
              {buddies.slice(0, 4).map((b, i) => (
                <View
                  key={b.id}
                  style={[styles.stackedAvatar, { marginLeft: i === 0 ? 0 : -10 }]}
                >
                  <Avatar name={b.name} size={28} tone={b.tone} />
                </View>
              ))}
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryLine}>
                {lostCount > 0 && (
                  <Text style={styles.summaryLost}>
                    {lostCount} lost signal{lostCount === 1 ? '' : 's'}
                  </Text>
                )}
                <Text style={styles.summaryRest}>
                  {lostCount > 0 ? ' · ' : ''}
                  {liveCount} live · {stoppedCount} stopped
                </Text>
              </Text>
              <Text style={styles.tapHint}>Tap to expand</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <View style={styles.rotateIcon}>
              <IconArrowRight size={14} color={colors.n600} />
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.paper,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  handleArea: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n300,
  },
  expanded: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    maxHeight: 460,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 14,
    paddingBottom: 10,
  },
  hideText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.n600,
    textTransform: 'uppercase',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 4,
  },
  collapsed: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: colors.paper,
    borderRadius: 999,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  summaryLine: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  summaryLost: {
    color: SOS_COLOR,
    fontWeight: '600',
  },
  summaryRest: {
    color: colors.n500,
    fontWeight: '400',
  },
  tapHint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.n500,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rotateIcon: {
    transform: [{ rotate: '-90deg' }],
  },
});
