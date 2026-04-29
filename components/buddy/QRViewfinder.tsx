import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../theme';

const FAUX_CELLS: [number, number, number][] = [
  [80, 80, 8],
  [85, 80, 4],
  [80, 90, 4],
  [110, 78, 6],
  [115, 88, 5],
  [98, 100, 6],
  [85, 105, 4],
];

export const QRViewfinder = React.memo(() => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200" style={StyleSheet.absoluteFillObject}>
        {[
          'M 30 60 V 30 H 60',
          'M 140 30 H 170 V 60',
          'M 170 140 V 170 H 140',
          'M 60 170 H 30 V 140',
        ].map((d, i) => (
          <Path key={i} d={d} stroke={colors.white} strokeWidth="2.5" fill="none" strokeLinecap="square" />
        ))}
        <G opacity={0.4}>
          {FAUX_CELLS.map(([x, y, s], i) => (
            <Rect key={i} x={x} y={y} width={s} height={s} fill={colors.white} />
          ))}
        </G>
      </Svg>

      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />

      <Text style={styles.caption}>Point camera at the leader&apos;s QR</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: colors.ink,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 14,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '17%',
    right: '17%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
