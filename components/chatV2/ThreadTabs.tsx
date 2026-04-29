import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { ChatTabId } from '../../types';

export interface ThreadTabSpec {
  id: ChatTabId;
  label: string;
}

interface ThreadTabsProps {
  tabs: ThreadTabSpec[];
  active: ChatTabId;
  onChange: (id: ChatTabId) => void;
}

export const ThreadTabs = React.memo(({ tabs, active, onChange }: ThreadTabsProps) => (
  <View style={styles.row}>
    {tabs.map((t) => {
      const isActive = active === t.id;
      return (
        <Pressable
          key={t.id}
          onPress={() => onChange(t.id)}
          style={[styles.tab, isActive && styles.tabActive]}
        >
          <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
            {t.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 10,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: -1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.ink,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  labelActive: {
    color: colors.ink,
  },
  labelInactive: {
    color: colors.n500,
  },
});
