import { useThemeColor } from '@/hooks/use-theme-color';
import type { JoinRequest } from '@/types/api';
import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING } from '../../constants/theme';
import { relativeTime } from './helpers';

interface JoinRequestRowProps {
  request: JoinRequest;
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
  isBusy: boolean;
}

const JoinRequestRow = memo(({ request, onAccept, onDecline, isBusy }: JoinRequestRowProps) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const fullName = `${request.user.fName ?? ''} ${request.user.lName ?? ''}`.trim() || request.user.email;

  return (
    <View style={[styles.requestRow, { backgroundColor: surfaceColor, borderColor }]}>
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, { color: textColor }]}>{fullName}</Text>
        <Text style={[styles.requestMeta, { color: mutedColor }]} numberOfLines={1}>
          {request.user.email}
        </Text>
        <Text style={[styles.requestMeta, { color: mutedColor }]}>
          {relativeTime(request.requestedAt)}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestButton, { backgroundColor: primaryColor, opacity: isBusy ? 0.6 : 1 }]}
          disabled={isBusy}
          onPress={() => onAccept(request.user._id)}
          activeOpacity={0.85}
        >
          <Text style={styles.requestButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButtonOutline, { borderColor, opacity: isBusy ? 0.6 : 1 }]}
          disabled={isBusy}
          onPress={() => onDecline(request.user._id)}
          activeOpacity={0.85}
        >
          <Text style={[styles.requestButtonOutlineText, { color: textColor }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

interface JoinRequestsSectionProps {
  requests: JoinRequest[];
  isLoading: boolean;
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
  busyUserId: string | null;
}

export const JoinRequestsSection = memo(({ requests, isLoading, onAccept, onDecline, busyUserId }: JoinRequestsSectionProps) => {
  const mutedColor = useThemeColor({}, 'textMuted');

  if (!isLoading && requests.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>
        JOIN REQUESTS ({requests.length})
      </Text>
      {isLoading && requests.length === 0 ? (
        <ActivityIndicator />
      ) : (
        requests.map((r) => (
          <JoinRequestRow
            key={r._id}
            request={r}
            onAccept={onAccept}
            onDecline={onDecline}
            isBusy={busyUserId === r.user._id}
          />
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  requestInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
  },
  requestMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  requestButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  requestButtonOutline: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    borderWidth: 1,
  },
  requestButtonOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
