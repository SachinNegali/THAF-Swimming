import React, { memo } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors, SPACING } from '../../constants/theme';

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

export const SummaryCard = memo(() => {
  const primaryColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const successColor = useThemeColor({}, 'success');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
      <Text style={[styles.summaryLabel, { color: mutedColor }]}>Total Group Spend</Text>
      <Text style={[styles.summaryAmount, { color: primaryColor }]}>$1,240.50</Text>
      <View style={[styles.summaryDivider, { borderColor }]} />
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryItemLabel, { color: mutedColor }]}>YOUR SHARE</Text>
          <Text style={[styles.summaryItemValue, { color: textColor }]}>$206.75</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryItemLabel, { color: mutedColor }]}>YOU PAID</Text>
          <Text style={[styles.summaryItemValue, { color: successColor }]}>$450.00</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
  },
  summaryDivider: {
    width: '100%',
    borderTopWidth: 1,
    marginVertical: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    width: '100%',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
