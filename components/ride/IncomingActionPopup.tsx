import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

// Optional expo-av — sound is silent if the module isn't installed.
// To enable: `npx expo install expo-av`
let Audio: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Audio = require('expo-av').Audio;
} catch {
  /* sound disabled */
}

const SIREN_URI = 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cd0c8f7e5.mp3';
const PING_URI = 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_52d5c73a3b.mp3';

export type ActionPriority = 'emergency' | 'medium' | 'regular';

export interface IncomingAction {
  actionId: string;
  label: string;
  priority: ActionPriority | string;
  senderUserId: string;
  senderName: string;
  timestamp: number;
}

export interface IncomingActionPopupProps {
  action: IncomingAction | null;
  onDismiss: () => void;
  onNavigateToSender?: (senderUserId: string) => void;
}

const { height: SCREEN_H } = Dimensions.get('window');
const REGULAR_AUTO_DISMISS_MS = 5000;
const EMERGENCY_VIBRATE_MS = 10000;

export const IncomingActionPopup: React.FC<IncomingActionPopupProps> = ({
  action,
  onDismiss,
  onNavigateToSender,
}) => {
  const translateY = useRef(new Animated.Value(-SCREEN_H)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<any>(null);
  const vibrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const priority: ActionPriority =
    action?.priority === 'emergency' || action?.priority === 'medium'
      ? action.priority
      : 'regular';

  useEffect(() => {
    if (!action) return;

    const isEmergency = priority === 'emergency';
    const isImportant = priority === 'medium';

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Sound
    if (Audio) {
      (async () => {
        try {
          const uri = isEmergency ? SIREN_URI : PING_URI;
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true, isLooping: isEmergency, volume: 1.0 },
          );
          soundRef.current = sound;
        } catch (e) {
          console.warn('[IncomingActionPopup] sound error', e);
        }
      })();
    }

    // Haptics / vibration
    if (isEmergency) {
      const pattern = [0, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250, 600, 250];
      Vibration.vibrate(pattern, true);
      vibrateTimerRef.current = setTimeout(() => Vibration.cancel(), EMERGENCY_VIBRATE_MS);
    } else {
      Haptics.notificationAsync(
        isImportant
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }

    // Auto-dismiss regular only
    if (priority === 'regular') {
      autoDismissRef.current = setTimeout(() => handleDismiss(), REGULAR_AUTO_DISMISS_MS);
    }

    return () => {
      if (vibrateTimerRef.current) clearTimeout(vibrateTimerRef.current);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.stopAsync?.().catch(() => {});
        soundRef.current.unloadAsync?.().catch(() => {});
        soundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action?.timestamp]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -SCREEN_H, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  const handleNavigate = () => {
    if (action && onNavigateToSender) onNavigateToSender(action.senderUserId);
    handleDismiss();
  };

  if (!action) return null;

  // ─── Emergency (half-screen, red) ──────────────────────────
  if (priority === 'emergency') {
    return (
      <Animated.View
        style={[styles.emergencyContainer, { transform: [{ translateY }], opacity }]}
        pointerEvents="auto"
      >
        <View style={styles.emergencyHeader}>
          <MaterialIcons name="warning" size={64} color="#fff" />
          <Text style={styles.emergencyTitle}>EMERGENCY</Text>
        </View>
        <Text style={styles.emergencyLabel}>{action.label}</Text>
        <Text style={styles.emergencySender}>from {action.senderName}</Text>

        <View style={styles.emergencyActions}>
          {onNavigateToSender && (
            <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate} activeOpacity={0.85}>
              <MaterialIcons name="navigation" size={22} color="#D32F2F" />
              <Text style={styles.navigateBtnText}>Navigate to {action.senderName}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.85}>
            <Text style={styles.dismissBtnText}>Acknowledge</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ─── Important (25% screen, orange) ─────────────────────────
  if (priority === 'medium') {
    return (
      <Animated.View
        style={[styles.importantContainer, { transform: [{ translateY }], opacity }]}
        pointerEvents="auto"
      >
        <View style={styles.importantRow}>
          <MaterialCommunityIcons name="account-group" size={36} color="#fff" />
          <View style={styles.importantTextBlock}>
            <Text style={styles.importantLabel}>{action.label}</Text>
            <Text style={styles.importantSender}>from {action.senderName}</Text>
          </View>
          <TouchableOpacity style={styles.importantClose} onPress={handleDismiss} hitSlop={10}>
            <MaterialIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ─── Regular (content-fit, auto-dismiss) ────────────────────
  return (
    <Animated.View
      style={[styles.regularContainer, { transform: [{ translateY }], opacity }]}
      pointerEvents="auto"
    >
      <MaterialIcons name="info-outline" size={20} color="#fff" />
      <Text style={styles.regularText}>
        <Text style={styles.regularSender}>{action.senderName}: </Text>
        {action.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Emergency
  emergencyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.5,
    backgroundColor: '#D32F2F',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    zIndex: 1000,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  emergencyHeader: { alignItems: 'center', gap: 8 },
  emergencyTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  emergencyLabel: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  emergencySender: { color: '#FFCDD2', fontSize: 16, fontWeight: '600' },
  emergencyActions: { width: '100%', gap: 10 },
  navigateBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navigateBtnText: { color: '#D32F2F', fontSize: 16, fontWeight: '800' },
  dismissBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dismissBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Important
  importantContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.25,
    backgroundColor: '#FB8C00',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    zIndex: 1000,
    elevation: 20,
    justifyContent: 'center',
  },
  importantRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  importantTextBlock: { flex: 1 },
  importantLabel: { color: '#fff', fontSize: 22, fontWeight: '800' },
  importantSender: { color: '#FFE0B2', fontSize: 14, fontWeight: '600', marginTop: 2 },
  importantClose: { padding: 4 },

  // Regular
  regularContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(33, 33, 33, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    maxWidth: '90%',
  },
  regularText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  regularSender: { fontWeight: '800' },
});

export default IncomingActionPopup;
