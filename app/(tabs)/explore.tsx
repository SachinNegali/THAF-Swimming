import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { useLocalSearchParams } from 'expo-router';
import { MapFAB, QuickActionsSheet, RidersBottomSheet } from '../../components/ride';
import { Buddy } from '../../components/ride/types';
import { useTrip, useTrips, useUpdateTrip } from '../../hooks/api/useTrips';
import { useTracking } from '../../hooks/useTracking';
import { objectIdToNumericId } from '../../services/tracking/binaryProtocol';
import { useAppSelector } from '../../store/hooks';
import { selectAccessToken, selectUser } from '../../store/selectors';
import { Trip } from '../../types/api';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyBIaPQX7NEd3CBNIbRw93kKG890LPyXcWs';

// ─── Config ──────────────────────────────────────────────
const TRACKING_WS_URL = 'wss://api.tankhalfull.com/tracking';
const BUDDY_API_BASE = 'https://api.tankhalfull.com/v1';

// ─── Ride Mode ───────────────────────────────────────────
/**
 * Describes how the current tracking session was initiated.
 *
 * none  — tracking is off; show "Start Ride" prompt.
 * quick — ephemeral session; groupId is a random short ID generated on device.
 * trip  — formal trip from the backend; groupId = trip.id.
 */
type RideMode =
  | { type: 'none' }
  | { type: 'quick'; groupId: string }
  | { type: 'trip'; trip: Trip };

type RouteMode = 'motorcycle' | 'driving' | 'bicycling' | 'walking';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

interface TrafficSegment {
  coordinates: { latitude: number; longitude: number }[];
  color: string;
}

const TRAFFIC_COLORS = {
  NORMAL: '#34A853',
  SLOW: '#FBBC04',
  TRAFFIC_JAM: '#EA4335',
} as const;

// ─── Buddy Marker (memoized to avoid flicker) ────────────
const BuddyMarkerView = React.memo(({ buddy }: { buddy: Buddy }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'walking':  return 'walking';
      case 'driving':  return 'car';
      case 'cycling':  return 'bicycle';
      default:         return 'map-marker-alt';
    }
  };

  return (
    <View style={styles.buddyMarker}>
      <Image source={{ uri: buddy.avatar }} style={styles.buddyAvatar} />
      <View style={[styles.statusBadge, {
        backgroundColor:
          buddy.status === 'walking' ? '#4CAF50' :
          buddy.status === 'driving' ? '#2196F3' : '#FF9800',
      }]}>
        <FontAwesome5 name={getStatusIcon(buddy.status)} size={8} color="white" />
      </View>
    </View>
  );
});

// ─── Helper: status code → human label ───────────────────
function trackingStatusLabel(code: number): string {
  switch (code) {
    case 0: return 'stationary';
    case 1: return 'driving';
    case 2: return 'paused';
    case 3: return 'SOS';
    default: return 'unknown';
  }
}

