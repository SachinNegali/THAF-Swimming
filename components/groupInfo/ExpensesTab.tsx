import AddExpenseSheet from '@/components/chat/AddExpenseSheet';
import ExpenseDetailSheet from '@/components/chat/ExpenseDetailSheet';
import NudgeButton from '@/components/groupInfo/NudgeButton';
import SettleModal from '@/components/groupInfo/SettleModal';
import { Colors, SPACING } from '@/constants/theme';
import {
  useActiveCycle,
  useBalances,
  useExpenses,
  useStartCycle,
  useSummary,
} from '@/hooks/api/useExpenses';
import { useThemeColor } from '@/hooks/use-theme-color';
import { currencySymbol, formatCurrency } from '@/lib/currency';
import { selectUser } from '@/store/selectors';
import type { CurrencyCode, SimplifiedDebt } from '@/types/expenses';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

interface Props {
  groupId: string;
}

export default function ExpensesTab({ groupId }: Props) {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');

  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
  const [settleTarget, setSettleTarget] = useState<SimplifiedDebt | null>(null);

  const [startCurrency, setStartCurrency] = useState<CurrencyCode>('INR');
  const [showStartCycleModal, setShowStartCycleModal] = useState(false);
  const [cycleWarnings, setCycleWarnings] = useState<{
    fromUser: any;
    toUser: any;
    amount: number;
  }[] | null>(null);

  const { data: cycle, isLoading: cycleLoading } = useActiveCycle(groupId);
  const { data: balances } = useBalances(groupId, !!cycle);
  const { data: summary } = useSummary(groupId, !!cycle);
  const { data: expenses } = useExpenses(groupId, {}, !!cycle);

  const startCycle = useStartCycle(groupId);

  const handleStartCycle = () => {
    startCycle.mutate(
      { currency: startCurrency },
      {
        onSuccess: (res) => {
          setShowStartCycleModal(false);
          if (res.warnings && res.warnings.length > 0) {
            setCycleWarnings(res.warnings);
          }
        },
      },
    );
  };

  const debts = balances?.simplifiedDebts ?? [];
  const currency = cycle?.currency ?? balances?.currency;

  // ── Empty state: no active cycle ──
  if (!cycleLoading && !cycle) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>EXPENSES</Text>
        <View style={[styles.emptyCard, { borderColor, backgroundColor: surfaceColor }]}>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No active expense cycle
          </Text>
          <Text style={[styles.emptyBody, { color: mutedColor }]}>
            Start a cycle to track expenses for this group.
          </Text>
          <TouchableOpacity
            onPress={() => setShowStartCycleModal(true)}
            style={[styles.primaryButton, { backgroundColor: tintColor }]}
          >
            <Text style={styles.primaryButtonText}>Start cycle</Text>
          </TouchableOpacity>
        </View>
        <StartCycleModal
          visible={showStartCycleModal}
          onClose={() => setShowStartCycleModal(false)}
          currency={startCurrency}
          onCurrencyChange={setStartCurrency}
          onConfirm={handleStartCycle}
          loading={startCycle.isPending}
          error={(startCycle.error as any)?.message}
        />
        <CarryForwardWarningsModal
          warnings={cycleWarnings}
          currency={currency}
          onClose={() => setCycleWarnings(null)}
        />
      </View>
    );
  }

  if (cycleLoading) {
    return (
      <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View>
      {/* ── Header / cycle actions ── */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>EXPENSES</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
            <TouchableOpacity
              onPress={() => {
                setEditingExpenseId(null);
                setAddExpenseOpen(true);
              }}
              style={[styles.pillButton, { backgroundColor: tintColor }]}
            >
              <Text style={styles.pillButtonText}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStartCurrency(cycle?.currency ?? 'INR');
                setShowStartCycleModal(true);
              }}
              style={[styles.pillButton, { backgroundColor: `${tintColor}15` }]}
            >
              <Text style={{ color: tintColor, fontSize: 12, fontWeight: '700' }}>
                New cycle
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Summary ── */}
      {summary ? (
        <View style={styles.section}>
          <View style={[styles.summaryCard, { borderColor, backgroundColor: surfaceColor }]}>
            <Text style={[styles.summaryLabel, { color: mutedColor }]}>
              Total Group Spend
            </Text>
            <Text style={[styles.summaryAmount, { color: tintColor }]}>
              {formatCurrency(summary.totalSpend, currency)}
            </Text>
            {summary.byCategory.length > 0 ? (
              <View style={{ marginTop: SPACING.md, width: '100%' }}>
                {summary.byCategory.slice(0, 5).map((c) => (
                  <View key={c.category} style={styles.categoryRow}>
                    <Text style={{ color: textColor, fontWeight: '500' }}>
                      {c.category}
                    </Text>
                    <Text style={{ color: textColor, fontWeight: '700' }}>
                      {formatCurrency(c.total, currency)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ── Debts ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          WHO OWES WHOM
        </Text>
        {balances?.carryForwardIncluded ? (
          <View style={[styles.chip, { borderColor }]}>
            <Text style={{ color: mutedColor, fontSize: 11 }}>
              Includes carry-forward from previous cycle
            </Text>
          </View>
        ) : null}

        {debts.length === 0 ? (
          <Text style={{ color: mutedColor, fontSize: 13, marginTop: SPACING.sm }}>
            Everyone is settled up.
          </Text>
        ) : (
          debts.map((d, i) => {
            const fromId = d.from._id;
            const toId = d.to._id;
            const isCreditor = currentUserId === toId;
            return (
              <View
                key={`${fromId}-${toId}-${i}`}
                style={[styles.debtRow, { borderColor, backgroundColor: surfaceColor }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontWeight: '600' }}>
                    {fromId === currentUserId ? 'You' : d.from.name} →{' '}
                    {toId === currentUserId ? 'You' : d.to.name}
                  </Text>
                  <Text style={{ color: tintColor, fontWeight: '800', fontSize: 16 }}>
                    {formatCurrency(d.amount, currency)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: tintColor }]}
                    onPress={() => setSettleTarget(d)}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      Settle
                    </Text>
                  </TouchableOpacity>
                  {isCreditor ? (
                    <NudgeButton
                      groupId={groupId}
                      toUserId={fromId}
                      toName={d.from.name}
                    />
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── History ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>HISTORY</Text>
        {(expenses?.data ?? []).length === 0 ? (
          <Text style={{ color: mutedColor, fontSize: 13, marginTop: SPACING.sm }}>
            No expenses yet.
          </Text>
        ) : (
          (expenses?.data ?? []).map((e) => {
            const paidByName =
              typeof e.paidBy === 'string'
                ? 'Member'
                : e.paidBy.name ??
                  `${e.paidBy.fName ?? ''} ${e.paidBy.lName ?? ''}`.trim();
            return (
              <TouchableOpacity
                key={e._id}
                onPress={() => setDetailExpenseId(e._id)}
                style={[styles.historyRow, { borderColor }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontWeight: '700' }}>
                    {e.category} · {formatCurrency(e.amount, currency)}
                  </Text>
                  <Text style={{ color: mutedColor, fontSize: 12 }}>
                    {new Date(e.createdAt).toLocaleDateString()} · paid by{' '}
                    {paidByName} · split {e.splits.length}{' '}
                    {e.splits.length === 1 ? 'way' : 'ways'}
                  </Text>
                </View>
                <Text style={{ color: mutedColor }}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── Sheets / modals ── */}
      <AddExpenseSheet
        visible={addExpenseOpen}
        onClose={() => {
          setAddExpenseOpen(false);
          setEditingExpenseId(null);
        }}
        groupId={groupId}
        editingExpenseId={editingExpenseId}
      />
      <ExpenseDetailSheet
        visible={!!detailExpenseId}
        expenseId={detailExpenseId}
        groupId={groupId}
        onClose={() => setDetailExpenseId(null)}
        onEdit={(id) => {
          setDetailExpenseId(null);
          setEditingExpenseId(id);
          setAddExpenseOpen(true);
        }}
      />
      {settleTarget ? (
        <SettleModal
          visible={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          groupId={groupId}
          fromUserId={settleTarget.from._id}
          fromName={settleTarget.from.name ?? 'Member'}
          toUserId={settleTarget.to._id}
          toName={settleTarget.to.name ?? 'Member'}
          amount={settleTarget.amount}
          currency={currency}
        />
      ) : null}
      <StartCycleModal
        visible={showStartCycleModal}
        onClose={() => setShowStartCycleModal(false)}
        currency={startCurrency}
        onCurrencyChange={setStartCurrency}
        onConfirm={handleStartCycle}
        loading={startCycle.isPending}
        error={(startCycle.error as any)?.message}
        confirmation
      />
      <CarryForwardWarningsModal
        warnings={cycleWarnings}
        currency={currency}
        onClose={() => setCycleWarnings(null)}
      />
    </View>
  );
}

// ─── Modals ─────────────────────────────────────────────

function StartCycleModal({
  visible,
  onClose,
  currency,
  onCurrencyChange,
  onConfirm,
  loading,
  error,
  confirmation,
}: {
  visible: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string;
  confirmation?: boolean;
}) {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.card, { borderColor }]}>
          <Text style={[modalStyles.title, { color: textColor }]}>
            {confirmation ? 'Start a new cycle' : 'Start expense cycle'}
          </Text>
          {confirmation ? (
            <Text style={[modalStyles.body, { color: mutedColor }]}>
              Starting a new cycle will close the current one. Outstanding
              balances will carry forward.
            </Text>
          ) : (
            <Text style={[modalStyles.body, { color: mutedColor }]}>
              Pick a currency for the new cycle.
            </Text>
          )}
          <View style={modalStyles.chipRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => onCurrencyChange(c)}
                style={[
                  modalStyles.chip,
                  {
                    borderColor,
                    backgroundColor: currency === c ? tintColor : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: currency === c ? '#fff' : textColor,
                    fontWeight: '700',
                  }}
                >
                  {currencySymbol(c)} {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {error ? (
            <Text style={{ color: Colors.light.danger, marginTop: SPACING.sm }}>
              {error}
            </Text>
          ) : null}
          <View style={modalStyles.actionRow}>
            <TouchableOpacity
              style={[modalStyles.button, { backgroundColor: '#eee' }]}
              onPress={onClose}
            >
              <Text style={{ color: textColor, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, { backgroundColor: tintColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CarryForwardWarningsModal({
  warnings,
  currency,
  onClose,
}: {
  warnings: { fromUser: any; toUser: any; amount: number }[] | null;
  currency?: string;
  onClose: () => void;
}) {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const visible = !!warnings;
  const resolve = (u: any) =>
    typeof u === 'string' ? u : u?.name ?? `${u?.fName ?? ''} ${u?.lName ?? ''}`.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.card, { borderColor }]}>
          <Text style={[modalStyles.title, { color: textColor }]}>
            Cycle started
          </Text>
          <Text style={[modalStyles.body, { color: mutedColor }]}>
            The following balances were carried forward to the new cycle:
          </Text>
          <ScrollView style={{ maxHeight: 260, marginTop: SPACING.sm }}>
            {(warnings ?? []).map((w, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderColor,
                }}
              >
                <Text style={{ color: textColor }}>
                  {resolve(w.fromUser)} → {resolve(w.toUser)}
                </Text>
                <Text style={{ color: textColor, fontWeight: '700' }}>
                  {formatCurrency(w.amount, currency)}
                </Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[modalStyles.button, { backgroundColor: tintColor, marginTop: SPACING.md }]}
            onPress={onClose}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  primaryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: SPACING.xs,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
});
