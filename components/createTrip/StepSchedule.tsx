import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight, IconCalendar, IconInfinity } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { CreateTripDraft, QuickDateOption } from '../../types';
import { Kicker } from '../core/Kicker';
import { CalendarSheet } from './CalendarSheet';
import { QuickDateButton } from './QuickDateButton';
import { SizeButton } from './SizeButton';
import { Stepper } from './Stepper';

interface StepScheduleProps {
  data: CreateTripDraft;
  set: <K extends keyof CreateTripDraft>(key: K, value: CreateTripDraft[K]) => void;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const SIZE_OPTIONS = [2, 4, 6, 8, 12];

export const StepSchedule = React.memo(({ data, set }: StepScheduleProps) => {
  const [calOpen, setCalOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  const quick: QuickDateOption[] = useMemo(() => {
    const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
    const sat = addDays(today, daysUntilSat);
    const nextSat = addDays(sat, 7);
    return [
      { label: 'Tomorrow', date: addDays(today, 1) },
      { label: 'This weekend', date: sat, hint: `${MONTHS_SHORT[sat.getMonth()]} ${sat.getDate()}` },
      { label: 'Next weekend', date: nextSat, hint: `${MONTHS_SHORT[nextSat.getMonth()]} ${nextSat.getDate()}` },
    ];
  }, [today]);

  const isoSel = data.startDate;
  const isCustomDate = !!isoSel && !quick.find((q) => toIso(q.date) === isoSel);

  return (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          <Text style={styles.titleItalic}>When</Text> are you riding?
        </Text>
        <Text style={styles.subtitle}>Pick a start date and trip length.</Text>
      </View>

      <Kicker style={styles.kicker}>Departure</Kicker>
      <View style={styles.quickGrid}>
        {quick.map((q) => {
          const iso = toIso(q.date);
          return (
            <View key={q.label} style={styles.quickCol}>
              <QuickDateButton
                label={q.label}
                hint={q.hint}
                active={isoSel === iso}
                onPress={() => set('startDate', iso)}
              />
            </View>
          );
        })}

        <Pressable
          onPress={() => setCalOpen(true)}
          style={({ pressed }) => [
            styles.customBtn,
            isCustomDate && styles.customBtnActive,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.customLeft}>
            <IconCalendar size={18} color={isCustomDate ? colors.white : colors.ink} />
            <Text style={[styles.customText, isCustomDate && styles.customTextActive]}>
              {isCustomDate && isoSel ? formatDate(isoSel) : 'Pick a custom date'}
            </Text>
          </View>
          <IconArrowRight size={16} color={isCustomDate ? colors.white : colors.ink} />
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Kicker>Duration</Kicker>
        <Text style={styles.sectionMeta}>
          {data.days} {data.days === 1 ? 'day' : 'days'}
        </Text>
      </View>
      <Stepper
        value={data.days}
        min={1}
        max={30}
        onChange={(v) => set('days', v)}
        caption={data.days === 1 ? 'Day ride' : `${data.days}-day trip`}
      />

      <View style={styles.sectionHeader}>
        <Kicker>Group size</Kicker>
        <Text style={styles.sectionMeta}>
          {data.spots === null ? 'OPEN · UNLIMITED' : `UP TO ${data.spots}`}
        </Text>
      </View>
      <View style={styles.sizeRow}>
        <SizeButton
          label={<IconInfinity size={16} color={data.spots === null ? colors.white : colors.ink} />}
          active={data.spots === null}
          onPress={() => set('spots', null)}
        />
        {SIZE_OPTIONS.map((n) => (
          <SizeButton
            key={n}
            label={String(n)}
            active={data.spots === n}
            onPress={() => set('spots', n)}
          />
        ))}
      </View>

      <CalendarSheet
        visible={calOpen}
        value={isoSel}
        onPick={(iso) => {
          set('startDate', iso);
          setCalOpen(false);
        }}
        onClose={() => setCalOpen(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.84,
    lineHeight: 30.8,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 32,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: colors.n600,
    marginTop: 6,
    fontFamily: fonts.sans,
  },
  kicker: {
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCol: {
    width: '48.6%',
  },
  customBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  customLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    letterSpacing: -0.14,
  },
  customTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionMeta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.n500,
    letterSpacing: 0.44,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 6,
  },
});
