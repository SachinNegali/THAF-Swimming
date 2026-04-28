import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

interface RouteSketchProps {
  from: string;
  to: string;
}

export const RouteSketch = React.memo(({ from, to }: RouteSketchProps) => {
  const { cx1, cy1, cx2, cy2 } = useMemo(() => {
    const seed = (from + to).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const s = (n: number) => ((seed * (n + 3)) % 100) / 100;
    return {
      cx1: 80 + s(1) * 80,
      cy1: 60 + s(2) * 40,
      cx2: 220 + s(3) * 60,
      cy2: 100 + s(4) * 60,
    };
  }, [from, to]);

  const fromLabel = (from || 'ORIGIN').toUpperCase();
  const toLabel = (to || 'DESTINATION').toUpperCase();

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="none">
        <Rect width="360" height="200" fill="#1a1a18" />
        {[...Array(9)].map((_, i) => (
          <Path
            key={i}
            d={`M -20 ${15 + i * 22} Q 90 ${i * 20}, 180 ${30 + i * 22} T 380 ${i * 24}`}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
            fill="none"
          />
        ))}
        <Path
          d={`M 40 160 C ${cx1} ${cy1}, ${cx2} ${cy2}, 320 50`}
          stroke="#fff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="40" cy="160" r="5" fill="#fff" />
        <Circle cx="320" cy="50" r="5" fill={colors.amber} />
        <SvgText
          x="50"
          y="180"
          fill="rgba(255,255,255,0.7)"
          fontFamily="Courier"
          fontSize="10"
          letterSpacing="1"
        >
          {fromLabel}
        </SvgText>
        <SvgText
          x="260"
          y="40"
          fill="rgba(255,255,255,0.7)"
          fontFamily="Courier"
          fontSize="10"
          letterSpacing="1"
        >
          {toLabel}
        </SvgText>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f0f0f',
  },
});
