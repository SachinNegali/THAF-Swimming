import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface InputRowProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const InputRow = React.memo(({ label, icon, value, onChange, placeholder }: InputRowProps) => (
  <View style={styles.row}>
    <View style={styles.iconCol}>{icon}</View>
    <View style={styles.body}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.n400}
        style={styles.input}
      />
    </View>
  </View>
));

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCol: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    color: colors.n500,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    letterSpacing: -0.15,
    marginTop: 2,
    padding: 0,
  },
});
