import { SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatCurrency } from '@/lib/currency';
import type { SpendMessage } from '@/types/chat';
import { router } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const EDIT_WINDOW_MS = 10 * 60 * 1000;

interface Props {
  item: SpendMessage;
  groupId: string;
  onEdit?: (expenseId: string) => void;
  onDelete?: (expenseId: string) => void;
  onOpenDetail?: (expenseId: string) => void;
  isCreator: boolean;
}

function useEditCountdown(createdAtIso: string, enabled: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, [enabled, createdAtIso]);
  const remaining = createdAtIso
    ? new Date(createdAtIso).getTime() + EDIT_WINDOW_MS - Date.now()
    : 0;
  return Math.max(0, remaining);
}

const SpendBubble = memo(
  ({ item, groupId, onEdit, onDelete, onOpenDetail, isCreator }: Props) => {
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'textMuted');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    const [menuOpen, setMenuOpen] = useState(false);

    const remainingMs = useEditCountdown(item.createdAtIso, isCreator);
    const canEdit = isCreator && remainingMs > 0;

    const handleTap = () => {
      if (onOpenDetail) onOpenDetail(item.expenseId);
      else {
        router.push({
          pathname: '/groupInfo/[id]',
          params: { id: groupId, expenseId: item.expenseId },
        });
      }
    };

    return (
      <Pressable
        onPress={handleTap}
        style={[
          styles.container,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: `${tintColor}14` }]}>
          <Text style={{ fontSize: 18 }}>🧾</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {item.category} ·{' '}
            <Text style={{ color: tintColor, fontWeight: '800' }}>
              {formatCurrency(item.amount, item.currency)}
            </Text>
          </Text>
          <Text style={[styles.meta, { color: mutedColor }]} numberOfLines={1}>
            Paid by {item.paidBy.name} · split {item.splitCount}{' '}
            {item.splitCount === 1 ? 'way' : 'ways'}
          </Text>
          <Text style={[styles.cta, { color: tintColor }]}>View details ›</Text>
        </View>

        {canEdit ? (
          <View>
            <TouchableOpacity
              hitSlop={10}
              onPress={(e) => {
                e.stopPropagation?.();
                setMenuOpen((v) => !v);
              }}
              style={styles.kebab}
            >
              <Text style={{ color: mutedColor, fontSize: 18 }}>⋯</Text>
            </TouchableOpacity>

            {menuOpen ? (
              <View style={[styles.menu, { borderColor, backgroundColor: '#fff' }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    onEdit?.(item.expenseId);
                  }}
                >
                  <Text style={{ color: textColor }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    onDelete?.(item.expenseId);
                  }}
                >
                  <Text style={{ color: '#ef4444' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    );
  },
);

SpendBubble.displayName = 'SpendBubble';
export default SpendBubble;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    marginBottom: 4,
  },
  cta: {
    fontSize: 12,
    fontWeight: '600',
  },
  kebab: {
    padding: SPACING.xs,
  },
  menu: {
    position: 'absolute',
    top: 28,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
    zIndex: 20,
    elevation: 6,
  },
  menuItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
