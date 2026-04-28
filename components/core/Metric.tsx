import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface MetricProps {
  value: string | number;
  label: string;
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const Metric = React.memo(({ value, label, mono = true, align = 'left' }: MetricProps) => {
  const alignItems = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  return (
    <View style={{ alignItems }}>
      <Text style={[styles.value, { fontFamily: mono ? fonts.mono : fonts.sans }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  value: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.18,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    textTransform: 'uppercase',
    color: colors.n500,
    marginTop: 2,
    fontWeight: '500',
  },
});