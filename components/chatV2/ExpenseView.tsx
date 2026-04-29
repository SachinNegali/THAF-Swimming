import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconPlus } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ChatExpense, ChatExpenseStatus } from '../../types';
import { Kicker } from '../core/Kicker';

interface ExpenseViewProps {
  expenses: ChatExpense[];
  youOwe: number;
  youAreOwed: number;
  onAdd: () => void;
}

const AMBER_INK = '#8a6a10';

const statusColor: Record<ChatExpenseStatus, string> = {
  pending: AMBER_INK,
  settled: colors.n500,
  owed: colors.ink,
};

export const ExpenseView = React.memo(({ expenses, youOwe, youAreOwed, onAdd }: ExpenseViewProps) => (
  <View style={styles.container}>
    <View style={styles.summary}>
      <Kicker style={styles.summaryKicker}>Trip balance</Kicker>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryLabel}>YOU OWE</Text>
          <Text style={styles.summaryAmount}>₹{youOwe}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>YOU&apos;RE OWED</Text>
          <Text style={styles.summaryAmount}>₹{youAreOwed}</Text>
        </View>
      </View>
      <Pressable style={({ pressed }) => [styles.settleBtn, pressed && styles.settlePressed]}>
        <Text style={styles.settleText}>Settle up</Text>
      </Pressable>
    </View>

    <Kicker style={styles.recentKicker}>Recent</Kicker>
    <View style={styles.list}>
      {expenses.map((e) => (
        <View key={e.id} style={styles.expenseRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>₹</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{e.title}</Text>
            <Text style={styles.meta}>
              Paid by {e.by} · ₹{e.split}/ea
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>₹{e.amount.toLocaleString()}</Text>
            <Text style={[styles.status, { color: statusColor[e.status] }]}>{e.status}</Text>
          </View>
        </View>
      ))}
    </View>

    <Pressable onPress={onAdd} style={({ pressed }) => [styles.addBtn, pressed && styles.addPressed]}>
      <IconPlus size={15} color={colors.n600} />
      <Text style={styles.addText}>Add expense</Text>
    </Pressable>
  </View>
));

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summary: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  summaryKicker: {
    color: 'rgba(255,255,255,0.6)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.55)',
  },
  summaryAmount: {
    fontFamily: fonts.mono,
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: -0.52,
    color: colors.white,
    marginTop: 2,
  },
  settleBtn: {
    width: '100%',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  settlePressed: {
    opacity: 0.85,
  },
  settleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  recentKicker: {
    marginBottom: 4,
  },
  list: {
    gap: 8,
  },
  expenseRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
  },
  status: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.n300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPressed: {
    backgroundColor: colors.n100,
  },
  addText: {
    fontSize: 13,
    color: colors.n600,
    fontFamily: fonts.sans,
  },
});
