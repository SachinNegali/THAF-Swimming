import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { PlacePrediction, RideMode } from './types';

interface SearchBarProps {
  searchQuery: string;
  onSearchTextChange: (text: string) => void;
  onSubmit: () => void;
  isSearching: boolean;
  onClear: () => void;
  onFocus: () => void;
}

export const SearchInput = memo(({
  searchQuery,
  onSearchTextChange,
  onSubmit,
  isSearching,
  onClear,
  onFocus,
}: SearchBarProps) => (
  <View style={styles.searchBar}>
    <Ionicons name="search" size={20} color="#666" />
    <TextInput
      style={styles.searchInput}
      placeholder="Search destination..."
      placeholderTextColor="#999"
      value={searchQuery}
      onChangeText={onSearchTextChange}
      onSubmitEditing={onSubmit}
      returnKeyType="search"
      onFocus={onFocus}
    />
    {isSearching && <ActivityIndicator size="small" color="#2196F3" />}
    {searchQuery.length > 0 && !isSearching && (
      <TouchableOpacity onPress={onClear}>
        <Ionicons name="close-circle" size={20} color="#999" />
      </TouchableOpacity>
    )}
  </View>
));

interface ConnectionBadgeProps {
  isConnected: boolean;
  isPolling: boolean;
  hasError: boolean;
  groupSize: number;
}

export const ConnectionBadge = memo(({ isConnected, isPolling, hasError, groupSize }: ConnectionBadgeProps) => (
  <View style={[styles.connectionBadge, {
    backgroundColor: isConnected ? '#4CAF50' : isPolling ? '#FF9800' : hasError ? '#FF5252' : '#9E9E9E',
  }]}>
    <Text style={styles.connectionText}>
      {isConnected ? `${groupSize} online` : isPolling ? 'polling' : hasError ? 'error' : 'offline'}
    </Text>
  </View>
));

interface RideStripProps {
  rideMode: RideMode;
  onEndRide: () => void;
}

export const RideStrip = memo(({ rideMode, onEndRide }: RideStripProps) => {
  if (rideMode.type === 'none') return null;

  return (
    <View style={styles.rideStrip}>
      <View style={styles.rideStripLeft}>
        <View style={[styles.rideDot, {
          backgroundColor: rideMode.type === 'quick' ? '#FF6D00' : '#2196F3',
        }]} />
        <Text style={styles.rideStripLabel} numberOfLines={1}>
          {rideMode.type === 'quick'
            ? `Quick Ride · ${rideMode.groupId}`
            : `Trip · ${rideMode.trip.title}`}
        </Text>
      </View>
      <TouchableOpacity style={styles.rideStripEnd} onPress={onEndRide}>
        <Ionicons name="stop-circle-outline" size={18} color="#FF5252" />
        <Text style={styles.rideStripEndText}>End</Text>
      </TouchableOpacity>
    </View>
  );
});

interface SearchResultsProps {
  visible: boolean;
  results: PlacePrediction[];
  onSelect: (prediction: PlacePrediction) => void;
}

export const SearchResults = memo(({ visible, results, onSelect }: SearchResultsProps) => {
  if (!visible || results.length === 0) return null;

  return (
    <View style={styles.searchResultsContainer}>
      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {results.map((item, index) => (
          <TouchableOpacity
            key={item.place_id}
            style={[styles.searchResultItem, index < results.length - 1 && styles.searchResultBorder]}
            onPress={() => onSelect(item)}
          >
            <Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 12 }} />
            <View style={styles.searchResultTextContainer}>
              <Text style={styles.searchResultMain} numberOfLines={1}>{item.structured_formatting.main_text}</Text>
              <Text style={styles.searchResultSecondary} numberOfLines={1}>{item.structured_formatting.secondary_text}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const SEARCH_BAR_HEIGHT = 48;

const styles = StyleSheet.create({
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: SEARCH_BAR_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    height: SEARCH_BAR_HEIGHT,
    paddingVertical: 0,
    ...Platform.select({
      ios: { lineHeight: 20 },
    }),
  },
  connectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectionText: { color: 'white', fontSize: 11, fontWeight: '700' },
  rideStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 14, marginTop: 8, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  rideStripLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  rideDot: { width: 8, height: 8, borderRadius: 4 },
  rideStripLabel: { fontSize: 13, fontWeight: '600', color: '#212121', flex: 1 },
  rideStripEnd: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 12 },
  rideStripEndText: { fontSize: 13, fontWeight: '700', color: '#FF5252' },
  searchResultsContainer: {
    backgroundColor: 'white', borderRadius: 16, marginTop: 6, maxHeight: 260,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, overflow: 'hidden',
  },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  searchResultBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  searchResultTextContainer: { flex: 1 },
  searchResultMain: { fontSize: 15, fontWeight: '600', color: '#212121' },
  searchResultSecondary: { fontSize: 12, color: '#757575', marginTop: 2 },
});
