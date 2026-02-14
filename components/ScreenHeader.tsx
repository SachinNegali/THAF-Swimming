
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { Icon } from './Icon';
import { SPACING } from '../constants/theme';
import { useThemeColor } from '../hooks/use-theme-color';
import { ThemedText } from './themed-text';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, rightAction }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: surfaceColor }]}>
          {/* <Icon name="arrow_back_ios_new" size={20} color={textColor} /> */}
          <ThemedText>IC</ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <View style={styles.rightAction}>
        {rightAction || <View style={styles.spacer} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    width: "100%"
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  rightAction: {
    width: 40,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 40,
  },
});
