import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/core/form/PrimaryButton';
import { Kicker } from '../components/core/Kicker';
import { StepProgress } from '../components/createTrip/StepProgress';
import { StepReview } from '../components/createTrip/StepReview';
import { StepRoute } from '../components/createTrip/StepRoute';
import { StepSchedule } from '../components/createTrip/StepSchedule';
import { IconArrowRight, IconX } from '../icons/Icons';
import { colors, fonts } from '../theme';
import { CreateTripDraft } from '../types';

const STEPS = ['Route', 'Schedule', 'Review'];

const INITIAL_DRAFT: CreateTripDraft = {
  title: '',
  from: '',
  to: '',
  startDate: null,
  days: 2,
  spots: null,
  description: '',
  requireApproval: true,
};

const CreateTripV2 = React.memo(() => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CreateTripDraft>(INITIAL_DRAFT);

  console.log("CREATE TRIP DATA.....", data)

  const set = useCallback(<K extends keyof CreateTripDraft>(key: K, value: CreateTripDraft[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return data.from.trim() !== '' && data.to.trim() !== '';
    if (step === 1) return data.startDate !== null && data.days > 0;
    return true;
  }, [step, data]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handlePublish = useCallback(() => {
    // TODO: wire up publish
    if (router.canGoBack()) router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handlePublish();
  }, [step, handlePublish]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.iconBtn}>
          <IconX size={18} color={colors.ink} />
        </Pressable>
        <Kicker>New trip · {step + 1}/{STEPS.length}</Kicker>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressContainer}>
        <StepProgress steps={STEPS} current={step} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <StepRoute data={data} set={set} />}
        {step === 1 && <StepSchedule data={data} set={set} />}
        {step === 2 && <StepReview data={data} set={set} />}
      </ScrollView>

      <View style={styles.ctaContainer}>
        {step > 0 && (
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <PrimaryButton
          onPress={canNext ? handleContinue : undefined}
          icon={<IconArrowRight size={16} color={colors.white} />}
          style={{ ...styles.primary, ...(canNext ? null : styles.primaryDisabled) }}
        >
          {step < STEPS.length - 1 ? 'Continue' : 'Publish trip'}
        </PrimaryButton>
      </View>
    </SafeAreaView>
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
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  progressContainer: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 140,
  },
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPressed: {
    backgroundColor: colors.n100,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
    letterSpacing: -0.14,
  },
  primary: {
    flex: 1,
  },
  primaryDisabled: {
    opacity: 0.4,
  },
});

export default CreateTripV2;
