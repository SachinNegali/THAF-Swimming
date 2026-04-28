import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ProfileEmergencyContact } from '../../types';

interface EmergencyCardProps {
  bloodGroup: string;
  contact: ProfileEmergencyContact;
  contactCount?: number;
  verified?: boolean;
  onPress?: () => void;
}

export const EmergencyCard = React.memo(({ bloodGroup, contact, contactCount = 1, verified = true, onPress }: EmergencyCardProps) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.bloodTile}>
      <Text style={styles.bloodText}>{bloodGroup}</Text>
    </View>

    <View style={styles.body}>
      <Text style={styles.name}>{contact.name}</Text>
      <Text style={styles.meta}>
        {contact.relation} · {contact.phone}
      </Text>
      <View style={styles.statusRow}>
        {verified && (
          <View style={styles.verifiedRow}>
            <View style={styles.liveDot} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        <Text style={styles.statusMeta}>
          · {bloodGroup} · {contactCount} contact{contactCount === 1 ? '' : 's'}
        </Text>
      </View>
    </View>

    <IconArrowRight size={14} color={colors.n500} />
  </Pressable>
));

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pressed: {
    backgroundColor: colors.paper2,
  },
  bloodTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodText: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 26,
    fontWeight: '400',
    color: colors.white,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.n500,
    letterSpacing: 0.44,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ff4444',
  },
  verifiedText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: '#ff4444',
  },
  statusMeta: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: colors.n500,
  },
});
