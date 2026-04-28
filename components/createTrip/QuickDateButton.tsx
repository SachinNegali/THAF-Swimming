import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme';

interface QuickDateButtonProps {
  label: string;
  hint?: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const QuickDateButton = React.memo(({ label, hint, active, onPress, style }: QuickDateButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      active ? styles.buttonActive : styles.buttonInactive,
      { transform: [{ scale: pressed ? 0.98 : 1 }] },
      style,
    ]}
  >
    <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    {hint && (
      <Text style={[styles.hint, active && styles.hintActive]}>{hint}</Text>
    )}
  </Pressable>
));

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  buttonInactive: {
    backgroundColor: colors.white,
    borderColor: colors.n200,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.14,
    color: colors.ink,
  },
  labelActive: {
    color: colors.white,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.n500,
    marginTop: 4,
  },
  hintActive: {
    color: 'rgba(255,255,255,0.7)',
  },
});
