import { SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DateHeaderProps {
  title: string;
}

const DateHeader = memo(({ title }: DateHeaderProps) => {
  const bgColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textDim');

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: bgColor, borderColor: textColor }]}>
        <Text style={[styles.text, { color: textColor }]}>
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
});

export default DateHeader;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
