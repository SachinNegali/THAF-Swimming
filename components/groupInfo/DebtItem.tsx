import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, SPACING } from '../../constants/theme';

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export interface Debt {
  id: string;
  from: Participant;
  to: string;
  amount: number;
  isOwedToMe: boolean;
}

export const DebtItem = memo(({ debt }: { debt: Debt }) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.debtCard, { backgroundColor: surfaceColor, borderColor }]}>
      <View style={styles.debtLeft}>
        <Image source={{ uri: debt.from.avatar }} style={styles.debtAvatar} />
        <View>
          <Text style={[styles.debtText, { color: textColor }]}>
            {debt.from.name} <Text style={{ color: mutedColor, fontWeight: '400' }}>owes</Text> {debt.to}
          </Text>
          <Text style={[styles.debtAmount, { color: debt.isOwedToMe ? primaryColor : textColor }]}>
            ${debt.amount.toFixed(2)}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[
          styles.debtButton, 
          { backgroundColor: debt.isOwedToMe ? primaryColor : `${primaryColor}20` }
        ]}
      >
        <Text style={{ 
          color: debt.isOwedToMe ? 'white' : primaryColor, 
          fontWeight: '700', 
          fontSize: 12 
        }}>
          {debt.isOwedToMe ? 'REMIND' : 'SETTLE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  debtCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  debtAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  debtText: {
    fontSize: 14,
    fontWeight: '600',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  debtButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
});
