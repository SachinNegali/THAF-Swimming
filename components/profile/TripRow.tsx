import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconArrowRight } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ProfileTrip, ProfileTripRole } from '../../types';

interface TripRowProps {
  trip: ProfileTrip;
  onPress?: () => void;
}

const ROLE_STYLES: Record<ProfileTripRole, { bg: string; fg: string; border?: string; dashed?: boolean }> = {
  Joined: { bg: colors.n100, fg: colors.n700 },
  Organizing: { bg: colors.ink, fg: colors.white },
  Organized: { bg: colors.ink, fg: colors.white },
  Draft: { bg: 'transparent', fg: colors.n500, border: colors.n300, dashed: true },
};

export const TripRow = React.memo(({ trip, onPress }: TripRowProps) => {
  const rs = ROLE_STYLES[trip.role];
  const [month, day] = trip.start.split(' ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateDay}>{day || '—'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.tagsRow}>
          <View
            style={[
              styles.tag,
              { backgroundColor: rs.bg, borderColor: rs.border ?? rs.bg },
              rs.dashed && styles.tagDashed,
            ]}
          >
            <Text style={[styles.tagText, { color: rs.fg }]}>{trip.role}</Text>
          </View>
          <View style={[styles.tag, styles.tagOutline]}>
            <Text style={[styles.tagText, styles.tagTextMuted]}>{trip.tag}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {trip.title}
        </Text>
        <Text style={styles.meta}>
          {trip.from} <Text style={styles.metaArrow}>→</Text> {trip.to} · {trip.dist} · {trip.days}d
        </Text>
      </View>

      <IconArrowRight size={14} color={colors.n500} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowPressed: {
    backgroundColor: colors.paper2,
  },
  dateBlock: {
    width: 54,
    paddingVertical: 8,
    backgroundColor: colors.paper2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.n500,
  },
  dateDay: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.16,
    color: colors.ink,
    marginTop: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagOutline: {
    borderColor: colors.n200,
    backgroundColor: 'transparent',
  },
  tagDashed: {
    borderStyle: 'dashed',
  },
  tagText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  tagTextMuted: {
    color: colors.n600,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.14,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.n500,
    marginTop: 3,
  },
  metaArrow: {
    opacity: 0.5,
  },
});
