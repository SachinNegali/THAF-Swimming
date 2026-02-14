
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SPACING } from '../../constants/theme';
// import { Icon } from './Icon';
import { useThemeColor } from '../../hooks/use-theme-color';
import { ThemedText } from '../themed-text';

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  icon?: string;
  placeholder?: string;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({ label, value, onChangeText, multiline, icon, placeholder }) => {
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textMuted }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderColor }, multiline && styles.multilineContainer]}>
        <TextInput
          style={[styles.input, { color: textColor }, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          multiline={multiline}
        />
        {/* {icon && <Icon name={icon} color={textMuted} size={20} style={styles.icon} />} */}
        {icon && <ThemedText>{"ic"}</ThemedText>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  icon: {
    marginLeft: 10,
  },
});
