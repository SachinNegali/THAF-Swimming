import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { useLocalSearchParams } from 'expo-router';
import {
  BuddyMapMarker,
  ConnectionBadge,
  GOOGLE_MAPS_API_KEY,
  type LatLng,
  NavigationHeader,
  NoRideCard,
  type PlacePrediction,
  type RideMode,
  RideStrip,
  ROUTE_MODE_COLORS,
  type RouteMode,
  RoutePreviewPanel,
  SearchInput,
  SearchResults,
  TRACKING_WS_URL,
  TRAFFIC_COLORS,
  type TrafficSegment,
} from '../../components/explore';
import { IncomingActionPopup, MapFAB, QuickActionsSheet, RidersBottomSheet } from '../../components/ride';
import { Buddy } from '../../components/ride/types';
import { useTrip, useTrips, useUpdateTrip } from '../../hooks/api/useTrips';
import { IncomingQuickAction, useTracking } from '../../hooks/useTracking';
import { apiClient } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import { objectIdToNumericId } from '../../services/tracking/binaryProtocol';
import { useAppSelector } from '../../store/hooks';
import { selectAccessToken, selectUser } from '../../store/selectors';
import { Trip } from '../../types/api';

const { width, height } = Dimensions.get('window');

function trackingStatusLabel(code: number): string {
  switch (code) {
    case 0: return 'stationary';
    case 1: return 'driving';
    case 2: return 'paused';
    case 3: return 'SOS';
    default: return 'unknown';
  }
}

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
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
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

