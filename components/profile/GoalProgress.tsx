import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface GoalProgressProps {
  label: string;
  current: string;
  total: number;
  percent: number;
}

export const GoalProgress = React.memo(({ label, current, total, percent }: GoalProgressProps) => {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.label}>
          {current} <Text style={styles.dim}>/ {total.toLocaleString()}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.n500,
  },
  dim: {
    color: colors.n400,
  },
  track: {
    height: 4,
    backgroundColor: colors.n200,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.ink,
  },
});
