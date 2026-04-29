import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight, IconCalendar, IconClock, IconInfinity } from '../../icons/Icons';
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

const TIME_PRESETS: { value: string; label: string }[] = [
  { value: '05:00', label: '5:00 AM' },
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '18:00', label: '6:00 PM' },
];

const formatTime = (hhmm: string) => {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const adjustTime = (hhmm: string | null, dh: number, dm: number) => {
  const base = hhmm ?? '08:00';
  const [hStr, mStr] = base.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  m = m + dm;
  while (m >= 60) {
    m -= 60;
    h += 1;
  }
  while (m < 0) {
    m += 60;
    h -= 1;
  }
  h = clamp(h + dh, 0, 23);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

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
        <Kicker>Departure time</Kicker>
        <Text style={styles.sectionMeta}>
          {data.startTime ? formatTime(data.startTime).toUpperCase() : 'NOT SET'}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeRow}
      >
        {TIME_PRESETS.map((t) => {
          const active = data.startTime === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => set('startTime', t.value)}
              style={({ pressed }) => [
                styles.timeChip,
                active && styles.timeChipActive,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.timeAdjustRow}>
        <View style={styles.timeAdjustLeft}>
          <IconClock size={16} color={colors.ink} />
          <Text style={styles.timeAdjustLabel}>
            {data.startTime ? formatTime(data.startTime) : 'Pick a time'}
          </Text>
        </View>
        <View style={styles.timeAdjustControls}>
          <Pressable
            onPress={() => set('startTime', adjustTime(data.startTime, -1, 0))}
            style={({ pressed }) => [styles.timeAdjustBtn, pressed && styles.timeAdjustBtnPressed]}
          >
            <Text style={styles.timeAdjustBtnText}>−1h</Text>
          </Pressable>
          <Pressable
            onPress={() => set('startTime', adjustTime(data.startTime, 0, -15))}
            style={({ pressed }) => [styles.timeAdjustBtn, pressed && styles.timeAdjustBtnPressed]}
          >
            <Text style={styles.timeAdjustBtnText}>−15m</Text>
          </Pressable>
          <Pressable
            onPress={() => set('startTime', adjustTime(data.startTime, 0, 15))}
            style={({ pressed }) => [styles.timeAdjustBtn, pressed && styles.timeAdjustBtnPressed]}
          >
            <Text style={styles.timeAdjustBtnText}>+15m</Text>
          </Pressable>
          <Pressable
            onPress={() => set('startTime', adjustTime(data.startTime, 1, 0))}
            style={({ pressed }) => [styles.timeAdjustBtn, pressed && styles.timeAdjustBtnPressed]}
          >
            <Text style={styles.timeAdjustBtnText}>+1h</Text>
          </Pressable>
        </View>
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
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 22,
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
  },
  timeChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    letterSpacing: -0.13,
  },
  timeChipTextActive: {
    color: colors.white,
  },
  timeAdjustRow: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeAdjustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAdjustLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    letterSpacing: -0.14,
  },
  timeAdjustControls: {
    flexDirection: 'row',
    gap: 6,
  },
  timeAdjustBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.n100,
  },
  timeAdjustBtnPressed: {
    backgroundColor: colors.n200,
  },
  timeAdjustBtnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
});
