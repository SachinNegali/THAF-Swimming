import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { FilterState } from '../../types';
import { BottomSheet } from '../core/BottomSheetWrapper';
import { Kicker } from '../core/Kicker';
import { Pill } from '../core/Pill';
import { PrimaryButton } from '../core/form/PrimaryButton';
import { IconSwap } from '../../icons/Icons';

interface FilterSheetProps {
  visible: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

const RESET_FILTERS: FilterState = {
  from: 'Anywhere', to: 'Anywhere', dates: 'Anytime',
  distance: 'Any', level: 'Any', days: '1-7',
};

const DATE_OPTIONS = ['Anytime', 'This week', 'This weekend', 'Next month', 'Custom'];
const DAYS_OPTIONS = ['1', '1-2', '1-7', '3-7', '7+'];
const LEVEL_OPTIONS = ['Any', 'Easy', 'Intermediate', 'Advanced', 'Technical'];

export const FilterSheet = React.memo(({ visible, filters, onApply, onClose }: FilterSheetProps) => {
  const [local, setLocal] = useState<FilterState>(filters);

  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    setLocal(prev => ({ ...prev, [k]: v }));

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={['86%']} scrollable>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Kicker>Refine search</Kicker>
            <Text style={styles.title}>Filters</Text>
          </View>
          <Pressable onPress={() => setLocal(RESET_FILTERS)}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Kicker style={styles.sectionLabel}>Route</Kicker>
          <View style={styles.routeCard}>
            <View style={[styles.routeRow, styles.routeRowBorder]}>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.routeValue}>{local.from}</Text>
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.routeValue}>{local.to}</Text>
            </View>
            <Pressable
              style={styles.swapBtn}
              onPress={() => setLocal(p => ({ ...p, from: p.to, to: p.from }))}
            >
              <IconSwap size={14} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Kicker style={styles.sectionLabel}>Departure window</Kicker>
          <View style={styles.pillRow}>
            {DATE_OPTIONS.map(t => (
              <Pill key={t} active={local.dates === t} onPress={() => set('dates', t)}>{t}</Pill>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Kicker>Duration</Kicker>
            <Text style={styles.durationValue}>{local.days} days</Text>
          </View>
          <View style={styles.pillRow}>
            {DAYS_OPTIONS.map(t => (
              <Pill key={t} active={local.days === t} onPress={() => set('days', t)}>{`${t} days`}</Pill>
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Kicker style={styles.sectionLabel}>Difficulty</Kicker>
          <View style={styles.pillRow}>
            {LEVEL_OPTIONS.map(t => (
              <Pill key={t} active={local.level === t} onPress={() => set('level', t)}>{t}</Pill>
            ))}
          </View>
        </View>

        {/* Apply */}
        <View style={styles.actions}>
          <PrimaryButton dark={false} onPress={onClose} style={styles.cancelBtn}>Cancel</PrimaryButton>
          <PrimaryButton onPress={() => onApply(local)} style={styles.applyBtn}>Show results</PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 26,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.44,
    marginTop: 2,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  resetText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.n600,
    textTransform: 'uppercase',
    paddingVertical: 4,
  },
  section: {
    marginTop: 22,
  },
  sectionLabel: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  durationValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
  },
  routeCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  routeRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  routeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  routeLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    color: colors.n500,
    width: 32,
  },
  routeValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  swapBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.n200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    marginTop: 26,
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 0.4,
  },
  applyBtn: {
    flex: 1,
  },
});
