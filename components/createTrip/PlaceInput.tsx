import { PlacePrediction, usePlacesSearch } from '@/hooks/usePlacesSearch';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { TripPlace } from '../../types';

interface PlaceInputProps {
  label: string;
  icon: React.ReactNode;
  value: TripPlace | null;
  onSelect: (place: TripPlace | null) => void;
  placeholder?: string;
  onRemove?: () => void;
}

export const PlaceInput = React.memo(({ label, icon, value, onSelect, placeholder, onRemove }: PlaceInputProps) => {
  const search = usePlacesSearch();
  const [text, setText] = useState(value?.name ?? '');
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    setText(value?.name ?? '');
  }, [value?.name]);

  const handleChange = useCallback(
    (next: string) => {
      setText(next);
      search.onSearchTextChange(next);
      if (next.trim() === '' && value) onSelect(null);
    },
    [search, value, onSelect],
  );

  const handlePick = useCallback(
    async (prediction: PlacePrediction) => {
      Keyboard.dismiss();
      const name = prediction.structured_formatting.main_text;
      setText(name);
      const details = await search.selectPlace(prediction);
      if (details) {
        onSelect({
          coordinates: { lat: details.lat, lng: details.lng },
          type: 'city',
          name: details.name || name,
        });
      }
    },
    [search, onSelect],
  );

  const handleClear = useCallback(() => {
    setText('');
    search.clearSearch();
    onSelect(null);
  }, [search, onSelect]);

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.iconCol}>{icon}</View>
        <View style={styles.body}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={text}
            onChangeText={handleChange}
            onFocus={() => {
              setFocused(true);
              if (search.searchResults.length > 0) search.setShowSearchResults(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={colors.n400}
            style={styles.input}
          />
        </View>
        <View style={styles.trailing}>
          {search.isSearching && <ActivityIndicator size="small" color={colors.n500} />}
          {!search.isSearching && text.length > 0 && (
            <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={8}>
              <IconX size={12} color={colors.n500} />
            </Pressable>
          )}
          {!search.isSearching && text.length === 0 && onRemove && (
            <Pressable onPress={onRemove} style={styles.clearBtn} hitSlop={8}>
              <IconX size={12} color={colors.n500} />
            </Pressable>
          )}
        </View>
      </View>

      {focused && search.showSearchResults && search.searchResults.length > 0 && (
        <View style={styles.dropdown}>
          {search.searchResults.map((item, index) => (
            <Pressable
              key={item.place_id}
              onPress={() => handlePick(item)}
              style={({ pressed }) => [
                styles.dropdownItem,
                index < search.searchResults.length - 1 && styles.dropdownDivider,
                pressed && styles.dropdownItemPressed,
              ]}
            >
              <View style={styles.dropdownDot} />
              <View style={styles.dropdownText}>
                <Text style={styles.dropdownMain} numberOfLines={1}>
                  {item.structured_formatting.main_text}
                </Text>
                <Text style={styles.dropdownSecondary} numberOfLines={1}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCol: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.26,
    color: colors.n500,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    letterSpacing: -0.15,
    marginTop: 2,
    padding: 0,
  },
  trailing: {
    minWidth: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemPressed: {
    backgroundColor: colors.n100,
  },
  dropdownDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.n200,
  },
  dropdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.n400,
  },
  dropdownText: {
    flex: 1,
  },
  dropdownMain: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    letterSpacing: -0.14,
  },
  dropdownSecondary: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.n500,
    marginTop: 2,
  },
});
