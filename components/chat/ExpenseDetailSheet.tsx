import { BottomSheet } from '@/components/ui/BottomSheet';
import { Colors, SPACING } from '@/constants/theme';
import {
  useActiveCycle,
  useAddExpenseComment,
  useDeleteExpense,
  useExpense,
  useExpenseComments,
} from '@/hooks/api/useExpenses';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatCurrency } from '@/lib/currency';
import { selectUser } from '@/store/selectors';
import { Image } from 'expo-image';
import React, { useState } from 'react';
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

const EDIT_WINDOW_MS = 10 * 60 * 1000;

interface Props {
  visible: boolean;
  expenseId: string | null;
  groupId: string;
  onClose: () => void;
  onEdit: (expenseId: string) => void;
}

export default function ExpenseDetailSheet({
  visible,
  expenseId,
  groupId,
  onClose,
  onEdit,
}: Props) {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surfaceLight');
  const dangerColor = Colors.light.danger;

  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const { data: expense, isLoading } = useExpense(
    groupId,
    expenseId ?? '',
    !!expenseId && visible,
  );
  const { data: cycle } = useActiveCycle(groupId, visible);
  const { data: comments } = useExpenseComments(
    groupId,
    expenseId ?? '',
    !!expenseId && visible,
  );
  const addComment = useAddExpenseComment(groupId, expenseId ?? '');
  const deleteExpense = useDeleteExpense(groupId);
  const [commentText, setCommentText] = useState('');

  const isCreator = expense?.createdBy === currentUserId;
  const withinEditWindow = expense
    ? new Date(expense.createdAt).getTime() + EDIT_WINDOW_MS > Date.now()
    : false;

  const splitRows = expense?.splits ?? [];

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={['85%']} scrollable>
      <ScrollView contentContainerStyle={styles.padded}>
        {isLoading || !expense ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: textColor }]}>
              {formatCurrency(expense.amount, cycle?.currency)}
            </Text>
            <Text style={[styles.subtitle, { color: mutedColor }]}>
              {expense.category} ·{' '}
              Paid by{' '}
              {typeof expense.paidBy === 'string'
                ? 'Member'
                : expense.paidBy.name ??
                  `${expense.paidBy.fName ?? ''} ${expense.paidBy.lName ?? ''}`.trim()}
            </Text>
            {expense.note ? (
              <Text style={[styles.note, { color: textColor }]}>
                {expense.note}
              </Text>
            ) : null}

            {expense.imageUrl ? (
              <Image
                source={{ uri: expense.imageUrl }}
                style={styles.receipt}
                contentFit="cover"
              />
            ) : null}

            <Text style={[styles.sectionLabel, { color: mutedColor }]}>
              Split ({expense.splitType})
            </Text>
            <View style={[styles.splitBox, { borderColor }]}>
              {splitRows.map((s, i) => {
                const uid = typeof s.user === 'string' ? s.user : s.user._id;
                const name =
                  typeof s.user === 'string'
                    ? 'Member'
                    : s.user.name ??
                      `${s.user.fName ?? ''} ${s.user.lName ?? ''}`.trim();
                const statusLabel = s.settled
                  ? 'settled'
                  : s.settlementStatus === 'initiated'
                    ? 'initiated'
                    : 'pending';
                const statusColor = s.settled
                  ? Colors.light.success
                  : s.settlementStatus === 'initiated'
                    ? Colors.light.warning
                    : mutedColor;
                return (
                  <View
                    key={`${uid}-${i}`}
                    style={[styles.splitRow, { borderColor }]}
                  >
                    <Text style={{ color: textColor, fontWeight: '500' }}>
                      {uid === currentUserId ? 'You' : name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          color: statusColor,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          fontWeight: '700',
                        }}
                      >
                        {statusLabel}
                      </Text>
                      <Text style={{ color: textColor, fontWeight: '700' }}>
                        {formatCurrency(s.amount, cycle?.currency)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {isCreator ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: withinEditWindow
                        ? tintColor
                        : `${tintColor}40`,
                    },
                  ]}
                  disabled={!withinEditWindow}
                  onPress={() => onEdit(expense._id)}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: withinEditWindow
                        ? dangerColor
                        : `${dangerColor}40`,
                    },
                  ]}
                  disabled={!withinEditWindow || deleteExpense.isPending}
                  onPress={() =>
                    deleteExpense.mutate(expense._id, {
                      onSuccess: () => onClose(),
                    })
                  }
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={[styles.sectionLabel, { color: mutedColor }]}>
              Comments
            </Text>
            <View style={[styles.splitBox, { borderColor }]}>
              {(comments ?? []).length === 0 ? (
                <Text style={{ color: mutedColor, fontSize: 13 }}>
                  No comments yet.
                </Text>
              ) : (
                (comments ?? []).map((c) => (
                  <View key={c._id} style={{ marginBottom: SPACING.sm }}>
                    <Text style={{ color: textColor, fontWeight: '600' }}>
                      {c.user.name ??
                        `${c.user.fName ?? ''} ${c.user.lName ?? ''}`.trim()}
                    </Text>
                    <Text style={{ color: textColor }}>{c.text}</Text>
                    <Text style={{ color: mutedColor, fontSize: 11 }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {isCreator ? (
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment"
                  placeholderTextColor={mutedColor}
                  style={[
                    styles.commentInput,
                    { borderColor, color: textColor, backgroundColor: surfaceColor },
                  ]}
                />
                <TouchableOpacity
                  disabled={!commentText.trim() || addComment.isPending}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: commentText.trim()
                        ? tintColor
                        : `${tintColor}60`,
                    },
                  ]}
                  onPress={() =>
                    addComment.mutate(commentText.trim(), {
                      onSuccess: () => setCommentText(''),
                    })
                  }
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ color: mutedColor, fontSize: 13 }}>
                Only the expense creator can comment.
              </Text>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
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
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  note: {
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  receipt: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  splitBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: 14,
    minHeight: 40,
  },
  sendButton: {
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
