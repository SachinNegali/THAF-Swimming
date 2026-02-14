import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback } from 'react';
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

interface MediaItem {
  id: string;
  url: string;
  isAddButton?: boolean;
}

const MEDIA: MediaItem[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=200&q=80' },
  { id: '2', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80' },
  { id: '3', url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=200&q=80' },
  { id: 'add', isAddButton: true, url: '' },
];

export const MediaGallery = memo(() => {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const renderMediaItem = useCallback(({ item }: { item: MediaItem }) => {
    if (item.isAddButton) {
      return (
        <TouchableOpacity style={[styles.mediaItem, styles.addMediaButton, { borderColor, backgroundColor: surfaceColor }]}>
          <Text style={{ fontSize: 24, color: iconColor}}>+</Text>
        </TouchableOpacity>
      );
    }
    return (
      <Image source={{ uri: item.url }} style={styles.mediaItem} />
    );
  }, [borderColor, surfaceColor]);

  return (
    <View style={styles.mediaSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: useThemeColor({}, 'textDim') }]}>SHARED MEDIA</Text>
        <TouchableOpacity>
          <Text style={[styles.viewAll, { color: useThemeColor({}, 'tint') }]}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlashList
        data={MEDIA}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        // estimatedItemSize={80}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.md }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  mediaSection: {
    marginTop: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  addMediaButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
