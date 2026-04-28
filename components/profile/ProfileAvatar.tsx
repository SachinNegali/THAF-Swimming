import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconPlus } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface ProfileAvatarProps {
  name: string;
  size?: number;
  showAddBadge?: boolean;
}

export const ProfileAvatar = React.memo(({ name, size = 92, showAddBadge = true }: ProfileAvatarProps) => {
  const initials = useMemo(
    () => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    [name]
  );

  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.inner, { borderRadius: (size - 12) / 2 }]}>
        <Text style={[styles.initials, { fontSize: size * 0.42 }]}>{initials}</Text>
      </View>
      {showAddBadge && (
        <View style={styles.addBadge}>
          <IconPlus size={12} color={colors.ink} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.n200,
    borderWidth: 1,
    borderColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.white,
    letterSpacing: -0.4,
  },
  addBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
