import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts } from '../../../theme';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
  dark?: boolean;
}

export const PrimaryButton = React.memo(({ children, onPress, style, icon, dark = true }: PrimaryButtonProps) => {
  const bg = dark ? colors.ink : colors.white;
  const fg = dark ? colors.white : colors.ink;
  const border = dark ? 'transparent' : colors.n300;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
      {icon}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    fontFamily: fonts.sans,
  },
});