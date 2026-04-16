import CalendarBottomSheet from '@/components/explore/CalendarBottomSheet';
import { TripCard } from '@/components/explore/TripCard';
import TripFilterForm from '@/components/explore/TripFilterForm';
import { JOURNEYS } from '@/dummy-data/journeys';
import { useCreateTrip, useFilterTrips, useTrips, type TripFilterParams } from '@/hooks/api/useTrips';
import type { CreateTripRequest } from '@/types/api';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

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
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const expansionAnim = useRef(new Animated.Value(1)).current; // 1 = Expanded, 0 = Collapsed

  // ─── Header search filter state ──────────────────────
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [searchCalMode, setSearchCalMode] = useState<'start' | 'end'>('start');
  const [searchCalOpen, setSearchCalOpen] = useState(false);

  // ─── API hooks ──────────────────────────────────────────
  // activeFilterParams drives useFilterTrips — null = idle (show user's own trips)
  const [activeFilterParams, setActiveFilterParams] = useState<TripFilterParams | null>(null);

  const {
    data: tripsResponse,
    isLoading: isLoadingMyTrips,
    error: tripsError,
    refetch,
  } = useTrips();

  const {
    data: filterResponse,
    isLoading: isLoadingFilter,
    error: filterError,
  } = useFilterTrips(activeFilterParams);

  const createTripMutation = useCreateTrip();

  const isLoading = activeFilterParams ? isLoadingFilter : isLoadingMyTrips;
  const isFilterActive = activeFilterParams !== null;

  /**
   * When a filter is active: show filtered results.
   * Otherwise: show the user's own trips, falling back to dummy data.
   */
  const journeys = (() => {
    if (isFilterActive) {
      const filtered = filterResponse?.trips ?? [];
      return filtered.map(mapTripToJourney);
    }
    const apiTrips = (tripsResponse as any)?.trips;
    return apiTrips && apiTrips.length > 0 ? apiTrips.map(mapTripToJourney) : JOURNEYS;
  })();

  const handleSearch = useCallback(() => {
    // At least one field must be filled before firing the query
    if (!searchFrom && !searchTo && !searchStart) return;
    setActiveFilterParams({
      from: searchFrom || undefined,
      to: searchTo || undefined,
      startDate: searchStart || undefined,
      endDate: searchEnd || undefined,
    });
  }, [searchFrom, searchTo, searchStart, searchEnd]);

  const clearFilter = useCallback(() => {
    setActiveFilterParams(null);
  }, []);

  /**
   * Create a new trip via the API.
   * Call this from your "Create Trip" UI flow.
   */
  const handleCreateTrip = useCallback(
    (tripData: CreateTripRequest) => {
      createTripMutation.mutate(tripData, {
        onSuccess: (newTrip) => {
          Alert.alert('Trip Created', `"${newTrip.title}" has been created!`);
        },
        onError: (err) => {
          Alert.alert('Error', err.message || 'Failed to create trip');
        },
      });
    },
    [createTripMutation]
  );

  useEffect(() => {
    Animated.spring(expansionAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false, // Height and padding don't support native driver
      friction: 8,
      tension: 40,
    }).start();
  }, [isExpanded]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 40 && isExpanded) {
          setIsExpanded(false);
        } else if (offsetY < 10 && !isExpanded) {
          setIsExpanded(true);
        }
      },
    }
  );

  const toggleHeader = () => setIsExpanded(!isExpanded);

  // Animated styles
  const headerHeight = expansionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [70, 320],
  });

  const contentOpacity = expansionAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: [0, 1],
  });

  const summaryOpacity = expansionAnim.interpolate({
    inputRange: [0, 0.7],
    outputRange: [1, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.roundButton}>
            <Text style={styles.buttonText}>IC</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleHeader} 
            activeOpacity={1}
            style={styles.headerTitleContainer}
          >
            <Animated.View style={[styles.titleAbsolute, { opacity: summaryOpacity }]}>
              <Text style={styles.collapsedTitle}>SF to LA</Text>
              <Text style={styles.collapsedSub}>Oct 20 - Oct 25</Text>
            </Animated.View>
            
            <Animated.View style={{ opacity: contentOpacity }}>
              <Text style={styles.expandedTitle}>Search Journeys</Text>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundButton}>
            <Text style={styles.buttonText}>IC</Text>
          </TouchableOpacity>
        </View>
        <TripFilterForm
          fromLocation={searchFrom}
          setFromLocation={setSearchFrom}
          toLocation={searchTo}
          setToLocation={setSearchTo}
          startDate={searchStart}
          setStartDate={setSearchStart}
          endDate={searchEnd}
          setEndDate={setSearchEnd}
          onDatePress={(mode) => {
            setSearchCalMode(mode);
            setSearchCalOpen(true);
          }}
          onSearch={handleSearch}
          isSearchLoading={isLoadingFilter}
        />

        <TouchableOpacity onPress={toggleHeader} style={styles.handleArea}>
          <View style={styles.handle} />
          <Animated.Text style={[styles.chevron, { transform: [{ rotate: expansionAnim.interpolate({ inputRange: [0,1], outputRange: ['0deg', '180deg'] }) }] }]}>IC</Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {isFilterActive ? 'Search Results' : 'My Journeys'}
            </Text>
            {isFilterActive && (
              <TouchableOpacity onPress={clearFilter}>
                <Text style={styles.clearFilterText}>✕ Clear filter</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.resultsBadge}>
            <Text style={styles.resultsText}>
              {isLoading ? '...' : `${journeys.length} RESULTS`}
            </Text>
          </View>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>
              {isFilterActive ? 'Searching trips...' : 'Loading trips...'}
            </Text>
          </View>
        )}

        {/* Error state */}
        {(tripsError || filterError) && !isLoading && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {filterError
                ? 'Search failed. Please try again.'
                : 'Failed to load trips. Showing saved journeys.'}
            </Text>
            <TouchableOpacity
              onPress={() => (isFilterActive ? handleSearch() : refetch())}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state for filter with no results */}
        {isFilterActive && !isLoading && !filterError && journeys.length === 0 && (
          <View style={styles.centeredContainer}>
            <Text style={styles.loadingText}>No trips found for your search.</Text>
            <TouchableOpacity onPress={clearFilter} style={[styles.retryButton, { marginTop: 12 }]}>
              <Text style={styles.retryText}>Show my trips</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Trip cards */}
        {!isLoading &&
          journeys.map((journey: any) => (
            <TripCard key={journey.id} journey={journey} />
          ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      <TouchableOpacity
        style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0f172a', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => router.push('/tripForm')}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ position: 'absolute', bottom: 80, right: 20, backgroundColor: '#0f172a', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => router.push('/profile')}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>P</Text>
      </TouchableOpacity>
      <CalendarBottomSheet
        visible={searchCalOpen}
        onClose={() => setSearchCalOpen(false)}
        mode={searchCalMode}
        startDate={searchStart}
        endDate={searchEnd}
        onSelectDate={(mode, dateString) => {
          if (mode === 'start') {
            setSearchStart(dateString);
            if (searchEnd && searchEnd < dateString) setSearchEnd('');
          } else {
            setSearchEnd(dateString);
          }
        }}
      />
    </SafeAreaView>
  );
};

const NavItem: React.FC<{ label: string, icon: string, active?: boolean }> = ({ label, icon, active }) => (
  <TouchableOpacity style={styles.navItem}>
    <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 100,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 60,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  titleAbsolute: {
    position: 'absolute',
    alignItems: 'center',
  },
  collapsedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  collapsedSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  expandedContent: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  inputGroup: {
    gap: 8,
    position: 'relative',
  },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
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
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
    outlineStyle: 'none',
  } as any,
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
  },
  swapIcon: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
  inputIconSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#cbd5e1',
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
  handleArea: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 2,
  },
  chevron: {
    fontSize: 10,
    fontWeight: '900',
    color: '#cbd5e1',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  navActive: {
    color: '#000',
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
  },
  retryButton: {
    marginLeft: 12,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

export default App;
