import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconPlus, IconRoute } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface EmptyTripsProps {
  onBrowse?: () => void;
  onPlan?: () => void;
}

export const EmptyTrips = React.memo(({ onBrowse, onPlan }: EmptyTripsProps) => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <IconRoute size={20} color={colors.ink} />
    </View>
    <Text style={styles.title}>No trips yet</Text>
    <Text style={styles.subtitle}>Browse open rides, or plan your own</Text>

    <View style={styles.actions}>
      <Pressable onPress={onBrowse} style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}>
        <Text style={styles.outlineText}>Browse rides</Text>
      </Pressable>
      <Pressable onPress={onPlan} style={({ pressed }) => [styles.filledBtn, pressed && styles.filledBtnPressed]}>
        <IconPlus size={12} color={colors.white} />
        <Text style={styles.filledText}>Plan a trip</Text>
      </Pressable>
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.n300,
    borderRadius: 14,
    backgroundColor: colors.paper2,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.n500,
    marginTop: 4,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n300,
    backgroundColor: colors.white,
  },
  outlineBtnPressed: {
    backgroundColor: colors.n100,
  },
  outlineText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  filledBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filledBtnPressed: {
    opacity: 0.85,
  },
  filledText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },
});
