import { useThemeColor } from '@/hooks/use-theme-color';
import type { Trip } from '@/types/api';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../../constants/theme';
import { formatDate } from './helpers';

export const RouteTiming = memo(({ trip }: { trip?: Trip }) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');

  const details = [
    { label: 'From', value: trip?.startLocation?.name ?? '—' },
    { label: 'To', value: trip?.destination?.name ?? '—' },
    { label: 'Start Date', value: formatDate(trip?.startDate) },
    { label: 'End Date', value: formatDate(trip?.endDate) },
  ];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>ROUTE & TIMING</Text>
      <View style={styles.detailsGrid}>
        {details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: mutedColor }]}>{detail.label}</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{detail.value}</Text>
          </View>
        ))}
      </View>
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
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
