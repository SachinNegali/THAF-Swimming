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

export interface Expense {
  id: string;
  title: string;
  paidBy: string;
  date: string;
  amount: number;
  category: 'food' | 'transport' | 'accommodation' | 'other';
}

const categoryColors: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  accommodation: '#a855f7',
  other: '#6b7280',
};

const categoryIcons: Record<string, string> = {
  food: '☕',
  transport: '🚗',
  accommodation: '🏨',
  other: '📦',
};

export const ExpenseItem = memo(({ expense }: { expense: Expense }) => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.expenseItem, { borderColor }]}>
      <View style={[styles.expenseIcon, { backgroundColor: `${categoryColors[expense.category]}20` }]}>
        <Text>{categoryIcons[expense.category]}</Text>
      </View>
      <View style={styles.expenseContent}>
        <Text style={[styles.expenseTitle, { color: textColor }]}>{expense.title}</Text>
        <Text style={[styles.expenseMeta, { color: mutedColor }]}>Paid by {expense.paidBy} • {expense.date}</Text>
      </View>
      <Text style={[styles.expenseAmount, { color: textColor }]}>${expense.amount.toFixed(2)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseMeta: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
