import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconBack } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface TripHeaderProps {
  packCount: number;
  origin: string;
  destination: string;
  eta: string;
  onBack?: () => void;
}

const LIVE_COLOR = '#ff4444';

export const TripHeader = React.memo(({ packCount, origin, destination, eta, onBack }: TripHeaderProps) => (
  <View style={styles.wrap} pointerEvents="box-none">
    <View style={styles.bar}>
      <Pressable onPress={onBack} style={styles.iconBtn}>
        <IconBack size={18} color={colors.ink} />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live · {packCount} in pack</Text>
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {origin}
          <Text style={styles.arrow}> → </Text>
          <Text style={styles.titleItalic}>{destination}</Text>
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.etaLabel}>ETA</Text>
        <Text style={styles.etaValue}>{eta}</Text>
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 20,
  },
  bar: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIVE_COLOR,
  },
  liveText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    textTransform: 'uppercase',
    color: LIVE_COLOR,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: colors.ink,
    marginTop: 2,
    fontFamily: fonts.sans,
  },
  arrow: {
    color: colors.n400,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  right: {
    alignItems: 'flex-end',
  },
  etaLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    textTransform: 'uppercase',
    color: colors.n500,
  },
  etaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
});
