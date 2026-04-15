import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, SPACING } from '../../constants/theme';

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

export interface GroupIdentityMember {
  id: string;
  name: string;
  /** If omitted we render initials on a colored tile. */
  avatar?: string | null;
}

interface GroupIdentityProps {
  name: string;
  /** ISO string — rendered as "Active since <Month D, YYYY>". */
  createdAt?: string;
  members: GroupIdentityMember[];
  /** Optional large group image at the top. */
  imageUrl?: string | null;
  onInvite?: () => void;
}

function formatActiveSince(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `Active since ${d.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export const GroupIdentity = memo(
  ({ name, createdAt, members, imageUrl, onInvite }: GroupIdentityProps) => {
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'textMuted');
    const primaryColor = useThemeColor({}, 'tint');
    const surfaceColor = useThemeColor({}, 'surface');
    const backgroundColor = useThemeColor({}, 'background');

    const shown = members.slice(0, 4);
    const extra = Math.max(0, members.length - shown.length);
    const activeSince = formatActiveSince(createdAt);

    return (
      <View style={styles.identityContainer}>
        <View style={[styles.groupAvatar, { backgroundColor: surfaceColor }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.groupImage} />
          ) : (
            <View style={[styles.groupImage, styles.groupImageFallback, { backgroundColor: primaryColor }]}>
              <Text style={styles.groupImageFallbackText}>{initialsOf(name)}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>
          {name}
        </Text>
        {activeSince ? (
          <Text style={[styles.groupDate, { color: mutedColor }]}>{activeSince}</Text>
        ) : null}

        {/* Avatar Stack */}
        <View style={styles.avatarStackContainer}>
          <View style={styles.avatarStack}>
            {shown.map((p, index) =>
              p.avatar ? (
                <Image
                  key={p.id}
                  source={{ uri: p.avatar }}
                  style={[
                    styles.stackAvatar,
                    { marginLeft: index > 0 ? -12 : 0, borderColor: backgroundColor },
                  ]}
                />
              ) : (
                <View
                  key={p.id}
                  style={[
                    styles.stackAvatar,
                    styles.stackAvatarFallback,
                    {
                      marginLeft: index > 0 ? -12 : 0,
                      borderColor: backgroundColor,
                      backgroundColor: surfaceColor,
                    },
                  ]}
                >
                  <Text style={[styles.stackAvatarFallbackText, { color: textColor }]}>
                    {initialsOf(p.name)}
                  </Text>
                </View>
              ),
            )}
            {extra > 0 ? (
              <View
                style={[
                  styles.moreAvatar,
                  { backgroundColor: primaryColor, borderColor: backgroundColor },
                ]}
              >
                <Text style={styles.moreAvatarText}>+{extra}</Text>
              </View>
            ) : null}
          </View>
          {onInvite ? (
            <TouchableOpacity style={styles.inviteButton} onPress={onInvite}>
              <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 14 }}>+ Invite</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  identityContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  groupAvatar: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  groupDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  avatarStackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  moreAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  moreAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  inviteButton: {
    marginLeft: SPACING.md,
  },
  groupImageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImageFallbackText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  stackAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackAvatarFallbackText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
