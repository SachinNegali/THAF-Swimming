import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { Buddy, BuddySheetState, QuickMessage } from '../../types';
import { Avatar } from '../core/Avatar';
import { BottomSheet } from '../core/BottomSheetWrapper';
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
const SNAP_POINTS = ['18%', '62%'];

export const BuddySheet = React.memo(({ state, buddies, quickMsgs, onToggle, onQuickSend }: BuddySheetProps) => {
  const expanded = state === 'expanded';
  const lostCount = buddies.filter((b) => b.status === 'lost').length;
  const liveCount = buddies.filter((b) => b.status === 'live').length;
  const stoppedCount = buddies.filter((b) => b.status === 'stopped').length;

  // Persistent sheet — no dismiss; ignore close events
  const handleClose = useCallback(() => {}, []);

  return (
    <BottomSheet
      visible
      onClose={handleClose}
      snapPoints={SNAP_POINTS}
      index={expanded ? 1 : 0}
      enablePanDownToClose={false}
      withBackdrop={false}
      onChange={(i) => {
        if (i === 0 && expanded) onToggle();
        if (i === 1 && !expanded) onToggle();
      }}
    >
      <View style={styles.content}>
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
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  expanded: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    flex: 1,
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
    flex: 1,
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
