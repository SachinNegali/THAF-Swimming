import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { Buddy } from '../../types';
import { Avatar } from '../core/Avatar';

interface BuddyMarkerProps {
  buddy: Buddy;
  onPress?: (b: Buddy) => void;
}

const SOS_COLOR = '#B8463F';
const STOPPED_COLOR = '#C68B2C';

export const BuddyMarker = React.memo(({ buddy, onPress }: BuddyMarkerProps) => {
  const isMe = buddy.id === 'me';
  const isLost = buddy.status === 'lost';
  const isStopped = buddy.status === 'stopped';

  const ringColor = isLost ? SOS_COLOR : isStopped ? STOPPED_COLOR : colors.ink;

  return (
    <Pressable
      onPress={() => onPress?.(buddy)}
      style={[styles.wrap, { left: `${buddy.x}%`, top: `${buddy.y}%` }]}
    >
      {!isLost && !isStopped && (
        <View style={[styles.heading, { transform: [{ rotate: `${buddy.head}deg` }] }]}>
          <Svg width={48} height={48} viewBox="0 0 48 48">
            <Path
              d="M 24 2 L 28 12 L 24 9 L 20 12 Z"
              fill={colors.ink}
              opacity={isMe ? 0.9 : 0.5}
            />
          </Svg>
        </View>
      )}

      <View style={[styles.ring, { borderColor: ringColor }]}>
        <Avatar name={buddy.name} size={30} tone={buddy.tone} />
      </View>

      {isLost && <View style={styles.lostDot} />}

      <View style={styles.callsign}>
        <Text style={styles.callsignText}>{buddy.cs}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    position: 'absolute',
    width: 48,
    height: 48,
  },
  ring: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  lostDot: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SOS_COLOR,
    borderWidth: 2,
    borderColor: colors.white,
  },
  callsign: {
    position: 'absolute',
    top: 46,
    backgroundColor: colors.ink,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  callsignText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.9,
    color: colors.white,
  },
});
