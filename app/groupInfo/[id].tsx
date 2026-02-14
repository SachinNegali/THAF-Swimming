import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { BottomActions } from '../../components/groupInfo/BottomActions';
import { DebtItem, type Debt } from '../../components/groupInfo/DebtItem';
import { ExpenseItem, type Expense } from '../../components/groupInfo/ExpenseItem';
import { GroupIdentity } from '../../components/groupInfo/GroupIdentity';
import { Header } from '../../components/groupInfo/Header';
import { MediaGallery } from '../../components/groupInfo/MediaGallery';
import { SummaryCard } from '../../components/groupInfo/SummaryCard';
import { Colors, SPACING } from '../../constants/theme';

// --- Helper Hook for Theme Colors ---

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

// --- Mock Data ---

const DEBTS: Debt[] = [
  { id: '1', from: { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' }, to: 'Bob', amount: 15.00, isOwedToMe: false },
  { id: '2', from: { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' }, to: 'You', amount: 243.25, isOwedToMe: true },
];

const EXPENSES: Expense[] = [
  { id: '1', title: 'Group Dinner at Alpine Lodge', paidBy: 'Alice', date: 'Yesterday', amount: 184.20, category: 'food' },
  { id: '2', title: 'Gas Refill - Shell Station', paidBy: 'You', date: '2 days ago', amount: 65.00, category: 'transport' },
  { id: '3', title: 'AirBnB Booking', paidBy: 'Charlie', date: '3 days ago', amount: 991.30, category: 'accommodation' },
];

// --- Types for FlashList Items ---

type ListItem = 
  | { type: 'header' }
  | { type: 'identity' }
  | { type: 'media' }
  | { type: 'summary' }
  | { type: 'debts-header' }
  | { type: 'debt'; data: Debt }
  | { type: 'expenses-header' }
  | { type: 'expense'; data: Expense };

// --- Main Screen ---

export default function GroupInfoScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textDimColor = useThemeColor({}, 'textDim');
  const tintColor = useThemeColor({}, 'tint');

  // Flatten all data into a single array for FlashList
  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [
      { type: 'header' },
      { type: 'identity' },
      { type: 'media' },
      { type: 'summary' },
      { type: 'debts-header' },
      ...DEBTS.map(debt => ({ type: 'debt' as const, data: debt })),
      { type: 'expenses-header' },
      ...EXPENSES.map(expense => ({ type: 'expense' as const, data: expense })),
    ];
    return items;
  }, []);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'header':
        return <Header />;
      case 'identity':
        return <GroupIdentity />;
      case 'media':
        return <MediaGallery />;
      case 'summary':
        return (
          <View style={styles.sectionContainer}>
            <SummaryCard />
          </View>
        );
      case 'debts-header':
        return (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: textDimColor }]}>
              SETTLEMENT ENGINE
            </Text>
          </View>
        );
      case 'debt':
        return (
          <View style={styles.debtContainer}>
            <DebtItem debt={item.data} />
          </View>
        );
      case 'expenses-header':
        return (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textDimColor }]}>EXPENSE HISTORY</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAll, { color: tintColor }]}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'expense':
        return (
          <View style={styles.expenseContainer}>
            <ExpenseItem expense={item.data} />
          </View>
        );
      default:
        return null;
    }
  }, [textDimColor, tintColor]);

  const getItemType = useCallback((item: ListItem) => {
    return item.type;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        // estimatedItemSize={100}
        getItemType={getItemType}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      />
      <BottomActions />
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  debtContainer: {
    paddingHorizontal: SPACING.md,
  },
  expenseContainer: {
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
  },
});