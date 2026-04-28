import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface StepProgressProps {
  steps: string[];
  current: number;
}

export const StepProgress = React.memo(({ steps, current }: StepProgressProps) => (
  <View style={styles.row}>
    {steps.map((s, i) => {
      const isPast = i <= current;
      const isActive = i === current;
      return (
        <View key={s} style={styles.col}>
          <View style={[styles.bar, isPast ? styles.barActive : styles.barInactive]} />
          <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>{s}</Text>
        </View>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  col: {
    flex: 1,
  },
  bar: {
    height: 3,
    borderRadius: 2,
  },
  barActive: {
    backgroundColor: colors.ink,
  },
  barInactive: {
    backgroundColor: colors.n200,
  },
  label: {
    marginTop: 8,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '500',
  },
  labelInactive: {
    color: colors.n500,
    fontWeight: '400',
  },
});
