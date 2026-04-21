import { useThemeColor } from '@/hooks/use-theme-color';
import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SPACING } from '../../constants/theme';

interface JoinButtonProps {
  requested: boolean;
  isPending: boolean;
  onPress: () => void;
}

export const JoinButton = memo(({ requested, isPending, onPress }: JoinButtonProps) => {
  const primaryColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'textMuted');
  const disabled = requested || isPending;

  return (
    <TouchableOpacity
      style={[
        styles.joinButton,
        { backgroundColor: requested ? mutedColor : primaryColor, opacity: disabled ? 0.7 : 1 },
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isPending ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.joinButtonText}>{requested ? 'Requested' : 'Request to Join'}</Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  joinButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
