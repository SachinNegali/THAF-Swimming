import { useThemeColor } from '@/hooks/use-theme-color';
import { BLOOD_GROUPS, type BloodGroup } from '@/types/profile';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Props {
  value: BloodGroup | null;
  onChange: (next: BloodGroup | null) => void;
  saving?: boolean;
  disabled?: boolean;
}

export const BloodGroupSelector: React.FC<Props> = ({
  value,
  onChange,
  saving,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'textMuted');
  const tint = useThemeColor({}, 'tint');

  const handleSelect = (g: BloodGroup | null) => {
    setOpen(false);
    if (g !== value) onChange(g);
  };

  return (
    <View>
      <Text style={[styles.label, { color: muted }]}>Blood group</Text>
      {/* <TouchableOpacity
        onPress={() => !disabled && setOpen((o) => !o)}
        disabled={disabled || saving}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          { backgroundColor: surface, borderColor: border, opacity: disabled ? 0.6 : 1 },
        ]}
      >
        <Text style={[styles.triggerText, { color: value ? text : muted }]}>
          {value ?? 'No blood group set'}
        </Text>
        {saving ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Text style={{ color: muted }}>{open ? '▲' : '▼'}</Text>
        )}
      </TouchableOpacity> */}
        <View style={styles.row}>
      {BLOOD_GROUPS.map((g) => {
            const selected = g === value;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => handleSelect(g)}
                style={[styles.chip, selected && { backgroundColor: tint }]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? '#fff' : text },
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}

          </View>

      {/* {open && (
        <View style={[styles.options, { backgroundColor: surface, borderColor: border }]}>
          {BLOOD_GROUPS.map((g) => {
            const selected = g === value;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => handleSelect(g)}
                style={[styles.option, selected && { backgroundColor: tint }]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: selected ? '#fff' : text },
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => handleSelect(null)}
            style={[styles.option, styles.clearOption, { borderTopColor: border }]}
          >
            <Text style={[styles.optionText, { color: muted }]}>
              Prefer not to say
            </Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  trigger: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  triggerText: { fontSize: 15, fontWeight: '600' },
  options: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center'
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c1c1c1',
    width: "22%",
    alignItems: 'center'  
  },
  chipText: { fontSize: 16, fontWeight: "bold" },
  optionText: { fontSize: 15, fontWeight: '600' },
  clearOption: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default BloodGroupSelector;
