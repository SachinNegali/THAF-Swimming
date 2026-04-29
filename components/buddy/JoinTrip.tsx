import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconArrowRight, IconBack, IconBike } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { PrimaryButton } from '../core/form/PrimaryButton';
import { Hairline } from '../core/Hairline';
import { Kicker } from '../core/Kicker';
import { QRViewfinder } from './QRViewfinder';

interface JoinTripProps {
  onBack?: () => void;
  onJoined: () => void;
}

type JoinTab = 'scan' | 'code';

export const JoinTrip = React.memo(({ onBack, onJoined }: JoinTripProps) => {
  const [tab, setTab] = useState<JoinTab>('scan');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const nv = v.slice(-1).toUpperCase();
    const next = [...code];
    next[i] = nv;
    setCode(next);
    if (nv && i < 5) inputs.current[i + 1]?.focus();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <IconBack size={18} color={colors.ink} />
        </Pressable>
        <Kicker>Join a trip</Kicker>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroBlock}>
          <Kicker>Buddy tracking</Kicker>
          <Text style={styles.heroTitle}>
            Ride together,{' '}
            <Text style={styles.heroItalic}>even apart</Text>
          </Text>
          <Text style={styles.heroBody}>
            See the pack on a live map. Send quick checks, photo breaks or fuel pings —
            no chat clutter. SOS reaches everyone in two taps.
          </Text>
        </View>

        <View style={styles.tabs}>
          {([
            { id: 'scan' as JoinTab, label: 'Scan QR' },
            { id: 'code' as JoinTab, label: 'Enter code' },
          ]).map((t) => {
            const isActive = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'scan' && <QRViewfinder />}

        {tab === 'code' && (
          <View>
            <Kicker style={styles.kicker}>6-digit code</Kicker>
            <View style={styles.codeRow}>
              {code.map((c, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={c}
                  onChangeText={(v) => setDigit(i, v)}
                  maxLength={1}
                  autoCapitalize="characters"
                  style={[styles.codeInput, c ? styles.codeInputFilled : undefined]}
                />
              ))}
            </View>
            <Text style={styles.codeHint}>
              Ask the leader for the trip code · case-insensitive
            </Text>
          </View>
        )}

        <View style={styles.dividerRow}>
          <Hairline label="or" />
        </View>

        <Pressable
          onPress={onJoined}
          style={({ pressed }) => [styles.soloCard, pressed && styles.soloPressed]}
        >
          <View style={styles.soloIcon}>
            <IconBike size={22} color={colors.ink} />
          </View>
          <View style={styles.soloBody}>
            <Text style={styles.soloTitle}>Quick solo trip</Text>
            <Text style={styles.soloMeta}>Track yourself · share live link with 1 contact</Text>
          </View>
          <IconArrowRight size={16} color={colors.ink} />
        </Pressable>

        {tab === 'code' && (
          <View style={styles.cta}>
            <PrimaryButton onPress={onJoined} icon={<IconArrowRight size={16} color={colors.white} />}>
              Join the pack
            </PrimaryButton>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  heroBlock: {
    marginBottom: 22,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: -0.65,
    lineHeight: 28.6,
    color: colors.ink,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  heroItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  heroBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20.15,
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.n100,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.07,
    color: colors.n500,
    fontFamily: fonts.sans,
  },
  tabTextActive: {
    color: colors.ink,
  },
  kicker: {
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  codeInput: {
    flex: 1,
    height: 56,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 22,
    fontWeight: '500',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n300,
    borderRadius: 12,
    color: colors.ink,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  codeInputFilled: {
    borderColor: colors.ink,
  },
  codeHint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.n500,
  },
  dividerRow: {
    marginVertical: 26,
  },
  soloCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  soloPressed: {
    backgroundColor: colors.paper2,
  },
  soloIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soloBody: {
    flex: 1,
    minWidth: 0,
  },
  soloTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  soloMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.n500,
    marginTop: 4,
  },
  cta: {
    marginTop: 22,
  },
});
