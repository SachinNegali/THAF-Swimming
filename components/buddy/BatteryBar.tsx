import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface BatteryBarProps {
  pct: number;
}

const SOS_COLOR = '#B8463F';
const WARN_COLOR = '#C68B2C';

export const BatteryBar = React.memo(({ pct }: BatteryBarProps) => {
  const fillColor = pct < 25 ? SOS_COLOR : pct < 50 ? WARN_COLOR : colors.ink;
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <View style={styles.row}>
      <View style={styles.shell}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: fillColor }]} />
      </View>
      <View style={styles.tip} />
      <Text style={styles.text}>{clamped}%</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  shell: {
    width: 22,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.n400,
    padding: 1,
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
  tip: {
    width: 2,
    height: 4,
    backgroundColor: colors.n400,
    borderRadius: 1,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.n600,
    marginLeft: 2,
    minWidth: 22,
    textAlign: 'right',
  },
});
