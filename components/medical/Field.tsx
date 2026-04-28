import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { Kicker } from '../core/Kicker';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const Field = React.memo(({ label, hint, children }: FieldProps) => (
  <View>
    <Kicker style={styles.label}>{label}</Kicker>
    {children}
    {hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
));

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.n500,
    marginTop: 6,
  },
});
