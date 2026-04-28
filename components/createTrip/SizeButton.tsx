import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../theme';

interface SizeButtonProps {
  label: string | React.ReactNode;
  active?: boolean;
  onPress?: () => void;
}

export const SizeButton = React.memo(({ label, active, onPress }: SizeButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      active ? styles.active : styles.inactive,
      { transform: [{ scale: pressed ? 0.96 : 1 }] },
    ]}
  >
    {typeof label === 'string' || typeof label === 'number' ? (
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    ) : (
      label
    )}
  </Pressable>
));

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  inactive: {
    backgroundColor: colors.white,
    borderColor: colors.n200,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  textActive: {
    color: colors.white,
  },
});