// ─── Main Component ──────────────────────────────────────
export default function BuddyMapExpo() {
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Deep link params ────────────────────────────────
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

  const trackingGroupId = useMemo<string | null>(() => {
    if (rideMode.type === 'trip')  return rideMode?.trip?.trackingGroupId;
    if (rideMode.type === 'quick') return rideMode.groupId;
    return null;
  }, [rideMode]);

  // ─── Start trip API ──────────────────────────────────
  const updateTrip = useUpdateTrip();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (startRide === '1' && deepLinkTripId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      updateTrip.mutate(
        { id: deepLinkTripId, data: { status: 'active' } as any },
        { onError: (err) => console.warn('[Explore] Failed to start trip:', err.message) }
      );
    }
  }, [startRide, deepLinkTripId]);

  // ─── Deep link: auto-join ────────────────────────────
  const { data: deepLinkTrip } = useTrip(
    deepLinkTripId ?? '',
    !!deepLinkTripId && rideMode.type === 'none',
  );

  useEffect(() => {
    if (deepLinkTrip && rideMode.type === 'none') {
      const trip = deepLinkTrip?.trip;
      const dest = trip.destination.coordinates;
      setDestination({ latitude: dest.lat, longitude: dest.lng });
      setDestinationName(trip.destination.name);
      setRideMode({ type: 'trip', trip });
    }
  }, [deepLinkTrip]);

  // ─── Active trip detection ───────────────────────────
  const { data: activeTripsData } = useTrips({ status: 'active' } as any);
  const serverActiveTrip = activeTripsData?.data?.[0] ?? null;
  const prevActiveTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!serverActiveTrip) {
      prevActiveTripIdRef.current = null;
      return;
    }
    if (
      serverActiveTrip.id !== prevActiveTripIdRef.current &&
      rideMode.type === 'none' &&
      !deepLinkTripId
    ) {
      prevActiveTripIdRef.current = serverActiveTrip.id;
      Alert.alert(
        'Trip Started!',
        `"${serverActiveTrip.title}" has started. Join your buddies on the map?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Join Now', onPress: () => setRideMode({ type: 'trip', trip: serverActiveTrip }) },
        ]
      );
    } else if (serverActiveTrip.id !== prevActiveTripIdRef.current) {
      prevActiveTripIdRef.current = serverActiveTrip.id;
    }
  }, [serverActiveTrip?.id]);

  // ─── Ride actions ────────────────────────────────────
  const startQuickRide = useCallback(async () => {
    const uuid = await Crypto.randomUUID();
    const groupId = 'QR-' + uuid.split('-')[0].toUpperCase();
    setRideMode({ type: 'quick', groupId });
  }, []);

  const startTripRide = useCallback((trip: Trip) => {
    setRideMode({ type: 'trip', trip });
  }, []);

  const endRide = useCallback(() => {
    setRideMode({ type: 'none' });
  }, []);

  // ─── Quick action popup ──────────────────────────────
  const [incomingAction, setIncomingAction] = useState<IncomingQuickAction | null>(null);
  const handleIncomingQuickAction = useCallback((action: IncomingQuickAction) => {
    setIncomingAction(action);
  }, []);

  // ─── Tracking ────────────────────────────────────────
  const {
    isConnected, isPolling, peerLocations, peerProfileMap, myLocation, groupSize,
    error: trackingError, sendQuickAction,
  } = useTracking({
    wsUrl: TRACKING_WS_URL,
    accessToken: accessToken ?? '',
    groupId: trackingGroupId ?? '',
    numericUserId,
    updateIntervalMs: 2000,
    enabled: !!accessToken && !!user && !!trackingGroupId,
    onQuickAction: handleIncomingQuickAction,
  });

  const location = useMemo(() => myLocation?.coords ?? null, [myLocation]);

  // ─── Build buddies from roster profiles (merge live location when available) ─
  const buddies = useMemo<Buddy[]>(() => {
    const result: Buddy[] = [];
    for (const [numId, profile] of peerProfileMap) {
      if (numId === numericUserId) continue;
      const peer = peerLocations.get(numId);
      const lastSeen = peer
        ? (() => {
            const timeDiff = Date.now() - peer.receivedAt;
            return timeDiff < 5_000 ? 'just now'
              : timeDiff < 60_000 ? `${Math.round(timeDiff / 1000)}s ago`
              : `${Math.round(timeDiff / 60_000)}m ago`;
          })()
        : 'offline';
      result.push({
        id: profile.userId,
        numericId: numId,
        name: profile.name,
        avatar: profile.picture ?? `https://i.pravatar.cc/150?u=${profile.userId}`,
        latitude: peer?.lat ?? 0,
        longitude: peer?.lng ?? 0,
        speed: peer?.speed,
        bearing: peer?.bearing,
        status: peer ? trackingStatusLabel(peer.status) : 'offline',
        battery: 100,
        lastSeen,
      });
    }
    return result;
  }, [peerLocations, peerProfileMap, numericUserId]);

  // ─── UI state ──────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
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
  const [joinTripCode, setJoinTripCode] = useState('');
  const [isJoiningTrip, setIsJoiningTrip] = useState(false);

  const joinByCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || isJoiningTrip) return;
    setIsJoiningTrip(true);
    try {
      const { data: tripData } = await apiClient.get<any>(endpoints.trips.byId(trimmed));
      const trip = tripData?.trip ?? tripData;
      if (!trip) { Alert.alert('Not Found', 'No trip found for that code'); return; }
      if (trip.destination?.coordinates) {
        setDestination({ latitude: trip.destination.coordinates.lat, longitude: trip.destination.coordinates.lng });
        setDestinationName(trip.destination.name ?? 'Destination');
      }
      setRideMode({ type: 'trip', trip });
      setJoinTripCode('');
    } catch {
      Alert.alert('Error', 'Could not find a trip with that code. Check and try again.');
    } finally {
      setIsJoiningTrip(false);
    }
  }, [isJoiningTrip]);

  useEffect(() => {
    if (myLocation?.coords.heading) setHeading(myLocation.coords.heading);
  }, [myLocation]);

  useEffect(() => {
    if (isNavigating && location && mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude: location.latitude, longitude: location.longitude },
        heading: location.heading ?? 0, pitch: 60, zoom: 18,
      });
    }
  }, [isNavigating, location]);

  // ─── Places Search ─────────────────────────────────
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]); setShowSearchResults(false); return;
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
        setSearchResults([]); setShowSearchResults(false);
      }
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  }, [location]);

  const onSearchTextChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!text.trim()) { setSearchResults([]); setShowSearchResults(false); return; }
    searchTimeoutRef.current = setTimeout(() => searchPlaces(text), 300);
  }, [searchPlaces]);

  const selectPlace = useCallback(async (prediction: PlacePrediction) => {
    Keyboard.dismiss();
    setSearchQuery(prediction.structured_formatting.main_text);
    setShowSearchResults(false); setSearchResults([]); setIsLoadingRoute(true);
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
      } else { Alert.alert('Error', 'Could not find that place'); }
    } catch { Alert.alert('Error', 'Failed to get place details'); }
    finally { setIsLoadingRoute(false); }
  }, [location, routeMode]);

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setShowSearchResults(false); setIsSearching(true); Keyboard.dismiss();
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
      } else { Alert.alert('Not Found', 'Unable to find that location'); }
    } catch { Alert.alert('Error', 'Failed to search for location'); }
    finally { setIsSearching(false); }
  };

  // ─── Routing ───────────────────────────────────────
  const fetchRoute = async (dest: LatLng) => {
    if (!location) { Alert.alert('Location Error', 'Unable to get your current location'); return; }
    setIsLoadingRoute(true);
    try {
      if (routeMode === 'motorcycle') await fetchRouteViaRoutesAPI(dest);
      else await fetchRouteViaDirectionsAPI(dest);
    } catch { generateStraightRoute(dest); }
    finally { setIsLoadingRoute(false); }
  };

  const fetchRouteViaRoutesAPI = async (dest: LatLng) => {
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
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.travelAdvisory.speedReadingIntervals',
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
        } else { setTrafficSegments([]); }
        const m = route.distanceMeters || route.legs?.[0]?.distanceMeters || 0;
        setRouteDistance(m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
        const sec = parseInt((route.duration || route.legs?.[0]?.duration || '0s').replace('s', ''), 10);
        setRouteDuration(sec >= 3600 ? `${Math.floor(sec / 3600)} hr ${Math.round((sec % 3600) / 60)} min` : `${Math.round(sec / 60)} min`);
      } else {
        setTrafficSegments([]);
        await fetchRouteViaDirectionsAPI(dest);
      }
    } catch {
      setTrafficSegments([]);
      await fetchRouteViaDirectionsAPI(dest);
    }
  };

  const fetchRouteViaDirectionsAPI = async (dest: LatLng) => {
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
    } else { generateStraightRoute(dest); }
  };

  const generateStraightRoute = (dest: LatLng) => {
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
    setShowSearchResults(false); setSearchResults([]);
    const coord = e.nativeEvent.coordinate;
    setDestination(coord); setDestinationName('Dropped pin'); setSearchQuery('');
    fetchRoute(coord);
  };

  const startNavigation = () => {
    if (!destination || !location) {
      Alert.alert('Select Destination', 'Tap on the map or search for a place to set your destination');
      return;
    }
    setIsNavigating(true); setSelectedBuddy(null);
    mapRef.current?.animateCamera(
      { center: { latitude: location.latitude, longitude: location.longitude }, heading, pitch: 60, zoom: 18 },
      { duration: 800 },
    );
  };

  const stopNavigation = () => {
    setIsNavigating(false); setDestination(null); setDestinationName('');
    setRouteCoordinates([]); setRouteDistance(''); setRouteDuration('');
    setSelectedBuddy(null); setSearchQuery(''); setTrafficSegments([]);
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

  const navigateToBuddy = useCallback((buddy: Buddy) => {
    if (!location) { Alert.alert('Location Error', 'Unable to get your current location'); return; }
    const dest = { latitude: buddy.latitude, longitude: buddy.longitude };
    setDestination(dest); setDestinationName(buddy.name);
    fetchRoute(dest); setSelectedBuddy(buddy); setShowSearchResults(false);
    mapRef.current?.fitToCoordinates(
      [{ latitude: location.latitude, longitude: location.longitude }, dest],
      { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true },
    );
  }, [location, routeMode]);

  const navigateToSender = useCallback((senderObjectId: string) => {
    const nid = objectIdToNumericId(senderObjectId);
    const peer = peerLocations.get(nid);
    if (!peer) {
      Alert.alert('Sender offline', 'We don\'t have a live location for that rider yet.');
      return;
    }
    const buddy = buddies.find((b) => b.numericId === nid);
    if (buddy) navigateToBuddy(buddy);
    else if (location) {
      const dest = { latitude: peer.lat, longitude: peer.lng };
      setDestination(dest); setDestinationName('Emergency sender');
      fetchRoute(dest);
    }
  }, [peerLocations, buddies, navigateToBuddy, location]);

  const changeRouteMode = (mode: RouteMode) => {
    setRouteMode(mode);
    if (destination) fetchRoute(destination);
  };

  const clearDestination = () => {
    setDestination(null); setDestinationName(''); setRouteCoordinates([]);
    setRouteDistance(''); setRouteDuration(''); setSelectedBuddy(null);
    setSearchQuery(''); setTrafficSegments([]);
  };

  const clearSearch = useCallback(() => {
    setSearchQuery(''); setSearchResults([]); setShowSearchResults(false);
  }, []);

  const onSearchFocus = useCallback(() => {
    if (searchResults.length > 0) setShowSearchResults(true);
  }, [searchResults]);

  const plannedTrips = useMemo(
    () => activeTripsData?.data?.filter((t: Trip) => t.status === 'planned') ?? [],
    [activeTripsData],
  );

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
          latitude: location.latitude, longitude: location.longitude,
          latitudeDelta: 0.05, longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
        showsUserLocation={!isNavigating}
        showsMyLocationButton={false}
        showsCompass
        showsTraffic
        mapType="standard"
      >
        {isNavigating && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            anchor={{ x: 0.5, y: 0.5 }} flat rotation={heading} tracksViewChanges
          >
            <View style={styles.userMarker}>
              <View style={styles.userPulse} />
              <View style={styles.userDot}>
                <MaterialIcons name="navigation" size={20} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {buddies.map((buddy) => (
          <BuddyMapMarker
            key={buddy.id}
            buddy={buddy}
            distanceKm={getDistance(location.latitude, location.longitude, buddy.latitude, buddy.longitude)}
            onPress={() => setSelectedBuddy(buddy)}
            onCalloutPress={() => navigateToBuddy(buddy)}
          />
        ))}

        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.destinationMarker}>
              <Ionicons name="location-sharp" size={40} color="#FF5252" />
              <View style={styles.destinationPulse} />
            </View>
          </Marker>
        )}

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
            strokeColor={ROUTE_MODE_COLORS[routeMode]}
            strokeWidth={6} lineCap="round" lineJoin="round"
          />
        ) : null}

        {!isNavigating && buddies.map((buddy) => {
          const dist = parseFloat(getDistance(location.latitude, location.longitude, buddy.latitude, buddy.longitude));
          return dist < 0.5 ? (
            <Polyline
              key={`line-${buddy.id}`}
              coordinates={[
                { latitude: location.latitude, longitude: location.longitude },
                { latitude: buddy.latitude, longitude: buddy.longitude },
              ]}
              strokeColor="rgba(33, 150, 243, 0.3)" strokeWidth={2} lineDashPattern={[5, 5]}
            />
          ) : null;
        })}
      </MapView>

      {/* ─── Top Bar ─── */}
      {!isNavigating && (
        <View style={styles.topBar}>
          <View style={styles.searchRow}>
            <SearchInput
              searchQuery={searchQuery}
              onSearchTextChange={onSearchTextChange}
              onSubmit={handleSearchSubmit}
              isSearching={isSearching}
              onClear={clearSearch}
              onFocus={onSearchFocus}
            />
            <ConnectionBadge
              isConnected={isConnected}
              isPolling={isPolling}
              hasError={!!trackingError}
              groupSize={buddies?.length ? buddies?.length+1 : 1}
            />
          </View>
          <RideStrip rideMode={rideMode} onEndRide={endRide} />
          <SearchResults
            visible={showSearchResults}
            results={searchResults}
            onSelect={selectPlace}
          />
        </View>
      )}

      {/* ─── Route Preview ─── */}
      {destination && !isNavigating && (
        <RoutePreviewPanel
          destinationName={destinationName}
          routeDistance={routeDistance}
          routeDuration={routeDuration}
          routeMode={routeMode}
          isLoadingRoute={isLoadingRoute}
          onChangeMode={changeRouteMode}
          onStartNavigation={startNavigation}
          onClearDestination={clearDestination}
        />
      )}

      {/* ─── Navigation Header ─── */}
      {isNavigating && (
        <NavigationHeader
          destinationName={destinationName}
          routeDistance={routeDistance}
          routeDuration={routeDuration}
          onStop={stopNavigation}
        />
      )}

      {/* ─── No Ride Card ─── */}
      {rideMode.type === 'none' && !isNavigating && !destination && (
        <NoRideCard
          onStartQuickRide={startQuickRide}
          plannedTrips={plannedTrips}
          onStartTripRide={startTripRide}
          joinTripCode={joinTripCode}
          onJoinTripCodeChange={setJoinTripCode}
          onJoinByCode={() => joinByCode(joinTripCode)}
          isJoiningTrip={isJoiningTrip}
        />
      )}

      {/* ─── Floating Controls ─── */}
      <View style={[styles.floatingControls, isNavigating && { bottom: 30 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={centerOnUser}>
          <MaterialIcons name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* {!isNavigating && ( */}
        <MapFAB onPress={() => setIsRidersOpen(true)} onPressActions={() => setIsQuickActionsOpen(true)} />
      {/* )} */}

      <QuickActionsSheet
        isOpen={isQuickActionsOpen}
        setIsOpen={() => setIsQuickActionsOpen(false)}
        onSendAction={(action) => {
          const u = user as any;
          const joined = [u?.fName, u?.lName].filter(Boolean).join(' ').trim();
          const name = u?.name ?? (joined || 'A rider');
          sendQuickAction(action.id, action.label, action.priority, name);
        }}
      />
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

      <IncomingActionPopup
        action={incomingAction}
        onDismiss={() => setIncomingAction(null)}
        onNavigateToSender={navigateToSender}
        displayAtTop={isQuickActionsOpen || isRidersOpen}
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
  userMarker: { alignItems: 'center', justifyContent: 'center' },
  userPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(33,150,243,0.3)' },
  userDot: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2196F3',
    borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  calloutContainer: {
    backgroundColor: 'white', borderRadius: 12, padding: 12, minWidth: 120, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  calloutName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  calloutDistance: { color: '#666', fontSize: 12, marginBottom: 4 },
  calloutStatus: { color: '#2196F3', fontSize: 11, fontWeight: '600' },
  destinationMarker: { alignItems: 'center', justifyContent: 'center' },
  destinationPulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,82,82,0.2)', zIndex: -1 },
  topBar: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, left: 16, right: 16, zIndex: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  floatingControls: { position: 'absolute', right: 16, bottom: 280, alignItems: 'center' },
  iconButton: {
    backgroundColor: 'white', width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
});
