import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { colors, fonts } from '../../theme';

interface KickerProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Kicker = React.memo(({ children, style }: KickerProps) => (
  <Text style={[styles.text, style]}>{children}</Text>
));

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.n500,
    fontWeight: '500',
  },
});