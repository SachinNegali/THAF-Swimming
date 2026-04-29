import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

import { BuddySheet } from '../../components/buddy/BuddySheet';
import { JoinTrip, type JoinTripResult } from '../../components/buddy/JoinTrip';
import { MapControls } from '../../components/buddy/MapControls';
import { PaperMap } from '../../components/buddy/PaperMap';
import { TripHeader } from '../../components/buddy/TripHeader';
import {
  GOOGLE_MAPS_API_KEY,
  type LatLng,
  NavigationHeader,
  type PlacePrediction,
  type RideMode,
  type RouteMode,
  RoutePreviewPanel,
  SearchInput,
  SearchResults,
  TRACKING_WS_URL,
  TRAFFIC_COLORS,
  type TrafficSegment,
} from '../../components/explore';
import { IncomingActionPopup } from '../../components/ride';
import type { Buddy as TrackedBuddy } from '../../components/ride/types';
import { DEMO_QUICK_MSGS } from '../../data/demoData';
import { useTrip, useTrips, useUpdateTrip } from '../../hooks/api/useTrips';
import { type IncomingQuickAction, useTracking } from '../../hooks/useTracking';
import { apiClient } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import { objectIdToNumericId } from '../../services/tracking/binaryProtocol';
import { useAppSelector } from '../../store/hooks';
import { selectAccessToken, selectUser } from '../../store/selectors';
import { colors } from '../../theme';
import {
  type Buddy as UIBuddy,
  type BuddyMapMode,
  type BuddySheetState,
  type QuickMessage,
} from '../../types';

// ─── Helpers ─────────────────────────────────────────────
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

// ─── Adapters ────────────────────────────────────────────
function hashTone(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 4;
}

function callsignFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const cs = parts.length === 1
    ? parts[0].slice(0, 5).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return cs || '••';
}

function toUIBuddy(b: TrackedBuddy): UIBuddy {
  const status = b.status === 'offline'
    ? 'lost'
    : b.status === 'stationary' || b.status === 'paused'
    ? 'stopped'
    : 'live';
  return {
    id: b.id,
    cs: callsignFromName(b.name),
    name: b.name,
    tone: hashTone(b.id),
    x: 0, y: 0,
    head: b.bearing ?? 0,
    kmh: Math.round(b.speed ?? 0),
    bat: b.battery ?? 100,
    sig: status === 'lost' ? 0 : status === 'stopped' ? 2 : 4,
    role: 'rider',
    status,
    eta: '—',
    last: b.lastSeen,
  };
}

const QUICK_MSG_PRIORITY: Record<string, 'emergency' | 'medium' | 'regular'> = {
  pace: 'regular',
  fuel: 'medium',
  photo: 'regular',
  stop: 'medium',
  tea: 'regular',
  closeup: 'regular',
};

// ─── Screen ──────────────────────────────────────────────
interface BuddyScreenProps {
  initialMode?: BuddyMapMode;
}

