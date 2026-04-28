import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme';

type Tone = 'light' | 'filled' | 'muted';

interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  tone?: Tone;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  light: { bg: 'transparent', fg: colors.ink, border: colors.n300 },
  filled: { bg: colors.ink, fg: colors.white, border: colors.ink },
  muted: { bg: colors.n100, fg: colors.ink, border: colors.n100 },
};

export const Pill = React.memo(({ children, active, tone = 'light', style, textStyle, onPress }: PillProps) => {
  const t = active ? TONES.filled : TONES[tone];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: t.bg, borderColor: t.border, opacity: pressed ? 0.8 : 1 }, style]}>
      <Text style={[styles.text, { color: t.fg }, textStyle]}>{children}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.06,
    fontFamily: fonts.sans,
  },
});