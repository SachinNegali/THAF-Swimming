import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, SPACING } from '../../constants/theme';

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onEdit?: () => void;
  onMenu?: () => void;
}

export const Header = memo(({ title, onBack, onEdit, onMenu }: HeaderProps) => {
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.header, { backgroundColor: useThemeColor({ light: 'rgba(255,255,255,0.8)', dark: 'rgba(16, 22, 34, 0.8)' }, 'background') }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 20, color: primaryColor }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.headerRight}>
        {onEdit ? (
          <TouchableOpacity style={styles.headerButton} onPress={onEdit}>
            <Text style={{ color: primaryColor }}>✎</Text>
          </TouchableOpacity>
        ) : null}
        {onMenu ? (
          <TouchableOpacity style={styles.headerButton} onPress={onMenu}>
            <Text style={{ color: primaryColor }}>⋯</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: 20,
  },
});
