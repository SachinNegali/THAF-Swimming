import { Colors, SPACING } from '@/constants/theme';
import {
  useCancelSettlement,
  useConfirmSettlement,
  useCreateSettlement,
  useSettlements,
} from '@/hooks/api/useExpenses';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatCurrency } from '@/lib/currency';
import { selectUser } from '@/store/selectors';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  currency?: string;
}

export default function SettleModal({
  visible,
  onClose,
  groupId,
  fromUserId,
  fromName,
  toUserId,
  toName,
  amount,
  currency,
}: Props) {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const dangerColor = Colors.light.danger;

  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const { data: settlements } = useSettlements(groupId, visible);
  const createSettlement = useCreateSettlement(groupId);
  const confirmSettlement = useConfirmSettlement(groupId);
  const cancelSettlement = useCancelSettlement(groupId);

  // Find any outstanding initiated settlement for this debt pair
  const pending = useMemo(() => {
    if (!settlements) return null;
    return (
      settlements.find((s) => {
        const sFrom = typeof s.fromUser === 'string' ? s.fromUser : s.fromUser._id;
        const sTo = typeof s.toUser === 'string' ? s.toUser : s.toUser._id;
        return (
          s.status === 'initiated' &&
          sFrom === fromUserId &&
          sTo === toUserId
        );
      }) ?? null
    );
  }, [settlements, fromUserId, toUserId]);

  const isInitiator = pending?.initiatedBy === currentUserId;
  const isDebtor = currentUserId === fromUserId;
  const isCreditor = currentUserId === toUserId;
  const canConfirm = pending && !isInitiator && (isDebtor || isCreditor);

  const handleInitiate = () => {
    createSettlement.mutate(
      { fromUserId, toUserId, amount },
      { onError: () => {} },
    );
  };

  const handleConfirm = () => {
    if (!pending) return;
    confirmSettlement.mutate(pending._id, { onSuccess: () => onClose() });
  };

  const handleCancel = () => {
    if (!pending) return;
    cancelSettlement.mutate(pending._id, { onSuccess: () => onClose() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Settle {formatCurrency(amount, currency)}
          </Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            between {isDebtor ? 'You' : fromName} and{' '}
            {isCreditor ? 'You' : toName}
          </Text>

          {pending ? (
            isInitiator ? (
              <>
                <Text
                  style={{
                    color: mutedColor,
                    marginTop: SPACING.md,
                    textAlign: 'center',
                  }}
                >
                  Waiting for{' '}
                  {isDebtor ? toName : fromName} to confirm…
                </Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#eee' }]}
                    onPress={onClose}
                  >
                    <Text style={{ color: textColor, fontWeight: '700' }}>
                      Close
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: dangerColor }]}
                    onPress={handleCancel}
                    disabled={cancelSettlement.isPending}
                  >
                    {cancelSettlement.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        Cancel
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : canConfirm ? (
              <>
                <Text
                  style={{
                    color: mutedColor,
                    marginTop: SPACING.md,
                    textAlign: 'center',
                  }}
                >
                  {isCreditor ? fromName : toName} marked this as settled.
                  Confirm to finalize.
                </Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#eee' }]}
                    onPress={onClose}
                  >
                    <Text style={{ color: textColor, fontWeight: '700' }}>
                      Reject
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: tintColor }]}
                    onPress={handleConfirm}
                    disabled={confirmSettlement.isPending}
                  >
                    {confirmSettlement.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        Confirm
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null
          ) : (
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#eee' }]}
                onPress={onClose}
              >
                <Text style={{ color: textColor, fontWeight: '700' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: tintColor }]}
                onPress={handleInitiate}
                disabled={createSettlement.isPending}
              >
                {createSettlement.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Confirm settlement
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {createSettlement.isError ? (
            <Text
              style={{
                color: dangerColor,
                marginTop: SPACING.sm,
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              {(createSettlement.error as any)?.message ?? 'Could not settle.'}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
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
