import { SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  /** Optional right-side balance info */
  balanceLabel?: string;
  balanceAmount?: string;
}

const ChatHeader = memo(({ title, subtitle, balanceLabel, balanceAmount }: ChatHeaderProps) => {
  const headerBg = useThemeColor(
    { light: 'rgba(255,255,255,0.8)', dark: 'rgba(16, 22, 34, 0.8)' },
    'background',
  );
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.header, { backgroundColor: headerBg, borderColor }]}>
      <View style={styles.left}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 20, color: textColor }}>‹</Text>
        </TouchableOpacity>
        <Pressable style={styles.info} onPress={() => router.push('/groupInfo/[id]')}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>{subtitle}</Text>
        </Pressable>
      </View>
      {balanceLabel && balanceAmount && (
        <View style={styles.right}>
          <Text style={[styles.balanceLabel, { color: mutedColor }]}>{balanceLabel}</Text>
          <Text style={[styles.balanceAmount, { color: primaryColor }]}>{balanceAmount}</Text>
        </View>
      )}
    </View>
  );
});

export default ChatHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  info: {
    marginLeft: SPACING.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
