import { ScreenHeader } from '@/components/ScreenHeader';
import MedicalEmergencySection from '@/components/profile/MedicalEmergencySection';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function MedicalEmergencyScreen() {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScreenHeader title="Medical & Emergency" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <MedicalEmergencySection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
});
