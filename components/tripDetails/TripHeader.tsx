import { useThemeColor } from '@/hooks/use-theme-color';
import type { Trip } from '@/types/api';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING } from '../../constants/theme';

export const Header = memo(() => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={[styles.header, { backgroundColor: useThemeColor({ light: 'rgba(255,255,255,0.8)', dark: 'rgba(16, 22, 34, 0.8)' }, 'background') }]}>
      <TouchableOpacity style={styles.headerButton}>
        <Text style={{ fontSize: 24, color: textColor }}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: mutedColor }]}>TRIP DETAILS</Text>
      <TouchableOpacity style={styles.headerButton}>
        <Text style={{ fontSize: 18, color: textColor }}>↗</Text>
      </TouchableOpacity>
    </View>
  );
});

export const TripHeaderSection = memo(({ trip }: { trip?: Trip }) => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const locationParts = [trip?.trip?.startLocation?.name, trip?.trip?.destination?.name].filter(Boolean);
  const locationText = locationParts.length > 0
    ? locationParts.join(' → ')
    : 'Location not set';
  return (
    <View style={styles.tripHeader}>
      <Text style={[styles.tripTitle, { color: textColor }]}>{trip?.trip?.title ?? locationText}</Text>
      {trip?.trip?.title && (
        <View style={styles.locationRow}>
          <Text style={{ color: mutedColor }}>📍</Text>
          <Text style={[styles.locationText, { color: mutedColor }]}>{locationText}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerButton: {
    padding: SPACING.xs,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tripHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  locationText: {
    fontSize: 14,
  },
});
