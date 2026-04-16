import { useThemeColor } from '@/hooks/use-theme-color';
import type { Address } from '@/types/profile';
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
  validateAddress,
  type FieldErrors,
} from './validation';

interface Props {
  value: Address | null;
  saving?: boolean;
  onSave: (address: Address) => void;
  serverErrors?: { field: string; message: string }[];
}

const FIELDS: { key: keyof Address; label: string; autoCapitalize?: 'none' | 'words' }[] = [
  { key: 'line1', label: 'Address line 1', autoCapitalize: 'words' },
  { key: 'line2', label: 'Address line 2', autoCapitalize: 'words' },
  { key: 'city', label: 'City', autoCapitalize: 'words' },
  { key: 'state', label: 'State / Province', autoCapitalize: 'words' },
  { key: 'country', label: 'Country', autoCapitalize: 'words' },
  { key: 'postalCode', label: 'Postal code', autoCapitalize: 'none' },
];

function normalize(a: Address | null): Address {
  return {
    line1: a?.line1 ?? '',
    line2: a?.line2 ?? '',
    city: a?.city ?? '',
    state: a?.state ?? '',
    country: a?.country ?? '',
    postalCode: a?.postalCode ?? '',
  };
}

function isEmpty(a: Address): boolean {
  return !Object.values(a).some((v) => (v ?? '').trim().length > 0);
}

function isDirty(a: Address, b: Address): boolean {
  return FIELDS.some(({ key }) => (a[key] ?? '').trim() !== (b[key] ?? '').trim());
}

export const AddressForm: React.FC<Props> = ({ value, saving, onSave, serverErrors }) => {
  const [form, setForm] = useState<Address>(normalize(value));
  const [errors, setErrors] = useState<FieldErrors>({});

  const initial = normalize(value);
  const dirty = isDirty(form, initial);
  const empty = isEmpty(form) && isEmpty(initial);

  // Reset local form whenever the server value changes (e.g. after a successful save).
  useEffect(() => {
    setForm(normalize(value));
    setErrors({});
  }, [value]);

  // Re-render errors when server validation returns.
  useEffect(() => {
    setErrors((prev) => applyServerErrors(prev, serverErrors));
  }, [serverErrors]);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'textMuted');
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');

  const handleChange = (key: keyof Address, v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSave = () => {
    const next = validateAddress(form);
    setErrors(next);
    if (hasErrors(next)) return;
    // Trim so we don't persist trailing spaces.
    const trimmed: Address = FIELDS.reduce<Address>((acc, { key }) => {
      const v = (form[key] ?? '').trim();
      if (v) acc[key] = v;
      return acc;
    }, {});
    onSave(trimmed);
  };

  return (
    <View>
      {empty && !dirty && (
        <Text style={[styles.emptyState, { color: muted }]}>No address on file</Text>
      )}
      {FIELDS.map(({ key, label, autoCapitalize }) => (
        <View key={key} style={styles.fieldGroup}>
          <Text style={[styles.label, { color: muted }]}>{label}</Text>
          <TextInput
            value={form[key] ?? ''}
            onChangeText={(v) => handleChange(key, v)}
            placeholder={label}
            placeholderTextColor={muted}
            autoCapitalize={autoCapitalize ?? 'sentences'}
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: surface,
                borderColor: errors[key] ? danger : border,
                color: text,
              },
            ]}
            editable={!saving}
          />
          {errors[key] && (
            <Text style={[styles.error, { color: danger }]}>{errors[key]}</Text>
          )}
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSave}
        disabled={!dirty || saving}
        activeOpacity={0.7}
        style={[
          styles.saveBtn,
          { backgroundColor: tint, opacity: !dirty || saving ? 0.5 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save address</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    fontStyle: 'italic',
    marginBottom: 12,
    marginLeft: 4,
  },
  fieldGroup: { marginBottom: 14 },
  label: {
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
  saveBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default AddressForm;
