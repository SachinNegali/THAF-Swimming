import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { Kicker } from '../core/Kicker';

interface BloodGroupHeroProps {
  bloodGroup: string;
  bloodGroupName: string;
  updated: string;
  onUpdate?: () => void;
}

export const BloodGroupHero = React.memo(({ bloodGroup, bloodGroupName, updated, onUpdate }: BloodGroupHeroProps) => (
  <View style={styles.card}>
    <Svg width="100%" height="100%" viewBox="0 0 400 200" style={styles.bg} preserveAspectRatio="none">
      {[...Array(10)].map((_, i) => (
        <Path
          key={i}
          d={`M -20 ${10 + i * 22} Q 100 ${i * 18}, 200 ${30 + i * 20} T 420 ${i * 24}`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
          fill="none"
        />
      ))}
    </Svg>

    <View style={styles.row}>
      <View style={styles.plate}>
        <Text style={styles.plateText}>{bloodGroup}</Text>
      </View>
      <View style={styles.body}>
        <Kicker style={styles.kicker}>Blood group</Kicker>
        <Text style={styles.name}>{bloodGroupName}</Text>
        <Text style={styles.meta}>{updated}</Text>
        <Pressable onPress={onUpdate} style={({ pressed }) => [styles.updateBtn, pressed && styles.updatePressed]}>
          <Text style={styles.updateText}>Update</Text>
        </Pressable>
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: 18,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  plate: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateText: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 42,
    fontWeight: '400',
    color: colors.ink,
    letterSpacing: -1.26,
  },
  body: {
    flex: 1,
  },
  kicker: {
    color: 'rgba(255,255,255,0.55)',
  },
  name: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.44,
    color: colors.white,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.66,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
  },
  updateBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  updatePressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  updateText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },
});
