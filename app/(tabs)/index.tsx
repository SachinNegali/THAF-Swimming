import { TripCard } from '@/components/explore/TripCard';
import { JOURNEYS } from '@/dummy-data/journeys';
import { useFilterTrips, useTrips } from '@/hooks/api/useTrips';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
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

const App: React.FC = () => {
  const [userCity, setUserCity] = useState<string | null>(null);

  // ─── Request location on mount to power "Recommended for you" ─────────
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
        if (city) setUserCity(city);
      } catch (e) {
        console.warn('[Home] Location lookup failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── My Trips ─────────────────────────────────────────
  const { data: tripsResponse, isLoading: isLoadingMyTrips } = useTrips();
  const myTrips = (() => {
    const apiTrips = (tripsResponse as any)?.trips;
    return apiTrips && apiTrips.length > 0 ? apiTrips.map(mapTripToJourney) : [];
  })();

  // ─── Recommended for you (city-based) ─────────────────
  const {
    data: recommendedResponse,
    isLoading: isLoadingRecommended,
  } = useFilterTrips(userCity ? { from: userCity } : null);
  const recommended = (() => {
    const trips = recommendedResponse?.trips ?? [];
    return trips.length > 0 ? trips.map(mapTripToJourney) : [];
  })();

  const showDummyFallback = !isLoadingMyTrips && myTrips.length === 0 && recommended.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.roundButton}>
          <Text style={styles.buttonText}>IC</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Journeys</Text>

        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => router.push('/searchTrips')}
        >
          <Text style={styles.buttonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── My Trips ──────────────────────────────── */}
        {myTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>My Trips</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsText}>{myTrips.length}</Text>
              </View>
            </View>
            {myTrips.map((journey: any) => (
              <TripCard key={`mine-${journey.id}`} journey={journey} />
            ))}
          </View>
        )}

        {/* ── Recommended for you ───────────────────── */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recommended for you</Text>
              {userCity && (
                <Text style={styles.subtleText}>Trips from {userCity}</Text>
              )}
            </View>
            {recommended.length > 0 && (
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsText}>{recommended.length}</Text>
              </View>
            )}
          </View>

          {isLoadingRecommended && (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.loadingText}>Finding trips near you…</Text>
            </View>
          )}

          {!isLoadingRecommended && !userCity && (
            <Text style={styles.subtleText}>
              Enable location to see trips starting from your city.
            </Text>
          )}

          {!isLoadingRecommended && userCity && recommended.length === 0 && (
            <Text style={styles.subtleText}>No trips from {userCity} yet.</Text>
          )}

          {recommended.map((journey: any) => (
            <TripCard key={`rec-${journey.id}`} journey={journey} />
          ))}
        </View>

        {/* Fallback dummy content when nothing is available */}
        {showDummyFallback && !isLoadingRecommended && (
          <View style={styles.section}>
            {JOURNEYS.map((journey: any) => (
              <TripCard key={`dummy-${journey.id}`} journey={journey} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fabCreate}
        onPress={() => router.push('/tripForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fabProfile}
        onPress={() => router.push('/profile')}
      >
        <Text style={styles.fabText}>P</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
  section: {
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  fabCreate: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0f172a',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabProfile: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#0f172a',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default App;
