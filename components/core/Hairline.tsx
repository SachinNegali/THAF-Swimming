import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { Kicker } from './Kicker';

interface HairlineProps {
  label?: string;
  style?: ViewStyle;
}

export const Hairline = React.memo(({ label, style }: HairlineProps) => {
  if (label) {
    return (
      <View style={[styles.row, style]}>
        <View style={styles.line} />
        <Kicker>{label}</Kicker>
        <View style={styles.line} />
      </View>
    );
  }
  return <View style={[styles.line, style]} />;
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.n200,
  },
});