import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../theme';

interface RelationPillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export const RelationPill = React.memo(({ label, active, onPress }: RelationPillProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.pill,
      active ? styles.active : styles.inactive,
      { transform: [{ scale: pressed ? 0.97 : 1 }] },
    ]}
  >
    <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
  </Pressable>
));

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  inactive: {
    backgroundColor: 'transparent',
    borderColor: colors.n300,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.06,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  textActive: {
    color: colors.white,
  },
});
