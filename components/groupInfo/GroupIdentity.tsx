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

interface Participant {
  id: string;
  name: string;
  avatar: string;
}

const PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
  { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
  { id: '4', name: 'David', avatar: 'https://i.pravatar.cc/150?u=david' },
];

export const GroupIdentity = memo(() => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <View style={styles.identityContainer}>
      <View style={[styles.groupAvatar, { backgroundColor: surfaceColor }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80' }} 
          style={styles.groupImage} 
        />
      </View>
      <Text style={[styles.groupName, { color: textColor }]}>Summer Roadtrip '24</Text>
      <Text style={[styles.groupDate, { color: mutedColor }]}>Active since June 12, 2024</Text>
      
      {/* Avatar Stack */}
      <View style={styles.avatarStackContainer}>
        <View style={styles.avatarStack}>
          {PARTICIPANTS.slice(0, 4).map((p, index) => (
            <Image 
              key={p.id} 
              source={{ uri: p.avatar }} 
              style={[
                styles.stackAvatar, 
                { marginLeft: index > 0 ? -12 : 0, borderColor: useThemeColor({}, 'background') }
              ]} 
            />
          ))}
          <View style={[styles.moreAvatar, { backgroundColor: primaryColor, borderColor: useThemeColor({}, 'background') }]}>
            <Text style={styles.moreAvatarText}>+2</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.inviteButton}>
          <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 14 }}>+ Invite</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

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
});
