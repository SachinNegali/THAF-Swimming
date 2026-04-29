import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { Avatar } from '../core/Avatar';
import { BottomSheet } from '../core/BottomSheetWrapper';
import { Kicker } from '../core/Kicker';
import { PrimaryButton } from '../core/form/PrimaryButton';
import { IconCheck, IconFlash } from '../../icons/Icons';

type Stage = 'confirm' | 'broadcasting' | 'done';

interface BroadcastSheetProps {
  visible: boolean;
  members: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

const NEXT_STEPS = [
  'Push notification to all confirmed riders',
  'Live tracking switches on for the pack',
  'Thread pinned with ETA + waypoints',
  'SOS + quick alarms available on Maps tab',
];

export const BroadcastSheet = React.memo(({ visible, members, onCancel, onConfirm }: BroadcastSheetProps) => {
  const [stage, setStage] = useState<Stage>('confirm');

  useEffect(() => {
    if (visible) setStage('confirm');
  }, [visible]);

  useEffect(() => {
    if (stage === 'broadcasting') {
      const t = setTimeout(() => setStage('done'), 1400);
      return () => clearTimeout(t);
    }
    if (stage === 'done') {
      const t = setTimeout(onConfirm, 900);
      return () => clearTimeout(t);
    }
  }, [stage, onConfirm]);

  const handleClose = stage === 'confirm' ? onCancel : () => {};

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['70%']}
      enablePanDownToClose={stage === 'confirm'}
      scrollable
    >
      <View style={styles.container}>
        {stage === 'confirm' && (
          <>
            <Kicker>Start ride</Kicker>
            <Text style={styles.title}>
              Broadcast <Text style={styles.titleItalic}>“We’re rolling”</Text> to your pack?
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.liveDot} />
                <Kicker style={styles.infoKicker}>What happens next</Kicker>
              </View>
              {NEXT_STEPS.map((x, i) => (
                <View key={i} style={styles.infoRow}>
                  <IconCheck size={14} color={colors.ink} />
                  <Text style={styles.infoText}>{x}</Text>
                </View>
              ))}
            </View>

            <View style={styles.notifySection}>
              <Kicker style={styles.notifyKicker}>Notifying · {members.length} riders</Kicker>
              <View style={styles.avatarsRow}>
                {members.map((m, i) => (
                  <View key={i} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                    <Avatar name={m} size={30} tone={i} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              <PrimaryButton dark={false} onPress={onCancel} style={styles.cancelBtn}>Not yet</PrimaryButton>
              <PrimaryButton
                onPress={() => setStage('broadcasting')}
                icon={<IconFlash size={16} color={colors.white} />}
                style={styles.confirmBtn}
              >
                Start & broadcast
              </PrimaryButton>
            </View>
          </>
        )}

        {stage === 'broadcasting' && (
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <IconFlash size={28} color={colors.white} />
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="48" fill="none" stroke={colors.ink} strokeOpacity="0.2" strokeWidth="1" />
              </Svg>
            </View>
            <Kicker style={styles.statusKicker}>Broadcasting</Kicker>
            <Text style={styles.statusTitle}>Alerting {members.length} riders…</Text>
          </View>
        )}

        {stage === 'done' && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, styles.successBadge]}>
              <IconCheck size={32} color={colors.white} />
            </View>
            <Kicker style={styles.statusKicker}>Ride is live</Kicker>
            <Text style={styles.statusTitle}>Opening Maps…</Text>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.6,
    marginTop: 4,
    lineHeight: 27.6,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  infoCard: {
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoKicker: {
    color: colors.ink,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.n700,
    fontFamily: fonts.sans,
    marginTop: -1,
  },
  notifySection: {
    marginTop: 16,
  },
  notifyKicker: {
    marginBottom: 10,
  },
  avatarsRow: {
    flexDirection: 'row',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 0.4,
  },
  confirmBtn: {
    flex: 1,
  },
  statusContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  statusBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 18,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  successBadge: {
    backgroundColor: '#4DB86A',
  },
  statusKicker: {
    color: colors.ink,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 6,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
});
