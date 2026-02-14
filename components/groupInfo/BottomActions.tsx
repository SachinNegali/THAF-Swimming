import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, SPACING } from '../../constants/theme';

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

export const BottomActions = memo(() => {
  const primaryColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.bottomContainer, { backgroundColor: useThemeColor({ light: 'rgba(255,255,255,0.9)', dark: 'rgba(16, 22, 34, 0.9)' }, 'background') }]}>
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: primaryColor }]}>
        <Text style={styles.primaryButtonText}>+ Add New Expense</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.secondaryButtonText, { color: textColor }]}>↻ Start New Expense Session</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderColor: 'transparent',
    gap: SPACING.sm,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
