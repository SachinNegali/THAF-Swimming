import { useThemeColor } from '@/hooks/use-theme-color';
import type { Trip } from '@/types/api';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING } from '../../constants/theme';

interface OrganizerCardProps {
  setIsOpen: (isOpen: boolean) => void;
  trip?: Trip;
}

export const OrganizerCard = memo(({ setIsOpen, trip }: OrganizerCardProps) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const creator = (trip as any)?.createdBy ?? trip?.creator;
  const creatorName = typeof creator === 'object' && creator !== null
    ? `${creator.fName ?? ''} ${creator.lName ?? ''}`.trim()
    : undefined;
  const creatorEmail = typeof creator === 'object' ? creator.email : undefined;
  const memberSince = trip?.createdAt
    ? new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : undefined;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>ORGANIZER</Text>
      <Pressable style={[styles.organizerCard, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setIsOpen(true)}>
        <View style={[styles.organizerAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: surfaceColor }]}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: mutedColor }}>
            {(creatorName?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.organizerInfo}>
          <Text style={[styles.organizerName, { color: textColor }]}>{creatorName || creatorEmail || 'Unknown'}</Text>
          {memberSince && (
            <Text style={[styles.organizerMeta, { color: mutedColor }]}>Trip created {memberSince}</Text>
          )}
        </View>
        <TouchableOpacity>
          <Text style={[styles.viewProfile, { color: primaryColor }]}>View Profile</Text>
        </TouchableOpacity>
      </Pressable>
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
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'white',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  organizerMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  viewProfile: {
    fontSize: 12,
    fontWeight: '600',
  },
});
