import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconCamera, IconCloseUp, IconFuel, IconPulse, IconStop, IconTea } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { QuickMessage, QuickMsgIcon } from '../../types';
import { Kicker } from '../core/Kicker';

interface QuickMessagesProps {
  messages: QuickMessage[];
  onSend?: (m: QuickMessage) => void;
}

const ICON_MAP: Record<QuickMsgIcon, (p: { size?: number; color?: string }) => React.ReactElement> = {
  pulse: IconPulse,
  fuel: IconFuel,
  cam: IconCamera,
  stop: IconStop,
  tea: IconTea,
  close: IconCloseUp,
};

export const QuickMessages = React.memo(({ messages, onSend }: QuickMessagesProps) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <Kicker>Quick send · to pack</Kicker>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {messages.map((m) => {
        const Icon = ICON_MAP[m.icon];
        return (
          <Pressable
            key={m.id}
            onPress={() => onSend?.(m)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Icon size={14} color={colors.ink} />
            <Text style={styles.chipText}>{m.label}</Text>
          </Pressable>
        );
      })}
      <Pressable style={({ pressed }) => [styles.customChip, pressed && styles.chipPressed]}>
        <Text style={styles.customText}>+ Custom</Text>
      </Pressable>
    </ScrollView>
  </View>
));

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  header: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  row: {
    gap: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
  },
  chipPressed: {
    backgroundColor: colors.n100,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.07,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  customChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.n300,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  customText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.n600,
    fontFamily: fonts.sans,
  },
});

