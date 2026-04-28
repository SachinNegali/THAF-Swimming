import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { FeaturedRide } from '../../types';
import { Metric } from '../core/Metric';

interface FeaturedRideCardProps {
  ride: FeaturedRide;
  onPress: () => void;
}

export const FeaturedRideCard = React.memo(({ ride, onPress }: FeaturedRideCardProps) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { opacity: pressed ? 0.95 : 1 }]}>
      <View style={styles.imageContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 400 250" style={styles.svg}>
          <Defs>
            <LinearGradient id="topog" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2a2a2a" />
              <Stop offset="100%" stopColor="#0a0a0a" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="250" fill="url(#topog)" />
          {[...Array(12)].map((_, i) => (
            <Path
              key={i}
              d={`M -20 ${20 + i * 22} Q 100 ${i * 22}, 200 ${30 + i * 20} T 420 ${10 + i * 24}`}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              fill="none"
            />
          ))}
          <Path d="M 30 200 Q 120 140, 180 150 T 340 60" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          <Circle cx="30" cy="200" r="5" fill="#fff" />
          <Circle cx="340" cy="60" r="5" fill={colors.amber} />
        </Svg>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Curated</Text>
        </View>
        <Text style={styles.coords}>34.1526°N · 77.5771°E</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Leh to </Text>
          <Text style={styles.titleItalic}>Pangong</Text>
        </View>
        <Text style={styles.region}>{ride.region.toUpperCase()}</Text>

        <View style={styles.metrics}>
          <Metric value={ride.distance.replace(' km', '')} label="km" />
          <Metric value={ride.days} label="days" />
          <Metric value={ride.elevation.replace('m', '')} label="elev m" />
          <Metric value={`${ride.spots}/${ride.total}`} label="spots" />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.n200,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 16 / 10,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.white,
  },
  coords: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
  },
  content: {
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: -0.42,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 24,
    color: colors.ink,
  },
  region: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.n500,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});