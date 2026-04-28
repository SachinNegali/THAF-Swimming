import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { IconBike } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ProfileBike } from '../../types';

interface BikeCardProps {
  bike: ProfileBike;
}

export const BikeCard = React.memo(({ bike }: BikeCardProps) => (
  <View style={styles.card}>
    <Svg width="100%" height="100%" viewBox="0 0 400 200" style={styles.bg} preserveAspectRatio="none">
      {[...Array(10)].map((_, i) => (
        <Path
          key={i}
          d={`M -20 ${10 + i * 20} Q 100 ${i * 18}, 200 ${30 + i * 20} T 420 ${i * 24}`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
          fill="none"
        />
      ))}
    </Svg>

    <View style={styles.headerRow}>
      <View style={styles.iconCircle}>
        <IconBike size={22} color={colors.white} />
      </View>
      <View style={styles.titleCol}>
        <Text style={styles.kicker}>{bike.year} · Primary</Text>
        <Text style={styles.title}>
          {bike.make}{' '}
          <Text style={styles.titleItalic}>{bike.model}</Text>
        </Text>
        <Text style={styles.plate}>{bike.plate}</Text>
      </View>
    </View>

    <View style={styles.metricsRow}>
      <DarkMetric value={bike.odometer || '—'} label="odometer" />
      <DarkMetric value={bike.nextService || '—'} label="next service" />
      <DarkMetric value={bike.insured ? '✓ Ins' : '—'} label="insured" />
    </View>
  </View>
));

const DarkMetric = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
  },
  kicker: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.255,
    color: colors.white,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  plate: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.66,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  },
  metricLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
    fontWeight: '500',
  },
});
