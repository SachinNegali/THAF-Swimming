import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { PrimaryButton } from '../components/core/form/PrimaryButton';
import { Kicker } from '../components/core/Kicker';
import { ContactForm } from '../components/medical/ContactForm';
import { MedicalEmpty } from '../components/medical/MedicalEmpty';
import { MedicalView } from '../components/medical/MedicalView';
import { DEMO_MEDICAL, DEMO_MEDICAL_CHECKLIST } from '../data/demoData';
import { IconBack, IconPlus } from '../icons/Icons';
import { colors } from '../theme';
import { MedicalProfile, MedicalViewMode } from '../types';

const MedicalV2Screen = React.memo(() => {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: MedicalViewMode }>();
  const initialMode: MedicalViewMode = (params.mode as MedicalViewMode) || 'view';

  const [view, setView] = useState<MedicalViewMode>(initialMode);
  const [data, setData] = useState<MedicalProfile>(DEMO_MEDICAL);

  const isFormMode = view === 'addContact' || view === 'editContact';
  const isViewMode = view === 'view' || view === 'empty';

  const handleBackPress = useCallback(() => {
    if (isViewMode) {
      if (router.canGoBack()) router.back();
    } else {
      setView('view');
    }
  }, [isViewMode, router]);

  const handleAdd = useCallback(() => setView('addContact'), []);
  const handleEdit = useCallback(() => setView('editContact'), []);
  const handleCancel = useCallback(() => setView('view'), []);
  const handleSave = useCallback(() => setView('view'), []);

  const handleToggleLock = useCallback((next: boolean) => {
    setData((prev) => ({ ...prev, showOnLockScreen: next }));
  }, []);

  const editingContact = view === 'editContact' ? data.contacts[0] : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.iconBtn}>
          <IconBack size={18} color={colors.ink} />
        </Pressable>
        <Kicker>Medical & Emergency</Kicker>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'view' && (
          <MedicalView data={data} onAdd={handleAdd} onEdit={handleEdit} onToggleLock={handleToggleLock} />
        )}
        {view === 'empty' && <MedicalEmpty checklist={DEMO_MEDICAL_CHECKLIST} />}
        {isFormMode && (
          <ContactForm
            editing={view === 'editContact'}
            initial={editingContact}
            onCancel={handleCancel}
            onSave={handleSave}
            onRemove={view === 'editContact' ? handleSave : undefined}
          />
        )}
      </ScrollView>

      {isViewMode && (
        <View style={styles.ctaContainer}>
          <PrimaryButton onPress={handleAdd} icon={<IconPlus size={16} color={colors.white} />}>
            {view === 'empty' ? 'Add emergency contact' : 'Add another contact'}
          </PrimaryButton>
        </View>
      )}
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
    backgroundColor: 'transparent',
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
    paddingBottom: 110,
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
  },
});

export default MedicalV2Screen;
