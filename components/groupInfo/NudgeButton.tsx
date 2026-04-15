import { useNudge, type ExpenseApiError } from '@/hooks/api/useExpenses';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getNudgeAllowedAt,
  getNudgeSnapshot,
  setNudgeCooldown,
  setNudgeCooldownFromRetryAfter,
  subscribeNudgeStore,
} from '@/stores/nudgeStore';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  groupId: string;
  toUserId: string;
  toName?: string;
}

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
  return `${totalMinutes}m`;
}

export default function NudgeButton({ groupId, toUserId, toName }: Props) {
  const tintColor = useThemeColor({}, 'tint');

  // Subscribe to cooldown changes
  useSyncExternalStore(subscribeNudgeStore, getNudgeSnapshot);
  const allowedAt = getNudgeAllowedAt(groupId, toUserId);

  // Re-render every minute so countdown updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!allowedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [allowedAt]);

  const nudge = useNudge(groupId);

  const handlePress = () => {
    nudge.mutate(
      { toUserId },
      {
        onSuccess: () => {
          // Default cooldown of 24h on success
          setNudgeCooldown(groupId, toUserId, Date.now() + 24 * 60 * 60 * 1000);
        },
        onError: (err: any) => {
          const e = err as ExpenseApiError;
          if (e?.code === 'NUDGE_RATE_LIMITED' && e.retryAfter) {
            setNudgeCooldownFromRetryAfter(groupId, toUserId, e.retryAfter);
          }
        },
      },
    );
  };

  const disabled = !!allowedAt || nudge.isPending;
  const remainingMs = allowedAt ? allowedAt - Date.now() : 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? `${tintColor}20` : `${tintColor}10`,
          borderColor: `${tintColor}40`,
        },
      ]}
    >
      {nudge.isPending ? (
        <ActivityIndicator size="small" color={tintColor} />
      ) : (
        <Text style={{ color: tintColor, fontSize: 12, fontWeight: '700' }}>
          {allowedAt
            ? `Remind in ${formatRemaining(remainingMs)}`
            : toName
              ? `Remind ${toName}`
              : 'Remind'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
});
