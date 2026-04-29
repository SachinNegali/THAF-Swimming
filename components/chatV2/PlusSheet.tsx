import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconBookmark, IconCheck, IconFlash, IconPin } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { BottomSheet } from '../core/BottomSheetWrapper';
import { Kicker } from '../core/Kicker';

interface PlusSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickExpense: () => void;
}

interface ActionSpec {
  id: 'photo' | 'location' | 'expense' | 'poll';
  label: string;
  hint: string;
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  primary?: boolean;
}

const ACTIONS: ActionSpec[] = [
  { id: 'photo', label: 'Photo', hint: 'Camera or library', Icon: IconBookmark },
  { id: 'location', label: 'Share location', hint: 'Drop a pin', Icon: IconPin },
  { id: 'expense', label: 'Expense', hint: 'Split with pack', Icon: IconFlash, primary: true },
  { id: 'poll', label: 'Quick poll', hint: 'Stop here or push on?', Icon: IconCheck },
];

export const PlusSheet = React.memo(({ visible, onClose, onPickExpense }: PlusSheetProps) => (
  <BottomSheet visible={visible} onClose={onClose} snapPoints={['42%']}>
    <View style={styles.container}>
      <Kicker style={styles.kicker}>Share to pack</Kicker>
      <View style={styles.grid}>
        {ACTIONS.map((a) => {
          const isPrimary = !!a.primary;
          const handlePress = () => {
            if (a.id === 'expense') onPickExpense();
            else onClose();
          };
          return (
            <Pressable
              key={a.id}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.action,
                isPrimary ? styles.actionPrimary : styles.actionDefault,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <a.Icon size={20} color={isPrimary ? colors.white : colors.ink} />
              <View style={styles.body}>
                <Text style={[styles.label, isPrimary && styles.labelPrimary]}>{a.label}</Text>
                <Text style={[styles.hint, isPrimary && styles.hintPrimary]}>{a.hint}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  </BottomSheet>
));

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 26,
  },
  kicker: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  action: {
    width: '48.6%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  actionPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  actionDefault: {
    backgroundColor: colors.white,
    borderColor: colors.n200,
  },
  body: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.14,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  labelPrimary: {
    color: colors.white,
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.n500,
    marginTop: 4,
  },
  hintPrimary: {
    color: 'rgba(255,255,255,0.6)',
  },
});
