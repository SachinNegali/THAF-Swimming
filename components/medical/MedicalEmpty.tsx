import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconShield } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { MedicalChecklistItem } from '../../types';
import { ChecklistCard } from './ChecklistCard';

interface MedicalEmptyProps {
  checklist: MedicalChecklistItem[];
}

export const MedicalEmpty = React.memo(({ checklist }: MedicalEmptyProps) => (
  <View style={styles.container}>
    <View style={styles.hero}>
      <View style={styles.iconCircle}>
        <IconShield size={26} color={colors.ink} />
      </View>
      <Text style={styles.title}>
        A safety net for the{' '}
        <Text style={styles.titleItalic}>unexpected</Text>
      </Text>
      <Text style={styles.body}>
        We share your blood group and one trusted contact with co-riders during a live ride —
        and surface it on your lock screen if responders open your phone.
      </Text>
    </View>

    <ChecklistCard items={checklist} />

    <View style={styles.footer}>
      <Text style={styles.footerText}>~2 minutes · End-to-end encrypted</Text>
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    gap: 22,
  },
  hero: {
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 22,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.55,
    lineHeight: 25.3,
    color: colors.ink,
    marginTop: 14,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  body: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20.15,
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  footerText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.n500,
  },
});
