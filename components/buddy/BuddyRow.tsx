import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { Buddy } from '../../types';
import { Avatar } from '../core/Avatar';
import { BatteryBar } from './BatteryBar';
import { SignalBars } from './SignalBars';

interface BuddyRowProps {
  buddy: Buddy;
}

const LIVE_COLOR = '#ff4444';
const STOPPED_COLOR = '#C68B2C';
const SOS_COLOR = '#B8463F';

export const BuddyRow = React.memo(({ buddy }: BuddyRowProps) => {
  const dotColor =
    buddy.status === 'lost' ? SOS_COLOR : buddy.status === 'stopped' ? STOPPED_COLOR : LIVE_COLOR;
  const isMe = buddy.id === 'me';

  const meta =
    buddy.status === 'live'
      ? `${buddy.kmh} km/h · ETA ${buddy.eta} · ${buddy.last} ago`
      : buddy.status === 'stopped'
      ? `Stopped · ETA ${buddy.eta} · ${buddy.last} ago`
      : `Signal lost · last seen ${buddy.last} ago`;

  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        <Avatar name={buddy.name} size={36} tone={buddy.tone} />
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.headRow}>
          <Text style={styles.cs}>{buddy.cs}</Text>
          {buddy.role !== 'rider' && (
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{buddy.role}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>
          {buddy.name}
          {isMe && <Text style={styles.meSuffix}> · me</Text>}
        </Text>
        <Text
          style={[styles.meta, buddy.status === 'lost' && styles.metaLost]}
        >
          {meta}
        </Text>
      </View>

      <View style={styles.right}>
        <SignalBars n={buddy.sig} />
        <BatteryBar pct={buddy.bat} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  avatarWrap: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cs: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.n600,
    fontWeight: '500',
  },
  roleTag: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    backgroundColor: colors.n100,
  },
  roleText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.12,
    textTransform: 'uppercase',
    color: colors.n700,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    marginTop: 1,
    fontFamily: fonts.sans,
  },
  meSuffix: {
    color: colors.n500,
    fontWeight: '400',
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.n500,
    marginTop: 3,
  },
  metaLost: {
    color: SOS_COLOR,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
