import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconBack } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { BottomSheet } from '../core/BottomSheetWrapper';

interface CalendarSheetProps {
  visible: boolean;
  value: string | null;
  minDate?: Date;
  onPick: (iso: string) => void;
  onClose: () => void;
}

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CalendarSheet = React.memo(({ visible, value, minDate, onPick, onClose }: CalendarSheetProps) => {
  const today = useMemo(() => minDate || new Date(), [minDate]);
  const todayIso = toIso(today);

  const initialMonth = useMemo(() => {
    const d = value ? new Date(value) : today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [value, today]);

  const [month, setMonth] = useState(initialMonth);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startOffset = first.getDay();
    const days = last.getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(new Date(month.getFullYear(), month.getMonth(), d));
    return out;
  }, [month]);

  const goPrev = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goNext = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={['62%']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={goPrev} style={styles.navBtn}>
            <IconBack size={16} color={colors.ink} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTHS_FULL[month.getMonth()]} {month.getFullYear()}
          </Text>
          <Pressable onPress={goNext} style={[styles.navBtn, styles.navBtnFlip]}>
            <IconBack size={16} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {DAYS.map((d, i) => (
            <Text key={i} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const iso = toIso(d);
            const active = iso === value;
            const isToday = iso === todayIso;
            const past = iso < todayIso;
            return (
              <Pressable
                key={i}
                onPress={() => !past && onPick(iso)}
                disabled={past}
                style={[
                  styles.cell,
                  styles.dayCell,
                  active && styles.dayActive,
                  isToday && !active && styles.dayToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    past && styles.dayPast,
                    active && styles.dayTextActive,
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnFlip: {
    transform: [{ scaleX: -1 }],
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    letterSpacing: -0.16,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayActive: {
    backgroundColor: colors.ink,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.n300,
  },
  dayText: {
    fontSize: 14,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  dayTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  dayTextToday: {
    fontWeight: '600',
  },
  dayPast: {
    color: colors.n300,
  },
});
