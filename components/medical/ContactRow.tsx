import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { MedicalContact } from '../../types';
import { Avatar } from '../core/Avatar';

interface ContactRowProps {
  contact: MedicalContact;
  onEdit?: () => void;
}

export const ContactRow = React.memo(({ contact, onEdit }: ContactRowProps) => (
  <View style={styles.row}>
    <Avatar name={contact.name} size={40} tone={contact.tone ?? 1} />
    <View style={styles.body}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{contact.name}</Text>
        {contact.primary && (
          <View style={styles.primaryTag}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}
        {contact.verified && (
          <View style={styles.verifiedRow}>
            <View style={styles.dot} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>
        {contact.relation} · {contact.phone}
      </Text>
    </View>
    <Pressable onPress={onEdit} style={styles.editBtn}>
      <IconArrowRight size={14} color={colors.ink} />
    </Pressable>
  </View>
));

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  primaryTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  primaryText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.12,
    textTransform: 'uppercase',
    color: colors.white,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
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
  meta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: colors.n500,
    marginTop: 3,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
