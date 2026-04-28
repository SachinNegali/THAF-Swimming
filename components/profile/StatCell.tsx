import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface StatCellProps {
  value: string | number;
  label: string;
  tight?: boolean;
  last?: boolean;
}

export const StatCell = React.memo(({ value, label, tight, last }: StatCellProps) => (
  <View style={[styles.cell, !last && styles.divider]}>
    <Text style={[styles.value, tight && styles.valueTight]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
));

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  divider: {
    borderRightWidth: 1,
    borderRightColor: colors.n200,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  valueTight: {
    fontSize: 17,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    textTransform: 'uppercase',
    color: colors.n500,
    marginTop: 6,
    fontWeight: '500',
  },
});
