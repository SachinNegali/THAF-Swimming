import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { Toggle } from '../createTrip/Toggle';

interface ToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

export const ToggleRow = React.memo(({ title, subtitle, value, onChange }: ToggleRowProps) => (
  <View style={styles.row}>
    <View style={styles.body}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <Toggle on={value} onChange={onChange} />
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.n500,
    marginTop: 2,
  },
});
