import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { SearchRide } from '../../types';

interface SearchResultProps {
  r: SearchRide;
  onPress: () => void;
  index?: number;
}

export const SearchResult = React.memo(({ r, onPress, index = 0 }: SearchResultProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = index * 40;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const spotsColor = r.spots <= 2 ? colors.amber : colors.n500;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
        <View style={styles.topRow}>
          <View style={styles.leftContent}>
            <Text style={styles.meta}>{r.tag} · {r.level}</Text>
            <Text style={styles.title}>{r.title}</Text>
            <View style={styles.routeRow}>
              <Text style={styles.routeText}>{r.from}</Text>
              <Text style={styles.routeArrow}> → </Text>
              <Text style={styles.routeText}>{r.to}</Text>
              <Text style={styles.dotSep}> · </Text>
              <Text style={styles.routeText}>{r.dist}</Text>
              <Text style={styles.dotSep}> · </Text>
              <Text style={styles.routeText}>{r.days}d</Text>
            </View>
          </View>
          <View style={styles.rightContent}>
            <Text style={styles.date}>{r.start}</Text>
            <Text style={[styles.spots, { color: spotsColor }]}>{r.spots} spots</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    marginRight: 10,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.n500,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.24,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  routeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.33,
    color: colors.n600,
  },
  routeArrow: {
    color: colors.n500,
    opacity: 0.5,
    fontSize: 11,
  },
  dotSep: {
    color: colors.n400,
    marginHorizontal: 6,
    fontSize: 11,
  },
  rightContent: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ink,
  },
  spots: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 6,
  },
});