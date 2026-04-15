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

interface BottomActionsProps {
  onAddExpense?: () => void;
  onStartSession?: () => void;
  /** Hide entire bar, e.g. for DMs where these actions don't apply. */
  hidden?: boolean;
}

export const BottomActions = memo(
  ({ onAddExpense, onStartSession, hidden }: BottomActionsProps) => {
    const primaryColor = useThemeColor({}, 'tint');
    const surfaceColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'text');
    const barBg = useThemeColor(
      { light: 'rgba(255,255,255,0.9)', dark: 'rgba(16, 22, 34, 0.9)' },
      'background',
    );

    if (hidden || (!onAddExpense && !onStartSession)) return null;

    return (
      <View style={[styles.bottomContainer, { backgroundColor: barBg }]}>
        {onAddExpense ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={onAddExpense}
          >
            <Text style={styles.primaryButtonText}>+ Add New Expense</Text>
          </TouchableOpacity>
        ) : null}
        {onStartSession ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: surfaceColor }]}
            onPress={onStartSession}
          >
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>
              ↻ Start New Expense Session
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  },
);

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
