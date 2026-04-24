import CalendarBottomSheet from '@/components/explore/CalendarBottomSheet';
import { TripCard } from '@/components/explore/TripCard';
import TripFilterForm from '@/components/explore/TripFilterForm';
import { BottomSheet } from '@/components/ui';
import { useFilterTrips, type TripFilterParams } from '@/hooks/api/useTrips';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const mapTripToJourney = (trip: any) => ({
  id: trip._id || trip.id,
  title: trip.title,
  featured: false,
  isRecommended: false,
  createdDate: new Date(trip.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
  departure: {
    code: trip.startLocation?.name?.substring(0, 3).toUpperCase() ?? '---',
    location: trip.startLocation?.name ?? 'Unknown',
    dateTime: new Date(trip.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  },
  arrival: {
    code: trip.destination?.name?.substring(0, 3).toUpperCase() ?? '---',
    location: trip.destination?.name ?? 'Unknown',
    dateTime: new Date(trip.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  },
  duration: (() => {
    const ms = new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return `${days}d`;
  })(),
  description: trip.description,
});

export default function SearchTripsScreen() {
  const [userCity, setUserCity] = useState<string | null>(null);

  // ─── Filter-sheet local form state ──────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calOpen, setCalOpen] = useState(false);
  const [calMode, setCalMode] = useState<'start' | 'end'>('start');

  // ─── Active query params (drives useFilterTrips) ────────
  // Starts with recommended-by-city once location resolves.
  const [activeParams, setActiveParams] = useState<TripFilterParams | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const results = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (cancelled) return;
        const city = results?.[0]?.city || results?.[0]?.subregion || results?.[0]?.region;
        if (city) {
          setUserCity(city);
          setActiveParams((prev) => prev ?? { from: city });
        }
      } catch (e) {
        console.warn('[Search] Location lookup failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { data, isLoading, error } = useFilterTrips(activeParams);
  const journeys = (data?.trips ?? []).map(mapTripToJourney);

  const applyFilters = useCallback(() => {
    setActiveParams({
      from: fromLocation || undefined,
      to: toLocation || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setFilterOpen(false);
  }, [fromLocation, toLocation, startDate, endDate]);

  const clearFilters = useCallback(() => {
    setFromLocation('');
    setToLocation('');
    setStartDate('');
    setEndDate('');
    setActiveParams(userCity ? { from: userCity } : null);
    setFilterOpen(false);
  }, [userCity]);

  const hasCustomFilter =
    !!activeParams &&
    !(activeParams.from === userCity &&
      !activeParams.to &&
      !activeParams.startDate &&
      !activeParams.endDate);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Trips</Text>
        <View style={styles.roundButton} />
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {hasCustomFilter ? 'Search Results' : 'Recommended for you'}
            </Text>
            {!hasCustomFilter && userCity && (
              <Text style={styles.subtleText}>Trips from {userCity}</Text>
            )}
            {hasCustomFilter && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>✕ Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsText}>
              {isLoading ? '...' : `${journeys.length}`}
            </Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Searching trips…</Text>
          </View>
        )}

        {!isLoading && error && (
          <Text style={styles.subtleText}>Search failed. Please try again.</Text>
        )}

        {!isLoading && !error && journeys.length === 0 && (
          <Text style={styles.subtleText}>
            {hasCustomFilter
              ? 'No trips found for your filters.'
              : userCity
                ? `No trips from ${userCity} yet.`
                : 'Enable location or open filters to search.'}
          </Text>
        )}

        {journeys.map((journey: any) => (
          <TripCard key={journey.id} journey={journey} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating filter button */}
      <TouchableOpacity
        style={styles.fabFilter}
        onPress={() => setFilterOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabFilterText}>⚙  Filter</Text>
      </TouchableOpacity>

      {/* Filter bottom sheet */}
      <BottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        snapPoints={['75%']}
        scrollable
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.sheetClear}>Reset</Text>
          </TouchableOpacity>
        </View>
        <TripFilterForm
          fromLocation={fromLocation}
          setFromLocation={setFromLocation}
          toLocation={toLocation}
          setToLocation={setToLocation}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onDatePress={(mode) => {
            setCalMode(mode);
            setCalOpen(true);
          }}
          onSearch={applyFilters}
          isSearchLoading={isLoading}
        />
      </BottomSheet>

      <CalendarBottomSheet
        visible={calOpen}
        onClose={() => setCalOpen(false)}
        mode={calMode}
        startDate={startDate}
        endDate={endDate}
        onSelectDate={(mode, dateString) => {
          if (mode === 'start') {
            setStartDate(dateString);
            if (endDate && endDate < dateString) setEndDate('');
          } else {
            setEndDate(dateString);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '800',
    color: '#1e293b',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
  },
  resultsBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  resultsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  fabFilter: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabFilterText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetClear: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});
