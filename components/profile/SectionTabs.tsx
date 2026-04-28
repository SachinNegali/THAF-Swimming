import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

export interface SectionTab<T extends string> {
  id: T;
  label: string;
}

interface SectionTabsProps<T extends string> {
  tabs: SectionTab<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function SectionTabs<T extends string>({ tabs, active, onChange }: SectionTabsProps<T>) {
  return (
    <View style={styles.row}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={styles.tab}>
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {t.label}
            </Text>
            {isActive && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
    marginBottom: 14,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 16,
    position: 'relative',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.06,
    fontFamily: fonts.sans,
  },
  labelActive: {
    color: colors.ink,
  },
  labelInactive: {
    color: colors.n500,
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.ink,
  },
});
