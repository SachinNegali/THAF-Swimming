import { PlacePrediction, usePlacesSearch } from '@/hooks/usePlacesSearch';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

// ─── Types ──────────────────────────────────────────────
export interface SelectedPlace {
  name: string;
  lat: number;
  lng: number;
}

export interface TripFilterFormProps {
  fromLocation: string;
  setFromLocation: (v: string) => void;
  toLocation: string;
  setToLocation: (v: string) => void;
  startDate: string; // ISO date string (YYYY-MM-DD)
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  /** Called when a date field is tapped — parent should open CalendarBottomSheet */
  onDatePress: (mode: 'start' | 'end') => void;
  /** Called when a FROM place is selected from autocomplete */
  onFromPlaceSelected?: (place: SelectedPlace) => void;
  /** Called when a TO place is selected from autocomplete */
  onToPlaceSelected?: (place: SelectedPlace) => void;
  /**
   * When provided, renders a "Search" button at the bottom and calls this on press.
   * NOT passed from tripForm — so tripForm behaviour is completely unchanged.
   */
  onSearch?: () => void;
  /** Shows a loading spinner on the search button while the query is in-flight. */
  isSearchLoading?: boolean;
}

const formatDate = (iso: string): string => {
  if (!iso) return 'Select date';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function TripFilterForm({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onDatePress,
  onFromPlaceSelected,
  onToPlaceSelected,
  onSearch,
  isSearchLoading = false,
}: TripFilterFormProps) {
  // ── Two separate search instances ─────────────────────
  const fromSearch = usePlacesSearch();
  const toSearch = usePlacesSearch();

  // ── FROM field handlers ───────────────────────────────
  const handleFromTextChange = useCallback(
    (text: string) => {
      setFromLocation(text);
      fromSearch.onSearchTextChange(text);
    },
    [setFromLocation, fromSearch.onSearchTextChange],
  );

  const handleFromSelect = useCallback(
    async (prediction: PlacePrediction) => {
      Keyboard.dismiss();
      const details = await fromSearch.selectPlace(prediction);
      const name = prediction.structured_formatting.main_text;
      setFromLocation(name);
      if (details && onFromPlaceSelected) {
        onFromPlaceSelected({ name: details.name || name, lat: details.lat, lng: details.lng });
      }
    },
    [fromSearch.selectPlace, setFromLocation, onFromPlaceSelected],
  );

  // ── TO field handlers ─────────────────────────────────
  const handleToTextChange = useCallback(
    (text: string) => {
      setToLocation(text);
      toSearch.onSearchTextChange(text);
    },
    [setToLocation, toSearch.onSearchTextChange],
  );

  const handleToSelect = useCallback(
    async (prediction: PlacePrediction) => {
      Keyboard.dismiss();
      const details = await toSearch.selectPlace(prediction);
      const name = prediction.structured_formatting.main_text;
      setToLocation(name);
      if (details && onToPlaceSelected) {
        onToPlaceSelected({ name: details.name || name, lat: details.lat, lng: details.lng });
      }
    },
    [toSearch.selectPlace, setToLocation, onToPlaceSelected],
  );

  console.log("onSearch...", onSearch)
  return (
    <View>
      {/* FROM / TO */}
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          {/* ── FROM ──────────────────────────────────── */}
          <View style={styles.locationWrapper}>
            <Text style={styles.inputLabel}>FROM</Text>
            <View style={styles.inputInner}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Starting city"
                placeholderTextColor="#94a3b8"
                value={fromLocation}
                onChangeText={handleFromTextChange}
                onFocus={() => {
                  if (fromSearch.searchResults.length > 0) fromSearch.setShowSearchResults(true);
                }}
              />
              {fromSearch.isSearching && <ActivityIndicator size="small" color="#2196F3" />}
              {fromLocation.length > 0 && !fromSearch.isSearching && (
                <TouchableOpacity onPress={() => { setFromLocation(''); fromSearch.clearSearch(); }}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* FROM autocomplete dropdown */}
            {fromSearch.showSearchResults && fromSearch.searchResults.length > 0 && (
              <View style={styles.dropdownContainer}>
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.dropdownScroll}>
                  {fromSearch.searchResults.map((item, index) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={[styles.dropdownItem, index < fromSearch.searchResults.length - 1 && styles.dropdownBorder]}
                      onPress={() => handleFromSelect(item)}
                    >
                      <Text style={styles.dropdownIcon}>📍</Text>
                      <View style={styles.dropdownTextContainer}>
                        <Text style={styles.dropdownMain} numberOfLines={1}>{item.structured_formatting.main_text}</Text>
                        <Text style={styles.dropdownSecondary} numberOfLines={1}>{item.structured_formatting.secondary_text}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.swapButtonWrapper}>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const tmp = fromLocation;
                setFromLocation(toLocation);
                setToLocation(tmp);
              }}
            >
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* ── TO ────────────────────────────────────── */}
          <View style={styles.locationWrapper}>
            <Text style={styles.inputLabel}>TO</Text>
            <View style={styles.inputInner}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Destination city"
                placeholderTextColor="#94a3b8"
                value={toLocation}
                onChangeText={handleToTextChange}
                onFocus={() => {
                  if (toSearch.searchResults.length > 0) toSearch.setShowSearchResults(true);
                }}
              />
              {toSearch.isSearching && <ActivityIndicator size="small" color="#2196F3" />}
              {toLocation.length > 0 && !toSearch.isSearching && (
                <TouchableOpacity onPress={() => { setToLocation(''); toSearch.clearSearch(); }}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* TO autocomplete dropdown */}
            {toSearch.showSearchResults && toSearch.searchResults.length > 0 && (
              <View style={styles.dropdownContainer}>
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.dropdownScroll}>
                  {toSearch.searchResults.map((item, index) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={[styles.dropdownItem, index < toSearch.searchResults.length - 1 && styles.dropdownBorder]}
                      onPress={() => handleToSelect(item)}
                    >
                      <Text style={styles.dropdownIcon}>📍</Text>
                      <View style={styles.dropdownTextContainer}>
                        <Text style={styles.dropdownMain} numberOfLines={1}>{item.structured_formatting.main_text}</Text>
                        <Text style={styles.dropdownSecondary} numberOfLines={1}>{item.structured_formatting.secondary_text}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => onDatePress('start')}
          >
            <Text style={styles.labelMicro}>DEPARTURE</Text>
            <View style={styles.dateValueRow}>
              <Text
                style={[
                  styles.dateValue,
                  !startDate && styles.datePlaceholder,
                ]}
              >
                {formatDate(startDate)}
              </Text>
              <Text style={styles.inputIconSmall}>📅</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => startDate ? onDatePress('end') : ToastAndroid.show("Please select departure date first", ToastAndroid.SHORT)}
          >
            <Text style={styles.labelMicro}>RETURN</Text>
            <View style={styles.dateValueRow}>
              <Text
                style={[
                  styles.dateValue,
                  !endDate && styles.datePlaceholder,
                ]}
              >
                {formatDate(endDate)}
              </Text>
              <Text style={styles.inputIconSmall}>📅</Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* <View style={styles.pillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {DATE_OPTIONS.map((opt) => (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.pill, opt.isActive && styles.pillActive]}
              >
                {opt.id === '1' && <Text style={[styles.pillText, opt.isActive && styles.pillTextActive, {marginRight: 4}]}>IC</Text>}
                <Text style={[styles.pillText, opt.isActive && styles.pillTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View> */}
      </View>

      {/* Search button — only rendered in filter/discovery mode, not in trip creation */}
      {onSearch && (
        <View style={styles.searchButtonSection}>
          <TouchableOpacity
            style={[styles.searchButton, isSearchLoading && styles.searchButtonLoading]}
            onPress={onSearch}
            disabled={isSearchLoading}
            activeOpacity={0.8}
          >
            {isSearchLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search Trips</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  inputGroup: {
    gap: 8,
    position: 'relative',
  },
  locationWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  swapButtonWrapper: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swapIcon: {
    fontSize: 14,
  },
  // ── Dropdown ──────────────────────────────────────────
  dropdownContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dropdownBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  dropdownIcon: {
    fontSize: 14,
    marginRight: 12,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownSecondary: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  // ── Dates ─────────────────────────────────────────────
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  dateValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  datePlaceholder: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  inputIconSmall: {
    fontSize: 14,
  },
  labelMicro: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  pillsContainer: {
    marginTop: 16,
    paddingBottom: 4,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pillTextActive: {
    color: '#fff',
  },
  searchButtonSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchButton: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonLoading: {
    opacity: 0.7,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
