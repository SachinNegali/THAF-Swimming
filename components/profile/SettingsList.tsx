import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ProfileSettingsRow } from '../../types';

interface SettingsListProps {
  rows: ProfileSettingsRow[];
  onRowPress?: (row: ProfileSettingsRow) => void;
}

export const SettingsList = React.memo(({ rows, onRowPress }: SettingsListProps) => (
  <View style={styles.card}>
    {rows.map((row, i) => {
      const isLast = i === rows.length - 1;
      return (
        <Pressable
          key={row.label}
          onPress={() => onRowPress?.(row)}
          style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
        >
          <View style={styles.body}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.detail}>{row.detail}</Text>
          </View>
          <IconArrowRight size={14} color={colors.n500} />
        </Pressable>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  pressed: {
    backgroundColor: colors.paper2,
  },
  body: {
    flex: 1,
    marginRight: 12,
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
