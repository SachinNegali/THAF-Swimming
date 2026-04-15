import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useMemo } from 'react';
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

export interface MediaItem {
  id: string;
  url: string;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onViewAll?: () => void;
  onItemPress?: (item: MediaItem) => void;
}

type ListRow = (MediaItem & { isAddButton?: false }) | { id: string; url: ''; isAddButton: true };

export const MediaGallery = memo(({ items, onViewAll, onItemPress }: MediaGalleryProps) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const dimColor = useThemeColor({}, 'textDim');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'textMuted');

  const data = useMemo<ListRow[]>(
    () => [...items, { id: '__add', url: '', isAddButton: true }],
    [items],
  );

  const renderMediaItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.isAddButton) {
        return (
          <TouchableOpacity
            style={[styles.mediaItem, styles.addMediaButton, { borderColor, backgroundColor: surfaceColor }]}
          >
            <Text style={{ fontSize: 24, color: iconColor }}>+</Text>
          </TouchableOpacity>
        );
      }
      return (
        <TouchableOpacity onPress={() => onItemPress?.(item)} activeOpacity={0.8}>
          <Image source={{ uri: item.url }} style={styles.mediaItem} />
        </TouchableOpacity>
      );
    },
    [borderColor, surfaceColor, iconColor, onItemPress],
  );

  return (
    <View style={styles.mediaSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: dimColor }]}>SHARED MEDIA</Text>
        {onViewAll && items.length > 0 ? (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={[styles.viewAll, { color: tintColor }]}>View All</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: mutedColor }]}>No shared media yet.</Text>
      ) : (
        <FlashList
          data={data}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          // estimatedItemSize={80}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.md }}
        />
      )}
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
  emptyText: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 13,
  },
});
