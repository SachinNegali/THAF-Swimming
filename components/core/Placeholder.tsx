import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface PlaceholderProps {
  label?: string;
  height?: number;
  ratio?: string;
}

export const Placeholder = React.memo(({ label = 'image', height = 120, ratio }: PlaceholderProps) => {
  const aspectRatio = ratio ? ratio.split('/').reduce((a, b) => (Number(a) / Number(b)).toString()) : undefined;
  return (
    <View style={[styles.container, aspectRatio ? { aspectRatio, width: '100%' } : { height, width: '100%' }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.n100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.n200,
    borderStyle: 'dashed',
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});