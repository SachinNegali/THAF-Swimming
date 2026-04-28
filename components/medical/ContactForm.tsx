import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconCheck, IconShield } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { MedicalContact } from '../../types';
import { PrimaryButton } from '../core/form/PrimaryButton';
import { Hairline } from '../core/Hairline';
import { Kicker } from '../core/Kicker';
import { Field } from './Field';
import { RelationPill } from './RelationPill';
import { ToggleRow } from './ToggleRow';

const RELATIONS = ['Family', 'Partner', 'Friend', 'Doctor', 'Other'];

interface ContactFormProps {
  editing?: boolean;
  initial?: MedicalContact;
  onCancel: () => void;
  onSave: (contact: Partial<MedicalContact>) => void;
  onRemove?: () => void;
}

export const ContactForm = React.memo(({ editing, initial, onCancel, onSave, onRemove }: ContactFormProps) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [relation, setRelation] = useState(initial?.relation ?? 'Family');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [primary, setPrimary] = useState(initial?.primary ?? false);
  const [shareLive, setShareLive] = useState(initial?.shareLive ?? true);

  const handleSave = () => {
    onSave({ name, relation, phone, primary, shareLive });
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Kicker>{editing ? 'Update contact' : 'New contact'}</Kicker>
        <Text style={styles.title}>
          {editing ? (
            <>
              Edit emergency <Text style={styles.titleItalic}>contact</Text>
            </>
          ) : (
            <>
              Who should we call if{' '}
              <Text style={styles.titleItalic}>something happens?</Text>
            </>
          )}
        </Text>
      </View>

      <View style={styles.fields}>
        <Field label="Full name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Anjali Negali"
            placeholderTextColor={colors.n400}
            style={styles.input}
          />
        </Field>

        <Field label="Relationship">
          <View style={styles.relationRow}>
            {RELATIONS.map((r) => (
              <RelationPill
                key={r}
                label={r}
                active={relation === r}
                onPress={() => setRelation(r)}
              />
            ))}
          </View>
        </Field>

        <Field label="Phone number" hint="We'll send a verification SMS">
          <View style={styles.phoneRow}>
            <Pressable style={styles.countryBtn}>
              <Text style={styles.countryText}>+91 ▾</Text>
            </Pressable>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="98220 11442"
              placeholderTextColor={colors.n400}
              keyboardType="phone-pad"
              style={[styles.input, styles.phoneInput]}
            />
          </View>
        </Field>

        <Hairline />

        <ToggleRow
          title="Set as primary contact"
          subtitle="Called first by responders + co-riders"
          value={primary}
          onChange={setPrimary}
        />
        <ToggleRow
          title="Share live location during rides"
          subtitle="Auto-on while a trip is active"
          value={shareLive}
          onChange={setShareLive}
        />

        <Hairline />

        <View style={styles.privacyCard}>
          <IconShield size={18} color={colors.ink} />
          <View style={styles.privacyBody}>
            <Text style={styles.privacyTitle}>Privacy</Text>
            <Text style={styles.privacyText}>
              This contact only sees your live location during an active ride.
              They can opt out anytime by replying STOP to the verification SMS.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton onPress={onCancel} dark={false} style={styles.cancelBtn}>
            Cancel
          </PrimaryButton>
          <PrimaryButton
            onPress={handleSave}
            icon={<IconCheck size={16} color={colors.white} />}
            style={styles.saveBtn}
          >
            {editing ? 'Save changes' : 'Send verification'}
          </PrimaryButton>
        </View>

        {editing && onRemove && (
          <Pressable onPress={onRemove} style={({ pressed }) => [styles.removeBtn, pressed && styles.removePressed]}>
            <Text style={styles.removeText}>Remove this contact</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  titleBlock: {
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: -0.65,
    lineHeight: 28.6,
    color: colors.ink,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  fields: {
    gap: 18,
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n300,
    borderRadius: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.07,
  },
  relationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n300,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
  },
  privacyCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.n200,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privacyBody: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 18.6,
    color: colors.n600,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 0.4,
  },
  saveBtn: {
    flex: 1,
  },
  removeBtn: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  removePressed: {
    backgroundColor: colors.n100,
  },
  removeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B8463F',
    fontFamily: fonts.sans,
  },
});
