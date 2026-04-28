import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { MedicalProfile } from '../../types';
import { Toggle } from '../createTrip/Toggle';
import { IconShield } from '../../icons/Icons';
import { BloodGroupHero } from './BloodGroupHero';
import { ContactRow } from './ContactRow';
import { DocumentList } from './DocumentList';
import { Section } from './Section';

interface MedicalViewProps {
  data: MedicalProfile;
  onAdd: () => void;
  onEdit: () => void;
  onToggleLock: (next: boolean) => void;
}

export const MedicalView = React.memo(({ data, onAdd, onEdit, onToggleLock }: MedicalViewProps) => (
  <View style={styles.container}>
    <BloodGroupHero
      bloodGroup={data.bloodGroup}
      bloodGroupName={data.bloodGroupName}
      updated={data.bloodGroupUpdated}
      onUpdate={onEdit}
    />

    <Section title="Medical conditions" action="Edit" onAction={onEdit}>
      <View style={styles.conditionsRow}>
        {data.conditions.map((c) => (
          <View key={c} style={styles.conditionPill}>
            <Text style={styles.conditionText}>{c}</Text>
          </View>
        ))}
      </View>
      {data.conditionsNote && (
        <View style={styles.note}>
          <Text style={styles.noteText}>{data.conditionsNote}</Text>
        </View>
      )}
    </Section>

    <Section
      title={`Emergency contacts · ${data.contacts.length}`}
      action="Add"
      onAction={onAdd}
    >
      <View style={styles.contactsList}>
        {data.contacts.map((c) => (
          <ContactRow key={c.id} contact={c} onEdit={onEdit} />
        ))}
      </View>
    </Section>

    <Section title="Home base" action="Edit" onAction={onEdit}>
      <View style={styles.addressCard}>
        <Text style={styles.addressName}>{data.address.name}</Text>
        <Text style={styles.addressLines}>{data.address.lines.join('\n')}</Text>
      </View>
    </Section>

    <Section title="Insurance & ID" action="Manage" onAction={onEdit}>
      <DocumentList documents={data.documents} />
    </Section>

    <View style={styles.lockCard}>
      <IconShield size={20} color={colors.ink} />
      <View style={styles.lockBody}>
        <Text style={styles.lockTitle}>Show on lock screen</Text>
        <Text style={styles.lockSub}>Responders see blood group + 1 contact</Text>
      </View>
      <Toggle on={data.showOnLockScreen} onChange={onToggleLock} />
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    gap: 22,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.n100,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  note: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.paper2,
    borderRadius: 10,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20.15,
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  contactsList: {
    gap: 10,
  },
  addressCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  addressLines: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 17.6,
    letterSpacing: 0.22,
    color: colors.n600,
    marginTop: 6,
  },
  lockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.n300,
  },
  lockBody: {
    flex: 1,
  },
  lockTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  lockSub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.n500,
    marginTop: 2,
  },
});
