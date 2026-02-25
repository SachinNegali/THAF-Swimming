import { SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ExpenseMessage } from '@/types/chat';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ExpenseCardProps {
  item: ExpenseMessage;
}

const ExpenseCard = memo(({ item }: ExpenseCardProps) => {
  const primaryColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor(
    { light: 'rgba(43, 108, 238, 0.05)', dark: 'rgba(43, 108, 238, 0.15)' },
    'surface',
  );
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor, borderColor: `${primaryColor}20` }]}>
      <View style={[styles.icon, { backgroundColor: primaryColor }]}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>⛽</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          {item.senderName} added{' '}
          <Text style={{ color: primaryColor, fontWeight: '700' }}>
            ${item.amount.toFixed(2)}
          </Text>{' '}
          for {item.category}
        </Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          Trip Expense • {item.timestamp}
        </Text>
      </View>
      <Text style={{ color: mutedColor }}>›</Text>
    </View>
  );
});

export default ExpenseCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
});
