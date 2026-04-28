import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconMinus, IconPlus } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { Kicker } from '../core/Kicker';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  caption?: string;
}

export const Stepper = React.memo(({ value, min = 1, max = 30, onChange, caption }: StepperProps) => {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <View style={styles.container}>
      <Pressable
        onPress={decrement}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        disabled={value <= min}
      >
        <IconMinus size={16} color={value <= min ? colors.n400 : colors.ink} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.value}>{value}</Text>
        {caption && <Kicker style={styles.caption}>{caption}</Kicker>}
      </View>

      <Pressable
        onPress={increment}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        disabled={value >= max}
      >
        <IconPlus size={16} color={value >= max ? colors.n400 : colors.ink} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: {
    backgroundColor: colors.n200,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 32,
    fontWeight: '500',
    letterSpacing: -0.64,
    color: colors.ink,
  },
  caption: {
    marginTop: 2,
  },
});
