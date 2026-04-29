import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconCompass, IconLayers, IconLocate } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface MapControlsProps {
  onSos?: () => void;
  onCompass?: () => void;
  onLayers?: () => void;
  onLocate?: () => void;
}

const SOS_COLOR = '#B8463F';

const FloatBtn = ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.floatBtn, pressed && styles.pressed]}>
    {children}
  </Pressable>
);

export const MapControls = React.memo(({ onSos, onCompass, onLayers, onLocate }: MapControlsProps) => (
  <View style={styles.col}>
    <FloatBtn onPress={onCompass}>
      <IconCompass size={18} color={colors.ink} />
    </FloatBtn>
    <FloatBtn onPress={onLayers}>
      <IconLayers size={18} color={colors.ink} />
    </FloatBtn>
    <FloatBtn onPress={onLocate}>
      <IconLocate size={18} color={colors.ink} />
    </FloatBtn>
    <Pressable onPress={onSos} style={({ pressed }) => [styles.sosBtn, pressed && styles.sosPressed]}>
      <Text style={styles.sosText}>SOS</Text>
    </Pressable>
  </View>
));

const styles = StyleSheet.create({
  col: {
    position: 'absolute',
    right: 12,
    top: 130,
    zIndex: 18,
    gap: 8,
  },
  floatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    backgroundColor: colors.white,
  },
  sosBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SOS_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: SOS_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  sosPressed: {
    opacity: 0.85,
  },
  sosText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.88,
    color: colors.white,
  },
});
