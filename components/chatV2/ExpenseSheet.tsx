import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconCheck, IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ChatMember } from '../../types';
import { Avatar } from '../core/Avatar';
import { BottomSheet } from '../core/BottomSheetWrapper';
import { PrimaryButton } from '../core/form/PrimaryButton';
import { Kicker } from '../core/Kicker';
import { Pill } from '../core/Pill';

interface ExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: { amount: number; title: string; category: string; paidBy: string; splitWith: string[] }) => void;
  members: ChatMember[];
}

const CATEGORIES = ['Fuel', 'Food', 'Lodging', 'Tolls', 'Repairs', 'Other'];

export const ExpenseSheet = React.memo(({ visible, onClose, onSubmit, members }: ExpenseSheetProps) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Fuel');
  const [paidBy, setPaidBy] = useState('you');
  const [splitWith, setSplitWith] = useState<string[]>(['priya', 'dev', 'ravi']);

  const num = useMemo(() => parseFloat(amount) || 0, [amount]);
  const splitCount = splitWith.length + (splitWith.includes(paidBy) ? 0 : 1);
  const perHead = splitCount > 0 ? Math.round(num / splitCount) : 0;
  const canSubmit = num > 0 && title.trim().length > 0;

  const toggleSplit = (id: string) => {
    setSplitWith((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    if (!canSubmit) return;
    onSubmit?.({ amount: num, title: title.trim(), category, paidBy, splitWith });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={['90%']} scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Kicker>New expense</Kicker>
            <Text style={styles.headerTitle}>Split with pack</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <IconX size={18} color={colors.n500} />
          </Pressable>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))}
            placeholder="0"
            placeholderTextColor={colors.n400}
            inputMode="decimal"
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What's it for? (Shell fuel, chai stop…)"
          placeholderTextColor={colors.n400}
          style={styles.titleInput}
        />

        <Kicker style={styles.kicker}>Category</Kicker>
        <View style={styles.pillRow}>
          {CATEGORIES.map((c) => (
            <Pill key={c} active={category === c} onPress={() => setCategory(c)}>
              {c}
            </Pill>
          ))}
        </View>

        <Kicker style={styles.kicker}>Paid by</Kicker>
        <View style={styles.pillRow}>
          {members.map((m) => {
            const isActive = paidBy === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setPaidBy(m.id)}
                style={[styles.payerChip, isActive ? styles.payerActive : styles.payerInactive]}
              >
                <Avatar name={m.name} size={22} tone={m.tone} />
                <Text style={[styles.payerText, isActive && styles.payerTextActive]}>{m.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.splitHeader}>
          <Kicker>Split equally with</Kicker>
          <Text style={styles.perHead}>{perHead > 0 ? `₹${perHead}/ea` : '—'}</Text>
        </View>
        <View style={styles.splitCard}>
          {members
            .filter((m) => m.id !== paidBy)
            .map((m, i, arr) => {
              const on = splitWith.includes(m.id);
              const isLast = i === arr.length - 1;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleSplit(m.id)}
                  style={[styles.splitRow, !isLast && styles.splitRowDivider]}
                >
                  <Avatar name={m.name} size={30} tone={m.tone} />
                  <Text style={styles.splitName}>{m.name}</Text>
                  <View style={[styles.checkbox, on ? styles.checkboxOn : styles.checkboxOff]}>
                    {on && <IconCheck size={14} color={colors.white} />}
                  </View>
                </Pressable>
              );
            })}
        </View>

        <View style={styles.actions}>
          <PrimaryButton onPress={onClose} dark={false} style={styles.cancelBtn}>
            Cancel
          </PrimaryButton>
          <PrimaryButton
            onPress={canSubmit ? handleAdd : undefined}
            style={{ ...styles.addBtn, ...(canSubmit ? null : styles.addDisabled) }}
          >
            Add ₹{num || 0}
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.44,
    color: colors.ink,
    marginTop: 2,
    fontFamily: fonts.sans,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  currency: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.n500,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.6,
    color: colors.ink,
    padding: 0,
  },
  titleInput: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 18,
  },
  kicker: {
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  payerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingRight: 12,
    paddingLeft: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  payerActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  payerInactive: {
    backgroundColor: colors.white,
    borderColor: colors.n200,
  },
  payerText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  payerTextActive: {
    color: colors.white,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  perHead: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
  },
  splitCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 22,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  splitRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  splitName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  checkboxOff: {
    backgroundColor: colors.white,
    borderColor: colors.n300,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 0.4,
  },
  addBtn: {
    flex: 1,
  },
  addDisabled: {
    opacity: 0.4,
  },
});
