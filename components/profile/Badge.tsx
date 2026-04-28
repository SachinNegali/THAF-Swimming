import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface BadgeProps {
  label: string;
  filled?: boolean;
}

export const Badge = React.memo(({ label, filled }: BadgeProps) => (
  <View style={[styles.badge, filled ? styles.filled : styles.outline]}>
    <Text style={[styles.text, filled && styles.textFilled]}>{label}</Text>
  </View>
));

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filled: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.n300,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: colors.n700,
    fontWeight: '500',
  },
  textFilled: {
    color: colors.white,
  },
});