const BuddyScreen = React.memo(({ initialMode }: BuddyScreenProps) => {
  const router = useRouter();
  const { tripId: deepLinkTripId, startRide } = useLocalSearchParams<{ tripId?: string; startRide?: string }>();
  const startsLive = startRide === '1' && !!deepLinkTripId;
  const resolvedInitialMode: BuddyMapMode = initialMode ?? (startsLive ? 'live' : 'join');

  const [mode, setMode] = useState<BuddyMapMode>(resolvedInitialMode);

  useEffect(() => { if (startsLive) setMode('live'); }, [startsLive]);
  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  // ─── Auth ──────────────────────────────────────────
  const accessToken = useAppSelector(selectAccessToken);
  const user = useAppSelector(selectUser);
  const numericUserId = useMemo(
    () => (user?._id ? objectIdToNumericId(user._id) : 0),
    [user?._id],
  );

  const senderName = useMemo(() => {
    const u = user as any;
    const joined = [u?.fName, u?.lName].filter(Boolean).join(' ').trim();
    return u?.name ?? (joined || 'A rider');
  }, [user]);

  // ─── Ride mode ─────────────────────────────────────
  const [rideMode, setRideMode] = useState<RideMode>({ type: 'none' });
  const trackingGroupId = useMemo<string | null>(() => {
    if (rideMode.type === 'trip') return (rideMode.trip as any)?.trackingGroupId ?? null;
    if (rideMode.type === 'quick') return rideMode.groupId;
    return null;
  }, [rideMode]);

  // ─── Start trip API (deep-link from tripDetails) ──
  const updateTrip = useUpdateTrip();
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (startRide === '1' && deepLinkTripId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      updateTrip.mutate(
        { id: deepLinkTripId, data: { status: 'active' } as any },
        { onError: (err) => console.warn('[Buddy] Failed to start trip:', err.message) },
      );
    }
  }, [startRide, deepLinkTripId, updateTrip]);

  const { data: deepLinkTrip } = useTrip(
    deepLinkTripId ?? '',
    !!deepLinkTripId && rideMode.type === 'none',
  );
  useEffect(() => {
    if (deepLinkTrip && rideMode.type === 'none') {
      const trip = (deepLinkTrip as any)?.trip ?? deepLinkTrip;
      const dest = trip?.destination?.coordinates;
      if (dest) {
        setDestination({ latitude: dest.lat, longitude: dest.lng });
        setDestinationName(trip.destination.name);
      }
      setRideMode({ type: 'trip', trip });
    }
  }, [deepLinkTrip]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Active-trip auto-prompt ───────────────────────
  const { data: activeTripsData } = useTrips({ status: 'active' } as any);
  const serverActiveTrip = (activeTripsData as any)?.data?.[0] ?? null;
  const prevActiveTripIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!serverActiveTrip) { prevActiveTripIdRef.current = null; return; }
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
          {
            text: 'Join Now',
            onPress: () => {
              setRideMode({ type: 'trip', trip: serverActiveTrip });
              setMode('live');
            },
          },
        ],
      );
    } else if (serverActiveTrip.id !== prevActiveTripIdRef.current) {
      prevActiveTripIdRef.current = serverActiveTrip.id;
    }
  }, [serverActiveTrip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Incoming alerts ───────────────────────────────
  const [incomingAction, setIncomingAction] = useState<IncomingQuickAction | null>(null);

  const handleIncomingQuickAction = useCallback((action: IncomingQuickAction) => {
    setIncomingAction(action);
    if (action.priority === 'emergency') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } else if (action.priority === 'medium') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  // ─── Tracking ──────────────────────────────────────
  const {
    isConnected, peerLocations, peerProfileMap, myLocation, sendQuickAction,
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

  const trackedBuddies = useMemo<TrackedBuddy[]>(() => {
    const result: TrackedBuddy[] = [];
    for (const [numId, profile] of peerProfileMap) {
      if (numId === numericUserId) continue;
      const peer = peerLocations.get(numId);
      const lastSeen = peer
        ? (() => {
            const t = Date.now() - peer.receivedAt;
            return t < 5_000 ? 'just now'
              : t < 60_000 ? `${Math.round(t / 1000)}s ago`
              : `${Math.round(t / 60_000)}m ago`;
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

  const uiBuddies = useMemo<UIBuddy[]>(
    () => trackedBuddies.map(toUIBuddy),
    [trackedBuddies],
  );

  // ─── Map state ─────────────────────────────────────
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [trafficSegments, setTrafficSegments] = useState<TrafficSegment[]>([]);
  const [routeMode, setRouteMode] = useState<RouteMode>('motorcycle');
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [heading, setHeading] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [sheet, setSheet] = useState<BuddySheetState>('collapsed');

  useEffect(() => {
    if (myLocation?.coords.heading) setHeading(myLocation.coords.heading);
  }, [myLocation]);

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

  // ─── Routing ───────────────────────────────────────
  const fetchRouteViaRoutesAPI = useCallback(async (dest: LatLng) => {
    if (!location) return;
    try {
      const body = {
        origin: { location: { latLng: { latitude: location.latitude, longitude: location.longitude } } },
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
      }
    } catch {
      setTrafficSegments([]);
    }
  }, [location]);

  const fetchRouteViaDirectionsAPI = useCallback(async (dest: LatLng) => {
    if (!location) return;
    setTrafficSegments([]);
    const mode = routeMode === 'motorcycle' ? 'driving' : routeMode;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${dest.latitude},${dest.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.routes.length) {
      const route = data.routes[0];
      setRouteCoordinates(decodePolyline(route.overview_polyline.points));
      setRouteDistance(route.legs[0].distance.text);
      setRouteDuration(route.legs[0].duration.text);
    }
  }, [location, routeMode]);

  const fetchRoute = useCallback(async (dest: LatLng) => {
    if (!location) { Alert.alert('Location Error', 'Unable to get your current location'); return; }
    setIsLoadingRoute(true);
    try {
      if (routeMode === 'motorcycle') await fetchRouteViaRoutesAPI(dest);
      else await fetchRouteViaDirectionsAPI(dest);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [location, routeMode, fetchRouteViaRoutesAPI, fetchRouteViaDirectionsAPI]);

  // ─── Search ────────────────────────────────────────
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
  }, [location, fetchRoute]);

  const handleSearchSubmit = useCallback(async () => {
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
  }, [searchQuery, fetchRoute, location]);

  const clearSearch = useCallback(() => {
    setSearchQuery(''); setSearchResults([]); setShowSearchResults(false);
  }, []);

  const onSearchFocus = useCallback(() => {
    if (searchResults.length > 0) setShowSearchResults(true);
  }, [searchResults]);

  // ─── Map / nav actions ─────────────────────────────
  const handleMapPress = useCallback((e: any) => {
    if (isNavigating) return;
    setShowSearchResults(false); setSearchResults([]);
    const coord = e.nativeEvent.coordinate;
    setDestination(coord); setDestinationName('Dropped pin'); setSearchQuery('');
    fetchRoute(coord);
  }, [isNavigating, fetchRoute]);

  const startNavigation = useCallback(() => {
    if (!destination || !location) {
      Alert.alert('Select Destination', 'Tap on the map or search for a place to set your destination');
      return;
    }
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    mapRef.current?.animateCamera(
      { center: { latitude: location.latitude, longitude: location.longitude }, heading, pitch: 60, zoom: 18 },
      { duration: 800 },
    );
  }, [destination, location, heading]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false); setDestination(null); setDestinationName('');
    setRouteCoordinates([]); setRouteDistance(''); setRouteDuration('');
    setSearchQuery(''); setTrafficSegments([]);
    if (mapRef.current && location) {
      mapRef.current.animateCamera(
        { center: { latitude: location.latitude, longitude: location.longitude }, heading: 0, pitch: 0, zoom: 15 },
        { duration: 600 },
      );
    }
  }, [location]);

  const centerOnUser = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
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
  }, [location, heading, isNavigating]);

  const navigateToBuddy = useCallback((buddy: TrackedBuddy) => {
    if (!location) { Alert.alert('Location Error', 'Unable to get your current location'); return; }
    const dest = { latitude: buddy.latitude, longitude: buddy.longitude };
    setDestination(dest); setDestinationName(buddy.name);
    fetchRoute(dest); setShowSearchResults(false);
    mapRef.current?.fitToCoordinates(
      [{ latitude: location.latitude, longitude: location.longitude }, dest],
      { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true },
    );
  }, [location, fetchRoute]);

  const navigateToSender = useCallback((senderObjectId: string) => {
    const nid = objectIdToNumericId(senderObjectId);
    const peer = peerLocations.get(nid);
    if (!peer) {
      Alert.alert('Sender offline', 'We don\'t have a live location for that rider yet.');
      return;
    }
    const buddy = trackedBuddies.find((b) => b.numericId === nid);
    if (buddy) navigateToBuddy(buddy);
    else if (location) {
      const dest = { latitude: peer.lat, longitude: peer.lng };
      setDestination(dest); setDestinationName('Emergency sender');
      fetchRoute(dest);
    }
  }, [peerLocations, trackedBuddies, navigateToBuddy, location, fetchRoute]);

  const changeRouteMode = useCallback((m: RouteMode) => {
    setRouteMode(m);
    if (destination) fetchRoute(destination);
  }, [destination, fetchRoute]);

  const clearDestination = useCallback(() => {
    setDestination(null); setDestinationName(''); setRouteCoordinates([]);
    setRouteDistance(''); setRouteDuration('');
    setSearchQuery(''); setTrafficSegments([]);
  }, []);

  // ─── Sheet / quick / SOS ───────────────────────────
  const toggleSheet = useCallback(() => {
    setSheet((s) => (s === 'collapsed' ? 'expanded' : 'collapsed'));
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleQuickSend = useCallback((m: QuickMessage) => {
    const priority = QUICK_MSG_PRIORITY[m.id] ?? 'regular';
    sendQuickAction(m.id, m.label, priority, senderName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [sendQuickAction, senderName]);

  const handleSos = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      'Send SOS?',
      'This will notify the entire pack with a Rider Down emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            sendQuickAction('rider-down', 'Rider Down', 'emergency', senderName);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          },
        },
      ],
    );
  }, [sendQuickAction, senderName]);

  // ─── Joined from JoinTrip tab ───────────────────────
  const handleJoined = useCallback(async (result: JoinTripResult) => {
    try {
      if (result.kind === 'solo') {
        const uuid = Crypto.randomUUID();
        const groupId = 'QR-' + uuid.split('-')[0].toUpperCase();
        setRideMode({ type: 'quick', groupId });
        setMode('live');
        return;
      }
      if (result.kind === 'code' || result.kind === 'scan') {
        const code = result.kind === 'code' ? result.code : result.payload;
        const trimmed = code.trim();
        if (!trimmed) return;
        try {
          const { data: tripData } = await apiClient.get<any>(endpoints.trips.byId(trimmed));
          const trip = tripData?.trip ?? tripData;
          if (!trip) { Alert.alert('Not Found', 'No trip found for that code'); return; }
          if (trip.destination?.coordinates) {
            setDestination({ latitude: trip.destination.coordinates.lat, longitude: trip.destination.coordinates.lng });
            setDestinationName(trip.destination.name ?? 'Destination');
          }
          setRideMode({ type: 'trip', trip });
          setMode('live');
        } catch {
          Alert.alert('Error', 'Could not find a trip with that code. Check and try again.');
        }
      }
    } catch (e) {
      console.warn('[Buddy] handleJoined error', e);
    }
  }, []);

  // ─── Header labels ─────────────────────────────────
  const tripFromName = rideMode.type === 'trip' ? (rideMode.trip as any)?.origin?.name : undefined;
  const tripToName = rideMode.type === 'trip' ? (rideMode.trip as any)?.destination?.name : undefined;
  const originLabel = tripFromName ?? 'You';
  const destinationLabel = destinationName || tripToName || (rideMode.type === 'quick' ? 'Free roam' : '—');
  const etaLabel = routeDuration || (isConnected ? 'Live' : '—');

  const handleBack = useCallback(() => {
    if (rideMode.type !== 'none') setRideMode({ type: 'none' });
    setMode('join');
  }, [rideMode]);

  const handleBackFromJoin = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  // ─── Render ────────────────────────────────────────
  if (mode === 'join') {
    return <JoinTrip onBack={handleBackFromJoin} onJoined={handleJoined} />;
  }

  return (
    <View style={styles.screen}>
      <PaperMap
        mapRef={mapRef}
        location={location}
        destination={destination}
        buddies={trackedBuddies}
        routeCoordinates={routeCoordinates}
        trafficSegments={trafficSegments}
        routeMode={routeMode}
        isNavigating={isNavigating}
        heading={heading}
        getDistance={getDistance}
        onMapPress={handleMapPress}
        onBuddyPress={navigateToBuddy}
        onCalloutPress={navigateToBuddy}
      />

      {!isNavigating && (
        <>
          <TripHeader
            packCount={trackedBuddies.length + 1}
            origin={originLabel}
            destination={destinationLabel}
            eta={etaLabel}
            onBack={handleBack}
          />
          <View style={styles.searchWrap} pointerEvents="box-none">
            <SearchInput
              searchQuery={searchQuery}
              onSearchTextChange={onSearchTextChange}
              onSubmit={handleSearchSubmit}
              isSearching={isSearching}
              onClear={clearSearch}
              onFocus={onSearchFocus}
            />
            <SearchResults
              visible={showSearchResults}
              results={searchResults}
              onSelect={selectPlace}
            />
          </View>
        </>
      )}

      {isNavigating && (
        <NavigationHeader
          destinationName={destinationName}
          routeDistance={routeDistance}
          routeDuration={routeDuration}
          onStop={stopNavigation}
        />
      )}

      <MapControls onSos={handleSos} onLocate={centerOnUser} />

      {destination && !isNavigating && (
        <View style={styles.routePanel} pointerEvents="box-none">
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
        </View>
      )}

      <BuddySheet
        state={sheet}
        buddies={uiBuddies}
        quickMsgs={DEMO_QUICK_MSGS}
        onToggle={toggleSheet}
        onQuickSend={handleQuickSend}
      />

      <IncomingActionPopup
        action={incomingAction}
        onDismiss={() => setIncomingAction(null)}
        onNavigateToSender={navigateToSender}
        displayAtTop
      />
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper2,
  },
  searchWrap: {
    position: 'absolute',
    top: 116,
    left: 12,
    right: 12,
    zIndex: 19,
  },
  routePanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 180,
    zIndex: 15,
  },
});

export default BuddyScreen;
