import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconAlert, IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface ImportantBannerProps {
  fromCs: string;
  message: string;
  meta: string;
  onAcknowledge?: () => void;
  onView?: () => void;
  onDismiss: () => void;
}

const BG = '#1F1B16';
const ACCENT = '#C68B2C';
const ACCENT_LIGHT = '#E2A24A';

export const ImportantBanner = React.memo(({ fromCs, message, meta, onAcknowledge, onView, onDismiss }: ImportantBannerProps) => (
  <View style={styles.wrap} pointerEvents="box-none">
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <IconAlert size={18} color={ACCENT_LIGHT} />
        </View>
        <View style={styles.body}>
          <Text style={styles.kicker}>Important · from {fromCs}</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Pressable onPress={onDismiss} style={styles.closeBtn}>
          <IconX size={16} color="rgba(255,255,255,0.55)" />
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onAcknowledge} style={({ pressed }) => [styles.ackBtn, pressed && styles.pressed]}>
          <Text style={styles.ackText}>Acknowledge</Text>
        </Pressable>
        <Pressable onPress={onView} style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}>
          <Text style={styles.viewText}>View on map</Text>
        </Pressable>
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 88,
    left: 12,
    right: 12,
    zIndex: 80,
  },
  card: {
    backgroundColor: BG,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(198,139,44,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.44,
    textTransform: 'uppercase',
    color: ACCENT_LIGHT,
    fontWeight: '600',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.075,
    color: colors.white,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
  },
  closeBtn: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  ackBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  ackText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  viewText: {
    fontSize: 12,
    fontWeight: '500',
    color: BG,
    fontFamily: fonts.sans,
  },
  pressed: {
    opacity: 0.85,
  },
});
