import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { Kicker } from '../core/Kicker';

interface LiveTripCardProps {
  onTrackPress: () => void;
}

export const LiveTripCard = React.memo(({ onTrackPress }: LiveTripCardProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
          <Kicker style={{ color: 'rgba(255,255,255,0.55)' }}>Live · Ride in progress</Kicker>
        </View>
        <Text style={styles.timer}>T-03:12:00</Text>
      </View>

      <View>
        <Text style={styles.title}>Deccan Plateau Run</Text>
        <Text style={styles.subtitle}>PUNE → HYDERABAD · 4 riders</Text>
      </View>

      <View style={styles.stats}>
        <View>
          <Text style={styles.statValue}>142</Text>
          <Text style={styles.statLabel}>km covered</Text>
        </View>
        <View>
          <Text style={styles.statValue}>418</Text>
          <Text style={styles.statLabel}>remaining</Text>
        </View>
        <View>
          <Text style={styles.statValue}>58<Text style={styles.statUnit}>km/h</Text></Text>
          <Text style={styles.statLabel}>avg pace</Text>
        </View>
        <Pressable onPress={onTrackPress} style={({ pressed }) => [styles.trackButton, { opacity: pressed ? 0.9 : 1 }]}>
          <Text style={styles.trackText}>Track</Text>
          <IconArrowRight size={14} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    borderRadius: 18,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // backgroundColor: '#ff4444',
    backgroundColor: 'green',
    marginRight: 8,
  },
  timer: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)',
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.44,
    lineHeight: 24.2,
    color: colors.white,
    fontFamily: fonts.sans,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: 'rgba(255,255,255,0.55)',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: '500',
    color: colors.white,
  },
  statUnit: {
    fontSize: 11,
    opacity: 0.7,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  trackButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    marginRight: 6,
  },
});