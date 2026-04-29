import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { IconPhone } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface SosOverlayProps {
  fromName: string;
  distance: string;
  location: string;
  speedAtAlert: string;
  battery: string;
  signal: string;
  time: string;
  broadcastTo: string;
  onCall?: () => void;
  onNavigate?: () => void;
  onDismiss: () => void;
}

const SOS_BG = '#B8463F';

export const SosOverlay = React.memo(({
  fromName,
  distance,
  location,
  speedAtAlert,
  battery,
  signal,
  time,
  broadcastTo,
  onCall,
  onNavigate,
  onDismiss,
}: SosOverlayProps) => (
  <SafeAreaView style={styles.overlay}>
    <View style={styles.pulseBorder} pointerEvents="none" />

    <View style={styles.body}>
      <View style={styles.top}>
        <Text style={styles.kicker}>Emergency · SOS</Text>
        <Text style={styles.title}>
          {fromName} sent{' '}
          <Text style={styles.italic}>an SOS</Text>
        </Text>
        <Text style={styles.subtitle}>
          Last seen <Text style={styles.mono}>{distance}</Text> behind you, on {location}.
        </Text>

        <View style={styles.statGrid}>
          <SosStat label="Speed at alert" value={speedAtAlert} />
          <SosStat label="Battery" value={battery} />
          <SosStat label="Signal" value={signal} />
          <SosStat label="Time" value={time} />
        </View>

        <View style={styles.broadcast}>
          <Text style={styles.broadcastLabel}>BROADCASTING TO</Text>
          <Text style={styles.broadcastValue}>{broadcastTo}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onCall} style={({ pressed }) => [styles.callBtn, pressed && styles.btnPressed]}>
          <IconPhone size={18} color={SOS_BG} />
          <Text style={styles.callText}>Call {fromName.split(' ')[0]}</Text>
        </Pressable>
        <Pressable onPress={onNavigate} style={({ pressed }) => [styles.navBtn, pressed && styles.btnPressed]}>
          <Text style={styles.navText}>Navigate to her location</Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={styles.dismiss}>
          <Text style={styles.dismissText}>I&apos;m aware · dismiss</Text>
        </Pressable>
      </View>
    </View>
  </SafeAreaView>
));

const SosStat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SOS_BG,
    zIndex: 100,
  },
  pulseBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  body: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  top: {},
  kicker: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2.64,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  title: {
    fontSize: 48,
    fontWeight: '500',
    letterSpacing: -1.68,
    lineHeight: 45.6,
    marginTop: 14,
    color: colors.white,
    fontFamily: fonts.sans,
  },
  italic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22.4,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 18,
    fontFamily: fonts.sans,
  },
  mono: {
    fontFamily: fonts.mono,
  },
  statGrid: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    width: '50%',
    paddingVertical: 6,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    marginTop: 3,
    fontFamily: fonts.sans,
  },
  broadcast: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  broadcastLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: 'rgba(255,255,255,0.7)',
  },
  broadcastValue: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.white,
    marginTop: 4,
    lineHeight: 20.8,
  },
  actions: {
    gap: 10,
    marginTop: 30,
  },
  callBtn: {
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPressed: {
    opacity: 0.9,
  },
  callText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
    color: SOS_BG,
    fontFamily: fonts.sans,
  },
  navBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },
  dismiss: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.54,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
});