// ─── Main Component ──────────────────────────────────────
export default function BuddyMapExpo() {
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Deep link params (notification tap / "Start Trip" button / QR scan) ──
  const { tripId: deepLinkTripId, startRide } = useLocalSearchParams<{ tripId?: string; startRide?: string }>();

  // ─── Auth state ──────────────────────────────────────
  const accessToken = useAppSelector(selectAccessToken);
  const user = useAppSelector(selectUser);
  const numericUserId = useMemo(
    () => (user?._id ? objectIdToNumericId(user._id) : 0),
    [user?._id],
  );

  // ─── Ride mode ───────────────────────────────────────
  const [rideMode, setRideMode] = useState<RideMode>({ type: 'none' });

  // Resolved groupId — the single value fed into useTracking
  const trackingGroupId = useMemo<string | null>(() => {
    if (rideMode.type === 'trip')  return rideMode.trip.id;
    if (rideMode.type === 'quick') return rideMode.groupId;
    return null;
  }, [rideMode]);

  // ─── Start trip API (organiser only — notifies all participants) ─────────
  const updateTrip = useUpdateTrip();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (startRide === '1' && deepLinkTripId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      // PATCH trip → status: 'active' — backend sends push notifications to all participants
      updateTrip.mutate(
        { id: deepLinkTripId, data: { status: 'active' } as any },
        { onError: (err) => console.warn('[Explore] Failed to start trip:', err.message) }
      );
    }
  }, [startRide, deepLinkTripId]);

  // ─── Deep link: auto-join when opened via notification/QR ─
  // Fetch trip only when we have a tripId param and aren't already in a session
  const { data: deepLinkTrip } = useTrip(
    deepLinkTripId ?? '',
    !!deepLinkTripId && rideMode.type === 'none',
  );

  useEffect(() => {
    if (deepLinkTrip && rideMode.type === 'none') {
      // User explicitly tapped notification / scanned QR — auto-enter, no prompt
      setRideMode({ type: 'trip', trip: deepLinkTrip });
    }
  }, [deepLinkTrip]);

  // ─── Active trip detection (background polling) ──────
  const { data: activeTripsData } = useTrips({
    status: 'active',
  } as any);
  const serverActiveTrip = activeTripsData?.data?.[0] ?? null;

  // Track previous active trip ID so we only prompt once per new active trip
  const prevActiveTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!serverActiveTrip) {
      prevActiveTripIdRef.current = null;
      return;
    }
    // Only prompt if this is a newly-detected active trip
    if (
      serverActiveTrip.id !== prevActiveTripIdRef.current &&
      rideMode.type === 'none' &&
      !deepLinkTripId  // don't double-prompt if we already auto-joined via deep link
    ) {
      prevActiveTripIdRef.current = serverActiveTrip.id;
      Alert.alert(
        'Trip Started!',
        `"${serverActiveTrip.title}" has started. Join your buddies on the map?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Join Now',
            onPress: () => setRideMode({ type: 'trip', trip: serverActiveTrip }),
          },
        ]
      );
    } else if (serverActiveTrip.id !== prevActiveTripIdRef.current) {
      // Update the ref even if we can't show the alert (already in a ride)
      prevActiveTripIdRef.current = serverActiveTrip.id;
    }
  }, [serverActiveTrip?.id]);

  // ─── Ride actions ────────────────────────────────────
  const startQuickRide = useCallback(async () => {
    const uuid = await Crypto.randomUUID();
    // Use last 8 chars of the first UUID segment — short & unique enough for a ride
    const groupId = 'QR-' + uuid.split('-')[0].toUpperCase();
    setRideMode({ type: 'quick', groupId });
  }, []);

  const startTripRide = useCallback((trip: Trip) => {
    setRideMode({ type: 'trip', trip });
  }, []);

  const endRide = useCallback(() => {
    setRideMode({ type: 'none' });
  }, []);

  // ─── Tracking hook ──────────────────────────────────
  const {
    isConnected,
    isPolling,
    peerLocations,
    myLocation,
    groupSize,
    error: trackingError,
  } = useTracking({
    wsUrl: TRACKING_WS_URL,
    accessToken: accessToken ?? '',
    groupId: trackingGroupId ?? '',
    numericUserId,
    updateIntervalMs: 2000,
    enabled: !!accessToken && !!user && !!trackingGroupId,
  });

  // Derive user coords from tracking hook
  const location = useMemo(
    () => myLocation?.coords ?? null,
    [myLocation],
  );

  // ─── Buddy profile cache ───────────────────────────
  const buddyProfileCache = useRef<Map<number, Buddy>>(new Map());

  const fetchBuddyProfile = useCallback(async (peerId: string): Promise<Buddy | null> => {
    try {
      const res = await fetch(`${BUDDY_API_BASE}/buddy/${peerId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: data._id ?? peerId,
        numericId: objectIdToNumericId(data._id ?? peerId),
        name: data.name ?? `Rider`,
        avatar: data.imageUrl ?? `https://i.pravatar.cc/150?u=${peerId}`,
        latitude: 0,
        longitude: 0,
        status: 'driving',
        battery: 100,
        lastSeen: 'just now',
      };
    } catch {
      return null;
    }
  }, [accessToken]);

  // ─── Build buddies array from live peers ────────────
  const [buddies, setBuddies] = useState<Buddy[]>([]);

  useEffect(() => {
    let cancelled = false;

    const buildBuddies = async () => {
      const result: Buddy[] = [];

      for (const [numId, peer] of peerLocations) {
        if (numId === numericUserId) continue;

        let profile = buddyProfileCache.current.get(numId);
        if (!profile) {
          const fetched = await fetchBuddyProfile(String(numId));
          if (fetched) {
            buddyProfileCache.current.set(numId, fetched);
            profile = fetched;
          }
        }

        const timeDiff = Date.now() - peer.receivedAt;
        const lastSeen =
          timeDiff < 5_000  ? 'just now' :
          timeDiff < 60_000 ? `${Math.round(timeDiff / 1000)}s ago` :
                              `${Math.round(timeDiff / 60_000)}m ago`;

        result.push({
          id: profile?.id ?? String(numId),
          numericId: numId,
          name: profile?.name ?? `Rider ${numId}`,
          avatar: profile?.avatar ?? `https://i.pravatar.cc/150?u=${numId}`,
          latitude: peer.lat,
          longitude: peer.lng,
          speed: peer.speed,
          bearing: peer.bearing,
          status: trackingStatusLabel(peer.status),
          battery: profile?.battery ?? 100,
          lastSeen,
        });
      }

      if (!cancelled) setBuddies(result);
    };

    buildBuddies();
    return () => { cancelled = true; };
  }, [peerLocations, numericUserId, fetchBuddyProfile]);

  // ─── UI state ──────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null);
  const [heading, setHeading] = useState(0);
  const [routeMode, setRouteMode] = useState<RouteMode>('motorcycle');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [trafficSegments, setTrafficSegments] = useState<TrafficSegment[]>([]);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isRidersOpen, setIsRidersOpen] = useState(false);

  // Update heading from myLocation
  useEffect(() => {
    if (myLocation?.coords.heading) setHeading(myLocation.coords.heading);
  }, [myLocation]);

  // Follow camera while navigating
  useEffect(() => {
    if (isNavigating && location && mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude: location.latitude, longitude: location.longitude },
        heading: location.heading ?? 0,
        pitch: 60,
        zoom: 18,
      });
    }
  }, [isNavigating, location]);

  // ─── Distance helper ───────────────────────────────
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  };

  // ─── Places Search ─────────────────────────────────
  const searchPlaces = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      setIsSearching(true);
      try {
        const bias = location ? `&location=${location.latitude},${location.longitude}&radius=50000` : '';
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}${bias}&components=country:in`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.predictions) {
          setSearchResults(data.predictions.slice(0, 5));
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [location],
  );

  const onSearchTextChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (!text.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      searchTimeoutRef.current = setTimeout(() => searchPlaces(text), 300);
    },
    [searchPlaces],
  );

  const selectPlace = useCallback(
    async (prediction: PlacePrediction) => {
      Keyboard.dismiss();
      setSearchQuery(prediction.structured_formatting.main_text);
      setShowSearchResults(false);
      setSearchResults([]);
      setIsLoadingRoute(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,name&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.result?.geometry?.location) {
          const { lat, lng } = data.result.geometry.location;
          const dest = { latitude: lat, longitude: lng };
          setDestination(dest);
          setDestinationName(data.result.name || prediction.structured_formatting.main_text);
          await fetchRoute(dest);
          if (mapRef.current && location) {
            mapRef.current.fitToCoordinates(
              [{ latitude: location.latitude, longitude: location.longitude }, dest],
              { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true },
            );
          }
        } else {
          Alert.alert('Error', 'Could not find that place');
        }
      } catch {
        Alert.alert('Error', 'Failed to get place details');
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [location, routeMode],
  );

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setShowSearchResults(false);
    setIsSearching(true);
    Keyboard.dismiss();
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const dest = { latitude: lat, longitude: lng };
        setDestination(dest);
        setDestinationName(data.results[0].formatted_address || searchQuery);
        await fetchRoute(dest);
        if (mapRef.current && location) {
          mapRef.current.fitToCoordinates(
            [{ latitude: location.latitude, longitude: location.longitude }, dest],
            { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true },
          );
        }
      } else {
        Alert.alert('Not Found', 'Unable to find that location');
      }
    } catch {
      Alert.alert('Error', 'Failed to search for location');
    } finally {
      setIsSearching(false);
    }
  };

  // ─── Routing ───────────────────────────────────────
  const fetchRoute = async (dest: { latitude: number; longitude: number }) => {
    if (!location) { Alert.alert('Location Error', 'Unable to get your current location'); return; }
    setIsLoadingRoute(true);
    try {
      if (routeMode === 'motorcycle') await fetchRouteViaRoutesAPI(dest);
      else await fetchRouteViaDirectionsAPI(dest);
    } catch {
      generateStraightRoute(dest);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const fetchRouteViaRoutesAPI = async (dest: { latitude: number; longitude: number }) => {
    try {
      const body = {
        origin: { location: { latLng: { latitude: location!.latitude, longitude: location!.longitude } } },
        destination: { location: { latLng: { latitude: dest.latitude, longitude: dest.longitude } } },
        travelMode: 'TWO_WHEELER',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        languageCode: 'en',
        extraComputations: ['TRAFFIC_ON_POLYLINE'],
      };
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.travelAdvisory.speedReadingIntervals',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.routes?.length) {
        const route = data.routes[0];
        const points = decodePolyline(route.polyline.encodedPolyline);
        setRouteCoordinates(points);

        const speedIntervals = route.travelAdvisory?.speedReadingIntervals;
        if (speedIntervals?.length) {
          setTrafficSegments(
            speedIntervals.map((iv: any) => ({
              coordinates: points.slice(iv.startPolylinePointIndex || 0, (iv.endPolylinePointIndex || 0) + 1),
              color: TRAFFIC_COLORS[(iv.speed as keyof typeof TRAFFIC_COLORS) || 'NORMAL'] ?? TRAFFIC_COLORS.NORMAL,
            })),
          );
        } else {
          setTrafficSegments([]);
        }

        const m = route.distanceMeters || route.legs?.[0]?.distanceMeters || 0;
        setRouteDistance(m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

        const sec = parseInt((route.duration || route.legs?.[0]?.duration || '0s').replace('s', ''), 10);
        setRouteDuration(
          sec >= 3600
            ? `${Math.floor(sec / 3600)} hr ${Math.round((sec % 3600) / 60)} min`
            : `${Math.round(sec / 60)} min`,
        );
      } else {
        setTrafficSegments([]);
        await fetchRouteViaDirectionsAPI(dest);
      }
    } catch {
      setTrafficSegments([]);
      await fetchRouteViaDirectionsAPI(dest);
    }
  };

  const fetchRouteViaDirectionsAPI = async (dest: { latitude: number; longitude: number }) => {
    setTrafficSegments([]);
    const mode = routeMode === 'motorcycle' ? 'driving' : routeMode;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${location!.latitude},${location!.longitude}&destination=${dest.latitude},${dest.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.routes.length) {
      const route = data.routes[0];
      setRouteCoordinates(decodePolyline(route.overview_polyline.points));
      setRouteDistance(route.legs[0].distance.text);
      setRouteDuration(route.legs[0].duration.text);
    } else {
      generateStraightRoute(dest);
    }
  };

  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let idx = 0, lat = 0, lng = 0;
    while (idx < encoded.length) {
      let b, shift = 0, result = 0;
      do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : result >> 1;
      shift = 0; result = 0;
      do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : result >> 1;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const generateStraightRoute = (dest: { latitude: number; longitude: number }) => {
    if (!location) return;
    const pts = Array.from({ length: 21 }, (_, i) => ({
      latitude: location.latitude + (dest.latitude - location.latitude) * (i / 20),
      longitude: location.longitude + (dest.longitude - location.longitude) * (i / 20),
    }));
    setRouteCoordinates(pts);
    setRouteDistance(`${getDistance(location.latitude, location.longitude, dest.latitude, dest.longitude)} km`);
    setRouteDuration('~');
  };

  // ─── Map / Navigation actions ──────────────────────
  const handleMapPress = (e: any) => {
    if (isNavigating) return;
    setShowSearchResults(false);
    setSearchResults([]);
    const coord = e.nativeEvent.coordinate;
    setDestination(coord);
    setDestinationName('Dropped pin');
    setSearchQuery('');
    fetchRoute(coord);
  };

  const startNavigation = () => {
    if (!destination || !location) {
      Alert.alert('Select Destination', 'Tap on the map or search for a place to set your destination');
      return;
    }
    setIsNavigating(true);
    setSelectedBuddy(null);
    if (mapRef.current) {
      mapRef.current.animateCamera(
        { center: { latitude: location.latitude, longitude: location.longitude }, heading, pitch: 60, zoom: 18 },
        { duration: 800 },
      );
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setDestinationName('');
    setRouteCoordinates([]);
    setRouteDistance('');
    setRouteDuration('');
    setSelectedBuddy(null);
    setSearchQuery('');
    setTrafficSegments([]);
    if (mapRef.current && location) {
      mapRef.current.animateCamera(
        { center: { latitude: location.latitude, longitude: location.longitude }, heading: 0, pitch: 0, zoom: 15 },
        { duration: 600 },
      );
    }
  };

  const centerOnUser = () => {
    if (!location || !mapRef.current) return;
    if (isNavigating) {
      mapRef.current.animateCamera(
        { center: { latitude: location.latitude, longitude: location.longitude }, heading, pitch: 60, zoom: 18 },
        { duration: 500 },
      );
    } else {
      mapRef.current.animateToRegion({
        latitude: location.latitude, longitude: location.longitude,
        latitudeDelta: 0.01, longitudeDelta: 0.01,
      });
    }
  };

  const navigateToBuddy = useCallback(
    (buddy: Buddy) => {
      if (!location) { Alert.alert('Location Error', 'Unable to get your current location'); return; }
      const dest = { latitude: buddy.latitude, longitude: buddy.longitude };
      setDestination(dest);
      setDestinationName(buddy.name);
      fetchRoute(dest);
      setSelectedBuddy(buddy);
      setShowSearchResults(false);
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [{ latitude: location.latitude, longitude: location.longitude }, dest],
          { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true },
        );
      }
    },
    [location, routeMode],
  );

  const changeRouteMode = (mode: RouteMode) => {
    setRouteMode(mode);
    if (destination) fetchRoute(destination);
  };

  const clearDestination = () => {
    setDestination(null);
    setDestinationName('');
    setRouteCoordinates([]);
    setRouteDistance('');
    setRouteDuration('');
    setSelectedBuddy(null);
    setSearchQuery('');
    setTrafficSegments([]);
  };

  // ─── Render ────────────────────────────────────────
  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setErrorMsg(null)}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
        showsUserLocation={!isNavigating}
        showsMyLocationButton={false}
        showsCompass
        showsTraffic
        mapType="standard"
      >
        {/* Custom user marker in navigation mode */}
        {isNavigating && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={heading}
            tracksViewChanges
          >
            <View style={styles.userMarker}>
              <View style={styles.userPulse} />
              <View style={styles.userDot}>
                <MaterialIcons name="navigation" size={20} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {/* Buddy markers (live peers) */}
        {buddies.map((buddy) => (
          <Marker
            key={buddy.id}
            coordinate={{ latitude: buddy.latitude, longitude: buddy.longitude }}
            onPress={() => setSelectedBuddy(buddy)}
            tracksViewChanges={false}
          >
            <BuddyMarkerView buddy={buddy} />
            <Callout tooltip onPress={() => navigateToBuddy(buddy)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutName}>{buddy.name}</Text>
                <Text style={styles.calloutDistance}>
                  {getDistance(location.latitude, location.longitude, buddy.latitude, buddy.longitude)} km away
                </Text>
                {buddy.speed !== undefined && (
                  <Text style={styles.calloutStatus}>{buddy.speed} km/h</Text>
                )}
                <Text style={styles.calloutStatus}>Tap to navigate</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Destination marker */}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.destinationMarker}>
              <Ionicons name="location-sharp" size={40} color="#FF5252" />
              <View style={styles.destinationPulse} />
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {trafficSegments.length > 0 ? (
          <>
            <Polyline coordinates={routeCoordinates} strokeColor="rgba(0,0,0,0.15)" strokeWidth={10} lineCap="round" lineJoin="round" />
            {trafficSegments.map((seg, i) =>
              seg.coordinates.length >= 2 ? (
                <Polyline key={`traffic-${i}`} coordinates={seg.coordinates} strokeColor={seg.color} strokeWidth={6} lineCap="round" lineJoin="round" />
              ) : null,
            )}
          </>
        ) : routeCoordinates.length > 0 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={
              routeMode === 'motorcycle' ? '#FF6D00' :
              routeMode === 'driving' ? '#4285F4' :
              routeMode === 'bicycling' ? '#34A853' : '#FBBC04'
            }
            strokeWidth={6} lineCap="round" lineJoin="round"
          />
        ) : null}

        {/* Connection lines to nearby buddies */}
        {!isNavigating && buddies.map((buddy) => {
          const dist = parseFloat(getDistance(location.latitude, location.longitude, buddy.latitude, buddy.longitude));
          return dist < 0.5 ? (
            <Polyline
              key={`line-${buddy.id}`}
              coordinates={[
                { latitude: location.latitude, longitude: location.longitude },
                { latitude: buddy.latitude, longitude: buddy.longitude },
              ]}
              strokeColor="rgba(33, 150, 243, 0.3)"
              strokeWidth={2}
              lineDashPattern={[5, 5]}
            />
          ) : null;
        })}
      </MapView>

      {/* ─── Top Bar — Search ─── */}
      {!isNavigating && (
        <View style={styles.topBar}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destination..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={onSearchTextChange}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
              />
              {isSearching && <ActivityIndicator size="small" color="#2196F3" />}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Connection status badge */}
            <View style={[styles.connectionBadge, {
              backgroundColor:
                isConnected ? '#4CAF50' :
                isPolling   ? '#FF9800' :
                trackingError ? '#FF5252' : '#9E9E9E',
            }]}>
              <Text style={styles.connectionText}>
                {isConnected    ? `${groupSize} online` :
                 isPolling      ? 'polling' :
                 trackingError  ? 'error' : 'offline'}
              </Text>
            </View>
          </View>

          {/* Active ride strip — shows when a ride session is running */}
          {rideMode.type !== 'none' && (
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
              <TouchableOpacity style={styles.rideStripEnd} onPress={endRide}>
                <Ionicons name="stop-circle-outline" size={18} color="#FF5252" />
                <Text style={styles.rideStripEndText}>End</Text>
              </TouchableOpacity>
            </View>
          )}

          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={[styles.searchResultItem, index < searchResults.length - 1 && styles.searchResultBorder]}
                    onPress={() => selectPlace(item)}
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
          )}
        </View>
      )}

      {/* ─── Route Preview Panel ─── */}
      {destination && !isNavigating && (
        <View style={styles.routePreviewPanel}>
          <View style={styles.routePreviewHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routePreviewDestName} numberOfLines={1}>{destinationName || 'Selected location'}</Text>
              {routeDistance ? (
                <Text style={styles.routePreviewSubtext}>
                  {routeDistance}{routeDuration && routeDuration !== '~' ? ` • ${routeDuration}` : ''}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={clearDestination} style={styles.clearDestBtn}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.routeModeRow}>
            {(['motorcycle', 'driving', 'bicycling', 'walking'] as RouteMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.routeModeChip, routeMode === mode && styles.routeModeChipActive]}
                onPress={() => changeRouteMode(mode)}
              >
                <FontAwesome5
                  name={mode === 'motorcycle' ? 'motorcycle' : mode === 'driving' ? 'car' : mode === 'bicycling' ? 'bicycle' : 'walking'}
                  size={14}
                  color={routeMode === mode ? 'white' : '#666'}
                />
                <Text style={[styles.routeModeChipText, routeMode === mode && styles.routeModeChipTextActive]}>
                  {mode === 'motorcycle' ? 'Moto' : mode === 'driving' ? 'Car' : mode === 'bicycling' ? 'Bike' : 'Walk'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.startNavButton, isLoadingRoute && styles.startNavButtonDisabled]}
            onPress={startNavigation}
            disabled={isLoadingRoute}
          >
            {isLoadingRoute ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="navigation" size={22} color="white" />
                <Text style={styles.startNavButtonText}>Start Navigation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Navigation Mode Top Info ─── */}
      {isNavigating && (
        <View style={styles.navTopInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.navTopDestination} numberOfLines={1}>{destinationName || 'Destination'}</Text>
            <Text style={styles.navTopDetails}>
              {routeDistance}{routeDuration && routeDuration !== '~' ? ` • ${routeDuration}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.navStopButton} onPress={stopNavigation}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── No Ride Card — prompt to start a session ─── */}
      {rideMode.type === 'none' && !isNavigating && !destination && (
        <View style={styles.noRideCard}>
          <Text style={styles.noRideTitle}>Not in a ride</Text>
          <Text style={styles.noRideSubtitle}>Start sharing your location with buddies</Text>
          <View style={styles.noRideActions}>
            <TouchableOpacity style={styles.quickRideBtn} onPress={startQuickRide}>
              <Ionicons name="flash" size={16} color="white" />
              <Text style={styles.quickRideBtnText}>Quick Ride</Text>
            </TouchableOpacity>

            {/* Show active trips from server if any are planned */}
            {activeTripsData?.data?.filter(t => t.status === 'planned').map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripRideBtn}
                onPress={() => startTripRide(trip)}
              >
                <Ionicons name="map" size={16} color="#2196F3" />
                <Text style={styles.tripRideBtnText} numberOfLines={1}>{trip.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ─── Floating Controls ─── */}
      <View style={[styles.floatingControls, isNavigating && { bottom: 30 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={centerOnUser}>
          <MaterialIcons name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* ─── FAB ─── */}
      {!isNavigating && (
        <MapFAB onPress={() => setIsRidersOpen(true)} onPressActions={() => setIsQuickActionsOpen(true)} />
      )}

      {/* ─── Quick Actions ─── */}
      <QuickActionsSheet isOpen={isQuickActionsOpen} setIsOpen={() => setIsQuickActionsOpen(false)} />

      {/* ─── Riders Bottom Sheet ─── */}
      <RidersBottomSheet
        buddies={buddies}
        selectedBuddy={selectedBuddy}
        userLocation={location}
        getDistance={getDistance}
        onBuddyPress={navigateToBuddy}
        rideId={trackingGroupId ?? '—'}
        isOpen={isRidersOpen}
        setIsOpen={() => setIsRidersOpen(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  map: { width, height },
  errorText: { fontSize: 16, color: '#FF5252', textAlign: 'center', marginBottom: 20 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 16 },
  retryButton: { backgroundColor: '#2196F3', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  // User marker
  userMarker: { alignItems: 'center', justifyContent: 'center' },
  userPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(33,150,243,0.3)' },
  userDot: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2196F3',
    borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  // Buddy markers
  buddyMarker: { alignItems: 'center' },
  buddyAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  statusBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white',
  },
  calloutContainer: {
    backgroundColor: 'white', borderRadius: 12, padding: 12, minWidth: 120, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  calloutName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  calloutDistance: { color: '#666', fontSize: 12, marginBottom: 4 },
  calloutStatus: { color: '#2196F3', fontSize: 11, fontWeight: '600' },
  // Destination
  destinationMarker: { alignItems: 'center', justifyContent: 'center' },
  destinationPulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,82,82,0.2)', zIndex: -1 },
  // Search
  topBar: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 16, right: 16, zIndex: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 25,
    paddingHorizontal: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  connectionBadge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  connectionText: { color: 'white', fontSize: 11, fontWeight: '700' },
  // Active ride strip
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
  // Search results
  searchResultsContainer: {
    backgroundColor: 'white', borderRadius: 16, marginTop: 6, maxHeight: 260,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, overflow: 'hidden',
  },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  searchResultBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  searchResultTextContainer: { flex: 1 },
  searchResultMain: { fontSize: 15, fontWeight: '600', color: '#212121' },
  searchResultSecondary: { fontSize: 12, color: '#757575', marginTop: 2 },
  // No-ride card
  noRideCard: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, left: 16, right: 72,
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  noRideTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 2 },
  noRideSubtitle: { fontSize: 12, color: '#9E9E9E', marginBottom: 12 },
  noRideActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickRideBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FF6D00', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
  },
  quickRideBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  tripRideBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E3F2FD', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    maxWidth: 160,
  },
  tripRideBtnText: { color: '#2196F3', fontSize: 13, fontWeight: '700', flex: 1 },
  // Route preview
  routePreviewPanel: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, left: 16, right: 16,
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  routePreviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routePreviewDestName: { fontSize: 17, fontWeight: '700', color: '#212121' },
  routePreviewSubtext: { fontSize: 13, color: '#757575', marginTop: 2 },
  clearDestBtn: { padding: 4, marginLeft: 8 },
  routeModeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  routeModeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', gap: 6,
  },
  routeModeChipActive: { backgroundColor: '#4285F4' },
  routeModeChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  routeModeChipTextActive: { color: 'white' },
  startNavButton: {
    backgroundColor: '#34A853', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 28, gap: 8,
    shadowColor: '#34A853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  startNavButtonDisabled: { backgroundColor: '#BDBDBD', shadowOpacity: 0 },
  startNavButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  // Nav mode
  navTopInfo: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#212121', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  navTopDestination: { fontSize: 16, fontWeight: '700', color: 'white' },
  navTopDetails: { fontSize: 13, color: '#BDBDBD', marginTop: 2 },
  navStopButton: {
    backgroundColor: '#FF5252', width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  // Floating
  floatingControls: { position: 'absolute', right: 16, bottom: 280, alignItems: 'center' },
  iconButton: {
    backgroundColor: 'white', width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
});
