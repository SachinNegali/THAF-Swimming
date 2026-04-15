import { BottomSheet } from '@/components/ui/BottomSheet';
import { Colors, SPACING } from '@/constants/theme';
import { useGroup } from '@/hooks/api/useChats';
import {
  useActiveCycle,
  useCreateExpense,
  useExpense,
  useStartCycle,
  useUpdateExpense,
  type ExpenseApiError,
} from '@/hooks/api/useExpenses';
import { useThemeColor } from '@/hooks/use-theme-color';
import { pickImages } from '@/hooks/useMediaUpload';
import { currencySymbol } from '@/lib/currency';
import { selectUser } from '@/store/selectors';
import type { CreateExpenseRequest, CurrencyCode, SplitType } from '@/types/expenses';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

const CATEGORIES = ['Food', 'Drinks', 'Transport', 'Stay', 'Shopping', 'Other'];
const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  editingExpenseId?: string | null;
}

export default function AddExpenseSheet({
  visible,
  onClose,
  groupId,
  editingExpenseId,
}: Props) {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surfaceLight');
  const dangerColor = Colors.light.danger;

  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const { data: group } = useGroup(groupId, !!groupId);
  const { data: cycle, isLoading: cycleLoading } = useActiveCycle(groupId, visible);
  const { data: editingExpense } = useExpense(
    groupId,
    editingExpenseId ?? '',
    !!editingExpenseId && visible,
  );

  const createExpense = useCreateExpense(groupId);
  const updateExpense = useUpdateExpense(groupId);
  const startCycle = useStartCycle(groupId);

  const isEdit = !!editingExpenseId;

  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);

  const [startCurrency, setStartCurrency] = useState<CurrencyCode>('INR');

  const members = useMemo(() => {
    const list = group?.members ?? [];
    return list
      .map((m) => {
        const id = m.userId || m.user?._id || '';
        const name = m.user
          ? `${m.user.fName ?? ''} ${m.user.lName ?? ''}`.trim() || m.user.email
          : id;
        return id ? { id, name } : null;
      })
      .filter((x): x is { id: string; name: string } => !!x);
  }, [group]);

  // ── Reset / hydrate on open ──
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setSplitError(null);
    if (isEdit && editingExpense) {
      setAmountText(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setNote(editingExpense.note ?? '');
      setPaidBy(
        typeof editingExpense.paidBy === 'string'
          ? editingExpense.paidBy
          : editingExpense.paidBy._id,
      );
      setSplitType(editingExpense.splitType);
      const splitMemberIds = editingExpense.splits.map((s) =>
        typeof s.user === 'string' ? s.user : s.user._id,
      );
      setMemberIds(splitMemberIds);
      if (editingExpense.splitType === 'custom') {
        const map: Record<string, string> = {};
        editingExpense.splits.forEach((s) => {
          const uid = typeof s.user === 'string' ? s.user : s.user._id;
          map[uid] = String(s.amount);
        });
        setCustomSplits(map);
      }
      setReceiptUri(editingExpense.imageUrl ?? null);
    } else if (!isEdit) {
      setAmountText('');
      setCategory('Food');
      setNote('');
      setPaidBy(currentUserId);
      setSplitType('equal');
      setMemberIds(members.map((m) => m.id));
      setCustomSplits({});
      setReceiptUri(null);
    }
  }, [visible, isEdit, editingExpense, members, currentUserId]);

  // Update member preselection when the group members arrive after open.
  useEffect(() => {
    if (visible && !isEdit && memberIds.length === 0 && members.length > 0) {
      setMemberIds(members.map((m) => m.id));
      if (!paidBy) setPaidBy(currentUserId);
    }
  }, [visible, isEdit, members, memberIds.length, paidBy, currentUserId]);

  const amount = useMemo(() => {
    const n = Number(amountText);
    return Number.isFinite(n) ? n : NaN;
  }, [amountText]);

  const customSum = useMemo(() => {
    return memberIds.reduce((acc, id) => {
      const v = Number(customSplits[id] ?? 0);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [customSplits, memberIds]);

  const toggleMember = (id: string) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handlePickReceipt = async () => {
    const images = await pickImages();
    if (images[0]?.uri) setReceiptUri(images[0].uri);
  };

  const validate = (): string | null => {
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid amount.';
    if (!category.trim()) return 'Category is required.';
    if (category.length > 50) return 'Category is too long.';
    if (note.length > 500) return 'Note must be under 500 characters.';
    if (!paidBy) return 'Select who paid.';
    if (splitType === 'equal' && memberIds.length === 0)
      return 'Select at least one member to split with.';
    if (splitType === 'custom') {
      if (memberIds.length === 0) return 'Select at least one member.';
      if (Math.abs(customSum - amount) > 0.01)
        return `Custom splits must sum to ${amount.toFixed(2)}. Current total: ${customSum.toFixed(2)}.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSplitError(null);

    const payload: CreateExpenseRequest = {
      amount,
      category: category.trim(),
      note: note.trim() || undefined,
      imageUrl: receiptUri && receiptUri.startsWith('http') ? receiptUri : null,
      splitType,
      memberIds,
      paidBy,
      customSplits:
        splitType === 'custom'
          ? memberIds.map((id) => ({
              userId: id,
              amount: Number(customSplits[id] ?? 0),
            }))
          : undefined,
    };

    try {
      if (isEdit && editingExpenseId) {
        await updateExpense.mutateAsync({
          expenseId: editingExpenseId,
          data: payload,
        });
      } else {
        await createExpense.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      const e = err as ExpenseApiError;
      if (e?.code === 'INVALID_SPLIT_AMOUNTS') {
        setSplitError(e.message);
      } else if (e?.code === 'EDIT_WINDOW_EXPIRED') {
        setError('This expense can no longer be edited.');
      } else if (e?.code === 'NOT_EXPENSE_CREATOR') {
        setError('Only the creator can edit this expense.');
      } else if (e?.code === 'MEMBER_NOT_IN_GROUP') {
        setError('That user is no longer in the group.');
      } else {
        setError(e?.message ?? 'Something went wrong.');
      }
    }
  };

  const busy = createExpense.isPending || updateExpense.isPending;

  // ── No active cycle: show start-cycle form ──
  if (visible && !cycleLoading && !cycle && !isEdit) {
    return (
      <BottomSheet visible={visible} onClose={onClose} snapPoints={['55%']} scrollable>
        <View style={styles.padded}>
          <Text style={[styles.title, { color: textColor }]}>
            Start an expense cycle
          </Text>
          <Text style={[styles.muted, { color: mutedColor, marginBottom: SPACING.md }]}>
            Pick a currency to start tracking expenses for this group.
          </Text>
          <View style={styles.chipRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setStartCurrency(c)}
                style={[
                  styles.chip,
                  {
                    borderColor,
                    backgroundColor:
                      startCurrency === c ? tintColor : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: startCurrency === c ? '#fff' : textColor,
                    fontWeight: '600',
                  }}
                >
                  {currencySymbol(c)} {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {startCycle.isError ? (
            <Text style={{ color: dangerColor, marginTop: SPACING.sm }}>
              {(startCycle.error as any)?.message ?? 'Could not start cycle.'}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.submit, { backgroundColor: tintColor }]}
            onPress={() => startCycle.mutate({ currency: startCurrency })}
            disabled={startCycle.isPending}
          >
            {startCycle.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Start cycle</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={['92%']} scrollable>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.padded}
      >
        <Text style={[styles.title, { color: textColor }]}>
          {isEdit ? 'Edit expense' : 'Add expense'}
        </Text>
        {cycle ? (
          <Text style={[styles.muted, { color: mutedColor, marginBottom: SPACING.md }]}>
            Currency {currencySymbol(cycle.currency)} {cycle.currency}
          </Text>
        ) : null}

        {/* Amount */}
        <Text style={[styles.label, { color: mutedColor }]}>Amount</Text>
        <View style={[styles.amountRow, { borderColor, backgroundColor: surfaceColor }]}>
          <Text style={{ fontSize: 22, color: tintColor, fontWeight: '700' }}>
            {currencySymbol(cycle?.currency)}
          </Text>
          <TextInput
            value={amountText}
            onChangeText={(t) => setAmountText(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={mutedColor}
            style={[styles.amountInput, { color: textColor }]}
          />
        </View>

        {/* Category */}
        <Text style={[styles.label, { color: mutedColor, marginTop: SPACING.md }]}>
          Category
        </Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                {
                  borderColor,
                  backgroundColor: category === c ? tintColor : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  color: category === c ? '#fff' : textColor,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={CATEGORIES.includes(category) ? '' : category}
          onChangeText={(v) => setCategory(v)}
          placeholder="Custom category"
          placeholderTextColor={mutedColor}
          style={[
            styles.textInput,
            { borderColor, color: textColor, backgroundColor: surfaceColor, marginTop: SPACING.sm },
          ]}
          maxLength={50}
        />

        {/* Note */}
        <Text style={[styles.label, { color: mutedColor, marginTop: SPACING.md }]}>
          Note (optional)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          placeholderTextColor={mutedColor}
          multiline
          maxLength={500}
          style={[
            styles.textInput,
            { borderColor, color: textColor, backgroundColor: surfaceColor, minHeight: 60 },
          ]}
        />

        {/* Receipt */}
        <Text style={[styles.label, { color: mutedColor, marginTop: SPACING.md }]}>
          Receipt (optional)
        </Text>
        <TouchableOpacity
          onPress={handlePickReceipt}
          style={[styles.receiptButton, { borderColor }]}
        >
          {receiptUri ? (
            <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
          ) : (
            <Text style={{ color: mutedColor }}>Attach receipt image</Text>
          )}
        </TouchableOpacity>

        {/* Paid by */}
        <Text style={[styles.label, { color: mutedColor, marginTop: SPACING.md }]}>
          Paid by
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setPaidBy(m.id)}
                style={[
                  styles.chip,
                  {
                    borderColor,
                    backgroundColor: paidBy === m.id ? tintColor : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: paidBy === m.id ? '#fff' : textColor,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {m.id === currentUserId ? 'You' : m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Split type */}
        <Text style={[styles.label, { color: mutedColor, marginTop: SPACING.md }]}>
          Split
        </Text>
        <View style={styles.chipRow}>
          {(['equal', 'custom'] as SplitType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setSplitType(t)}
              style={[
                styles.chip,
                {
                  borderColor,
                  backgroundColor: splitType === t ? tintColor : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  color: splitType === t ? '#fff' : textColor,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {t === 'equal' ? 'Equal' : 'Custom'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Members list (equal: multi-select; custom: rows with amounts) */}
        <View style={{ marginTop: SPACING.sm }}>
          {members.map((m) => {
            const selected = memberIds.includes(m.id);
            return (
              <View
                key={m.id}
                style={[
                  styles.memberRow,
                  { borderColor },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleMember(m.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor,
                        backgroundColor: selected ? tintColor : 'transparent',
                      },
                    ]}
                  >
                    {selected ? (
                      <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: textColor, fontWeight: '500' }}>
                    {m.id === currentUserId ? 'You' : m.name}
                  </Text>
                </TouchableOpacity>

                {splitType === 'custom' && selected ? (
                  <TextInput
                    value={customSplits[m.id] ?? ''}
                    onChangeText={(v) =>
                      setCustomSplits((prev) => ({
                        ...prev,
                        [m.id]: v.replace(/[^0-9.]/g, ''),
                      }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={mutedColor}
                    style={[
                      styles.splitInput,
                      { borderColor, color: textColor, backgroundColor: surfaceColor },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {splitType === 'custom' && Number.isFinite(amount) ? (
          <Text
            style={{
              color: Math.abs(customSum - amount) > 0.01 ? dangerColor : mutedColor,
              marginTop: SPACING.sm,
              fontSize: 12,
            }}
          >
            Splits sum: {customSum.toFixed(2)} / {amount.toFixed(2)} ·{' '}
            remainder: {(amount - customSum).toFixed(2)}
          </Text>
        ) : null}
        {splitError ? (
          <Text style={{ color: dangerColor, marginTop: SPACING.xs }}>
            {splitError}
          </Text>
        ) : null}
        {error ? (
          <Text style={{ color: dangerColor, marginTop: SPACING.sm }}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submit, { backgroundColor: tintColor }]}
          onPress={handleSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isEdit ? 'Save changes' : 'Add expense'}
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  muted: {
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.sm,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  receiptButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  receiptImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitInput: {
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    textAlign: 'right',
    fontSize: 14,
  },
  submit: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
