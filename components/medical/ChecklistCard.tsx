import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconCheck } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { MedicalChecklistItem } from '../../types';
import { Kicker } from '../core/Kicker';

interface ChecklistCardProps {
  items: MedicalChecklistItem[];
}

export const ChecklistCard = React.memo(({ items }: ChecklistCardProps) => (
  <View style={styles.card}>
    {items.map((row, i) => {
      const isLast = i === items.length - 1;
      return (
        <View key={row.label} style={[styles.row, !isLast && styles.divider]}>
          <View style={[styles.tick, row.done ? styles.tickDone : styles.tickEmpty]}>
            {row.done && <IconCheck size={12} color={colors.white} />}
          </View>
          <View style={styles.body}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.detail}>{row.detail}</Text>
          </View>
          <Kicker>—</Kicker>
        </View>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.n300,
  },
  tickDone: {
    backgroundColor: colors.ink,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  detail: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.n500,
    marginTop: 2,
  },
});
