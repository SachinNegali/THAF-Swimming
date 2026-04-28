import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconShield } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { CreateTripDraft } from '../../types';
import { Metric } from '../core/Metric';
import { RouteSketch } from './RouteSketch';
import { Toggle } from './Toggle';

interface StepReviewProps {
  data: CreateTripDraft;
  set: <K extends keyof CreateTripDraft>(key: K, value: CreateTripDraft[K]) => void;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const StepReview = React.memo(({ data, set }: StepReviewProps) => {
  const startDate = data.startDate ? new Date(data.startDate) : null;
  const dateValue = startDate ? String(startDate.getDate()) : '—';
  const dateLabel = startDate ? MONTHS_SHORT[startDate.getMonth()].toLowerCase() : 'date';
  const fromLabel = data.from || 'Origin';
  const toLabel = data.to || 'Destination';
  const titleLabel = data.title || `${fromLabel} → ${toLabel}`;
  const spotsValue = data.spots === null ? '∞' : `0/${data.spots}`;

  return (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          <Text style={styles.titleItalic}>Review</Text> & publish.
        </Text>
        <Text style={styles.subtitle}>This is what riders will see.</Text>
      </View>

      <View style={styles.previewCard}>
        <RouteSketch from={fromLabel} to={toLabel} />
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle}>{titleLabel}</Text>
          <Text style={styles.previewRoute}>
            {fromLabel} → {toLabel}
          </Text>
          <View style={styles.metrics}>
            <Metric value={dateValue} label={dateLabel} />
            <Metric value={data.days} label={data.days === 1 ? 'day' : 'days'} />
            <Metric value={spotsValue} label="spots" />
          </View>
        </View>
      </View>

      <View style={styles.privacyNote}>
        <IconShield size={18} color={colors.ink} />
        <Text style={styles.privacyText}>
          Your phone stays private. Riders see your callsign only.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Review join requests</Text>
          <Text style={styles.toggleSub}>Approve each rider before they join</Text>
        </View>
        <Toggle on={data.requireApproval} onChange={(v) => set('requireApproval', v)} />
      </View>
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
  previewCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
  },
  previewBody: {
    padding: 18,
  },
  previewTitle: {
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: -0.38,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  previewRoute: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.n500,
    letterSpacing: 0.44,
    marginTop: 4,
  },
  metrics: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 14,
  },
  privacyNote: {
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.n100,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.n700,
    lineHeight: 18,
    fontFamily: fonts.sans,
  },
  toggleRow: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleText: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.n600,
    marginTop: 2,
    fontFamily: fonts.sans,
  },
});
