import { useThemeColor } from '@/hooks/use-theme-color';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../../constants/theme';

export const Description = memo(({ description }: { description?: string }) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>DESCRIPTION</Text>
      <Text style={[styles.descriptionText, { color: description ? textColor : mutedColor }]}>
        {description || 'No description available'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
