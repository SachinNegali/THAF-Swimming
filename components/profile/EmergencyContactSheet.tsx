import { BottomSheet } from '@/components/ui/BottomSheet';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  CreateEmergencyContactRequest,
  EmergencyContact,
  ProfileFieldError,
} from '@/types/profile';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  applyServerErrors,
  hasErrors,
  validateEmergencyContact,
  type FieldErrors,
} from './validation';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEmergencyContactRequest) => void;
  saving?: boolean;
  contact?: EmergencyContact | null;
  serverErrors?: ProfileFieldError[];
}

export const EmergencyContactSheet: React.FC<Props> = ({
  visible,
  onClose,
  onSubmit,
  saving,
  contact,
  serverErrors,
}) => {
  const isEditing = !!contact;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // Reset form fields every time the sheet opens (for add) or a different contact is edited.
  useEffect(() => {
    if (visible) {
      setName(contact?.name ?? '');
      setPhone(contact?.phone ?? '');
      setRelation(contact?.relation ?? '');
      setErrors({});
    }
  }, [visible, contact]);

  useEffect(() => {
    setErrors((prev) => applyServerErrors(prev, serverErrors));
  }, [serverErrors]);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'textMuted');
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');

  const handleSubmit = () => {
    const payload: CreateEmergencyContactRequest = {
      name: name.trim(),
      phone: phone.trim(),
      ...(relation.trim() ? { relation: relation.trim() } : {}),
    };
    const next = validateEmergencyContact(payload);
    setErrors(next);
    if (hasErrors(next)) return;
    onSubmit(payload);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['70%']}
      scrollable
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: text }]}>
          {isEditing ? 'Edit contact' : 'Add emergency contact'}
        </Text>

        <Field
          label="Name"
          value={name}
          onChange={(v) => {
            setName(v);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          error={errors.name}
          placeholder="Full name"
          autoCapitalize="words"
          disabled={saving}
          surface={surface}
          border={border}
          text={text}
          muted={muted}
          danger={danger}
        />

        <Field
          label="Phone"
          value={phone}
          onChange={(v) => {
            setPhone(v);
            if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
          }}
          error={errors.phone}
          placeholder="+1 555 123 4567"
          keyboardType="phone-pad"
          disabled={saving}
          surface={surface}
          border={border}
          text={text}
          muted={muted}
          danger={danger}
        />

        <Field
          label="Relation (optional)"
          value={relation}
          onChange={(v) => {
            setRelation(v);
            if (errors.relation) setErrors((e) => ({ ...e, relation: undefined }));
          }}
          error={errors.relation}
          placeholder="e.g. Spouse"
          autoCapitalize="words"
          disabled={saving}
          surface={surface}
          border={border}
          text={text}
          muted={muted}
          danger={danger}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onClose}
            disabled={saving}
            style={[styles.btn, styles.cancelBtn, { borderColor: border }]}
          >
            <Text style={[styles.btnText, { color: text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.btn, { backgroundColor: tint, opacity: saving ? 0.7 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.btnText, { color: '#fff' }]}>
                {isEditing ? 'Save changes' : 'Add contact'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  disabled?: boolean;
  surface: string;
  border: string;
  text: string;
  muted: string;
  danger: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  autoCapitalize,
  keyboardType,
  disabled,
  surface,
  border,
  text,
  muted,
  danger,
}) => (
  <View style={styles.fieldGroup}>
    <Text style={[styles.fieldLabel, { color: muted }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={muted}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      autoCorrect={false}
      keyboardType={keyboardType ?? 'default'}
      editable={!disabled}
      style={[
        styles.input,
        {
          backgroundColor: surface,
          borderColor: error ? danger : border,
          color: text,
        },
      ]}
    />
    {error && <Text style={[styles.error, { color: danger }]}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
});

export default EmergencyContactSheet;
