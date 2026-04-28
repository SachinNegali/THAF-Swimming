import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { Kicker } from '../core/Kicker';

interface SectionProps {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

export const Section = React.memo(({ title, action, onAction, children }: SectionProps) => (
  <View>
    <View style={styles.header}>
      <Kicker>{title}</Kicker>
      {action && (
        <Pressable onPress={onAction} style={styles.actionBtn}>
          <Text style={styles.actionText}>{action}</Text>
          <IconArrowRight size={12} color={colors.ink} />
        </Pressable>
      )}
    </View>
    {children}
  </View>
));

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
});
