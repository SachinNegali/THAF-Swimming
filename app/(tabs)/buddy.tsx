import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertOverlay } from '../../components/buddy/AlertOverlay';
import { BuddyDots } from '../../components/buddy/BuddyDots';
import { BuddySheet } from '../../components/buddy/BuddySheet';
import { JoinTrip } from '../../components/buddy/JoinTrip';
import { MapControls } from '../../components/buddy/MapControls';
import { PaperMap } from '../../components/buddy/PaperMap';
import { TripHeader } from '../../components/buddy/TripHeader';
import { DEMO_BUDDIES, DEMO_QUICK_MSGS } from '../../data/demoData';
import { colors } from '../../theme';
import { AlertKind, BuddyMapMode, BuddySheetState } from '../../types';

interface BuddyScreenProps {
  initialMode?: BuddyMapMode;
}

const BuddyScreen = React.memo(({ initialMode = 'live' }: BuddyScreenProps) => {
  const router = useRouter();
  const [mode, setMode] = useState<BuddyMapMode>(initialMode);
  const [sheet, setSheet] = useState<BuddySheetState>('collapsed');
  const [alert, setAlert] = useState<AlertKind>(
    initialMode === 'sos' ? 'sos' : initialMode === 'important' ? 'important' : initialMode === 'regular' ? 'regular' : null
  );

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const toggleSheet = useCallback(() => {
    setSheet((s) => (s === 'collapsed' ? 'expanded' : 'collapsed'));
  }, []);

  const handleQuickSend = useCallback(() => {
    setAlert('regular');
  }, []);

  const handleSos = useCallback(() => setAlert('sos'), []);
  const dismissAlert = useCallback(() => setAlert(null), []);

  const toastBuddy = DEMO_BUDDIES.find((b) => b.cs === 'NORTH');

  if (mode === 'join') {
    return <JoinTrip onBack={handleBack} onJoined={() => setMode('live')} />;
  }

  return (
    <View style={styles.screen}>
      <PaperMap />
      <TripHeader
        packCount={DEMO_BUDDIES.length}
        origin="Pune"
        destination="Goa"
        eta="4h 12m"
        onBack={() => setMode('join')}
      />
      <MapControls onSos={handleSos} />
      <BuddyDots buddies={DEMO_BUDDIES} onTap={() => setSheet('expanded')} />
      <AlertOverlay kind={alert} toastBuddy={toastBuddy} onDismiss={dismissAlert} />
      <BuddySheet
        state={sheet}
        buddies={DEMO_BUDDIES}
        quickMsgs={DEMO_QUICK_MSGS}
        onToggle={toggleSheet}
        onQuickSend={handleQuickSend}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper2,
  },
});

export default BuddyScreen;
