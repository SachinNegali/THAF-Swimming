import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  View
} from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Google Maps API Key - Replace with your actual key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBIaPQX7NEd3CBNIbRw93kKG890LPyXcWs';

// Mock buddies data - positioned around user's location (15.4148276, 75.6324465)
const MOCK_BUDDIES = [
  {
    id: '1',
    name: 'Rahul',
    latitude: 15.4248, // ~1.1 km north
    longitude: 75.6424,
    avatar: 'https://i.pravatar.cc/150?img=12',
    status: 'driving',
    battery: 85,
    lastSeen: '2 min ago'
  },
  {
    id: '2',
    name: 'Priya',
    latitude: 15.4048, // ~1.1 km south
    longitude: 75.6224,
    avatar: 'https://i.pravatar.cc/150?img=5',
    status: 'walking',
    battery: 62,
    lastSeen: 'just now'
  },
  {
    id: '3',
    name: 'Arjun',
    latitude: 15.4398, // ~2.8 km northeast
    longitude: 75.6524,
    avatar: 'https://i.pravatar.cc/150?img=8',
    status: 'bicycling',
    battery: 91,
    lastSeen: '5 min ago'
  },
  {
    id: '4',
    name: 'Sneha',
    latitude: 15.3898, // ~2.8 km southwest
    longitude: 75.6124,
    avatar: 'https://i.pravatar.cc/150?img=9',
    status: 'stationary',
    battery: 45,
    lastSeen: '10 min ago'
  },
  {
    id: '5',
    name: 'Vikram',
    latitude: 15.4148, // ~2.2 km east
    longitude: 75.6624,
    avatar: 'https://i.pravatar.cc/150?img=15',
    status: 'driving',
    battery: 78,
    lastSeen: '1 min ago'
  },
  {
    id: '6',
    name: 'Anjali',
    latitude: 15.4448, // ~3.3 km north
    longitude: 75.6324,
    avatar: 'https://i.pravatar.cc/150?img=20',
    status: 'walking',
    battery: 92,
    lastSeen: '3 min ago'
  }
];

type RouteMode = 'motorcycle' | 'driving' | 'bicycling' | 'walking';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface TrafficSegment {
  coordinates: { latitude: number; longitude: number }[];
  color: string; // green, orange, or red
}

const TRAFFIC_COLORS = {
  NORMAL: '#34A853',      // Green
  SLOW: '#FBBC04',        // Orange/Yellow
  TRAFFIC_JAM: '#EA4335', // Red
} as const;

// Memoized buddy marker to prevent re-renders / flickering
const BuddyMarkerView = React.memo(({ buddy }: { buddy: typeof MOCK_BUDDIES[0] }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'walking': return 'walking';
      case 'driving': return 'car';
      case 'cycling': return 'bicycle';
      default: return 'map-marker-alt';
    }
  };

  return (
    <View style={styles.buddyMarker}>
      <Image source={{ uri: buddy.avatar }} style={styles.buddyAvatar} />
      <View style={[styles.statusBadge, {
        backgroundColor:
          buddy.status === 'walking' ? '#4CAF50' :
          buddy.status === 'driving' ? '#2196F3' : '#FF9800'
      }]}>
        <FontAwesome5 name={getStatusIcon(buddy.status)} size={8} color="white" />
      </View>
    </View>
  );
});

export default function BuddyMapExpo() {
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [buddies, setBuddies] = useState(MOCK_BUDDIES);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedBuddy, setSelectedBuddy] = useState<typeof MOCK_BUDDIES[0] | null>(null);
  const [heading, setHeading] = useState(0);
  const [routeMode, setRouteMode] = useState<RouteMode>('motorcycle');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [trafficSegments, setTrafficSegments] = useState<TrafficSegment[]>([]);

  // Initialize location
  useEffect(() => {
    (async () => {
      await initializeLocation();
    })();

    // Simulate real-time buddy updates
    const interval = setInterval(simulateBuddyMovement, 4000);
    return () => clearInterval(interval);
  }, []);

  const initializeLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation?.coords);
      await startLocationTracking();
      
    } catch (error: any) {
      setErrorMsg('Error getting location: ' + error?.message);
    }
  };

  const startLocationTracking = async () => {
    try {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation?.coords);
          setHeading(newLocation.coords.heading || 0);
          
          broadcastLocation(newLocation.coords);
          
          // If navigating, follow user with tilted camera
          if (isNavigating && mapRef.current) {
            mapRef.current.animateCamera({
              center: {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude
              },
              heading: newLocation.coords.heading || 0,
              pitch: 60,
              zoom: 18,
            });
          }
        }
      );
    } catch (error) {
      console.error('Error watching position:', error);
    }
  };

  const broadcastLocation = async (coords: Location.LocationObjectCoords) => {
    // TODO: Send to your backend/WebSocket
  };

  // Simulate buddy movement for demo
  const simulateBuddyMovement = () => {
    setBuddies(prev => prev.map(buddy => ({
      ...buddy,
      latitude: buddy.latitude + (Math.random() - 0.5) * 0.002,
      longitude: buddy.longitude + (Math.random() - 0.5) * 0.002,
    })));
  };

  // Calculate distance between two points
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  // ─── Places Autocomplete Search ───────────────────────────────────
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const locationBias = location
        ? `&location=${location.latitude},${location.longitude}&radius=50000`
        : '';
      
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}${locationBias}&components=country:in`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setSearchResults(data.predictions.slice(0, 5));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Places search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [location]);

  // Debounced search as user types
  const onSearchTextChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  }, [searchPlaces]);

  // Select a place from autocomplete results
  const selectPlace = useCallback(async (prediction: PlacePrediction) => {
    Keyboard.dismiss();
    setSearchQuery(prediction.structured_formatting.main_text);
    setShowSearchResults(false);
    setSearchResults([]);
    setIsLoadingRoute(true);

    try {
      // Get place details for lat/lng
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,name&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const dest = { latitude: lat, longitude: lng };

        setDestination(dest);
        setDestinationName(data.result.name || prediction.structured_formatting.main_text);
        await fetchRoute(dest);

        // Fit map to show both origin and destination
        if (mapRef.current && location) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: location.latitude, longitude: location.longitude },
              dest,
            ],
            { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true }
          );
        }
      } else {
        Alert.alert('Error', 'Could not find that place');
      }
    } catch (error) {
      console.error('Place details error:', error);
      Alert.alert('Error', 'Failed to get place details');
    } finally {
      setIsLoadingRoute(false);
    }
  }, [location, routeMode]);

  // Fallback: submit-on-enter using Geocoding
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;

    setShowSearchResults(false);
    setIsSearching(true);
    Keyboard.dismiss();

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const loc = result.geometry.location;
        const dest = { latitude: loc.lat, longitude: loc.lng };

        setDestination(dest);
        setDestinationName(result.formatted_address || searchQuery);
        await fetchRoute(dest);

        if (mapRef.current && location) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: location.latitude, longitude: location.longitude },
              dest,
            ],
            { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true }
          );
        }
      } else {
        Alert.alert('Not Found', 'Unable to find that location');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for location');
    } finally {
      setIsSearching(false);
    }
  };

  // ─── Routing ───────────────────────────────────────────────────────
  const fetchRoute = async (dest: { latitude: number; longitude: number }) => {
    if (!location) {
      Alert.alert('Location Error', 'Unable to get your current location');
      return;
    }

    setIsLoadingRoute(true);
    try {
      if (routeMode === 'motorcycle') {
        // Use Google Routes API for TWO_WHEELER mode (motorcycle-optimized)
        await fetchRouteViaRoutesAPI(dest);
      } else {
        // Use legacy Directions API for car/bike/walk
        await fetchRouteViaDirectionsAPI(dest);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      generateStraightRoute(dest);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Google Routes API — supports TWO_WHEELER for motorcycle + traffic data
  const fetchRouteViaRoutesAPI = async (dest: { latitude: number; longitude: number }) => {
    try {
      const body = {
        origin: {
          location: {
            latLng: { latitude: location!.latitude, longitude: location!.longitude }
          }
        },
        destination: {
          location: {
            latLng: { latitude: dest.latitude, longitude: dest.longitude }
          }
        },
        travelMode: 'TWO_WHEELER',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        languageCode: 'en',
        extraComputations: ['TRAFFIC_ON_POLYLINE'],
      };

      const response = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.travelAdvisory.speedReadingIntervals',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.polyline.encodedPolyline);
        setRouteCoordinates(points);

        // Parse traffic speed intervals into colored segments
        const speedIntervals = route.travelAdvisory?.speedReadingIntervals;
        if (speedIntervals && speedIntervals.length > 0) {
          const segments: TrafficSegment[] = speedIntervals.map((interval: any) => {
            const startIdx = interval.startPolylinePointIndex || 0;
            const endIdx = interval.endPolylinePointIndex || 0;
            const speed = interval.speed || 'NORMAL';
            const color = TRAFFIC_COLORS[speed as keyof typeof TRAFFIC_COLORS] || TRAFFIC_COLORS.NORMAL;

            // Slice the polyline points for this segment (include endIdx for continuity)
            const segmentPoints = points.slice(startIdx, endIdx + 1);

            return { coordinates: segmentPoints, color };
          });
          setTrafficSegments(segments);
        } else {
          // No traffic data — clear segments, will fall back to single-color polyline
          setTrafficSegments([]);
        }

        // Format distance
        const distMeters = route.distanceMeters || route.legs?.[0]?.distanceMeters || 0;
        if (distMeters >= 1000) {
          setRouteDistance(`${(distMeters / 1000).toFixed(1)} km`);
        } else {
          setRouteDistance(`${distMeters} m`);
        }

        // Format duration (comes as "123s" string)
        const durationStr = route.duration || route.legs?.[0]?.duration || '0s';
        const totalSeconds = parseInt(durationStr.replace('s', ''), 10);
        if (totalSeconds >= 3600) {
          const hrs = Math.floor(totalSeconds / 3600);
          const mins = Math.round((totalSeconds % 3600) / 60);
          setRouteDuration(`${hrs} hr ${mins} min`);
        } else {
          setRouteDuration(`${Math.round(totalSeconds / 60)} min`);
        }
      } else {
        console.warn('Routes API returned no routes, falling back to Directions API');
        setTrafficSegments([]);
        await fetchRouteViaDirectionsAPI(dest);
      }
    } catch (error) {
      console.warn('Routes API failed, falling back to Directions API:', error);
      setTrafficSegments([]);
      await fetchRouteViaDirectionsAPI(dest);
    }
  };

  // Legacy Directions API — for car, bicycle, walking (no traffic coloring)
  const fetchRouteViaDirectionsAPI = async (dest: { latitude: number; longitude: number }) => {
    setTrafficSegments([]); // No traffic data from legacy API
    const origin = `${location!.latitude},${location!.longitude}`;
    const destinationStr = `${dest.latitude},${dest.longitude}`;
    const mode = routeMode === 'motorcycle' ? 'driving' : routeMode;
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const points = decodePolyline(route.overview_polyline.points);
      setRouteCoordinates(points);
      
      const leg = route.legs[0];
      setRouteDistance(leg.distance.text);
      setRouteDuration(leg.duration.text);
    } else {
      console.warn('Directions API failed, using straight line. Status:', data.status);
      generateStraightRoute(dest);
    }
  };

  // Decode Google polyline
  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Fallback straight line route
  const generateStraightRoute = (dest: { latitude: number; longitude: number }) => {
    if (!location) return;
    
    const points = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      points.push({
        latitude: location.latitude + (dest.latitude - location.latitude) * (i / steps),
        longitude: location.longitude + (dest.longitude - location.longitude) * (i / steps),
      });
    }
    setRouteCoordinates(points);
    
    const dist = getDistance(location.latitude, location.longitude, dest.latitude, dest.longitude);
    setRouteDistance(`${dist} km`);
    setRouteDuration('~');
  };

  // ─── Map & Navigation Actions ─────────────────────────────────────
  const handleMapPress = (e: any) => {
    if (isNavigating) return;

    // Dismiss search dropdown
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

    // Enter follow mode: tilt camera, center on user, follow heading
    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        heading: heading,
        pitch: 60,
        zoom: 18,
      }, { duration: 800 });
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

    // Return to top-down view
    if (mapRef.current && location) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        heading: 0,
        pitch: 0,
        zoom: 15,
      }, { duration: 600 });
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      if (isNavigating) {
        mapRef.current.animateCamera({
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          heading: heading,
          pitch: 60,
          zoom: 18,
        }, { duration: 500 });
      } else {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  };

  const navigateToBuddy = useCallback((buddy: typeof MOCK_BUDDIES[0]) => {
    if (!location) {
      Alert.alert('Location Error', 'Unable to get your current location');
      return;
    }

    const dest = {
      latitude: buddy.latitude,
      longitude: buddy.longitude
    };
    
    setDestination(dest);
    setDestinationName(buddy.name);
    fetchRoute(dest);
    setSelectedBuddy(buddy);
    setShowSearchResults(false);
    
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: buddy.latitude, longitude: buddy.longitude }
        ],
        { edgePadding: { top: 150, right: 50, bottom: 350, left: 50 }, animated: true }
      );
    }
  }, [location, routeMode]);

  const changeRouteMode = (mode: RouteMode) => {
    setRouteMode(mode);
    if (destination) {
      fetchRoute(destination);
    }
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

  const getRouteModeIcon = (mode: RouteMode) => {
    switch(mode) {
      case 'motorcycle': return 'motorcycle';
      case 'driving': return 'car';
      case 'bicycling': return 'bicycle';
      case 'walking': return 'walking';
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
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
          latitude: 15.4148276,
          longitude: 75.6324465,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
        showsUserLocation={!isNavigating}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={true}
        mapType="standard"
      >
        {/* Custom User Location Marker (only in navigation mode) */}
        {isNavigating && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={heading}
            tracksViewChanges={true}
          >
            <View style={styles.userMarker}>
              <View style={styles.userPulse} />
              <View style={styles.userDot}>
                <MaterialIcons name="navigation" size={20} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {/* Buddy Markers - tracksViewChanges={false} prevents flickering */}
        {buddies.map(buddy => (
          <Marker
            key={buddy.id}
            coordinate={{
              latitude: buddy.latitude,
              longitude: buddy.longitude
            }}
            onPress={() => setSelectedBuddy(buddy)}
            tracksViewChanges={false}
          >
            <BuddyMarkerView buddy={buddy} />
            <Callout tooltip onPress={() => navigateToBuddy(buddy)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutName}>{buddy.name}</Text>
                <Text style={styles.calloutDistance}>
                  {getDistance(
                    location.latitude,
                    location.longitude,
                    buddy.latitude,
                    buddy.longitude
                  )} km away
                </Text>
                <Text style={styles.calloutStatus}>Tap to navigate</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Destination Marker */}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.destinationMarker}>
              <Ionicons name="location-sharp" size={40} color="#FF5252" />
              <View style={styles.destinationPulse} />
            </View>
          </Marker>
        )}

        {/* Route Line — traffic-colored segments when available */}
        {trafficSegments.length > 0 ? (
          <>
            {/* Draw a thicker base line underneath for contrast */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="rgba(0, 0, 0, 0.15)"
              strokeWidth={10}
              lineCap="round"
              lineJoin="round"
            />
            {/* Colored traffic segments on top */}
            {trafficSegments.map((segment, index) => (
              segment.coordinates.length >= 2 ? (
                <Polyline
                  key={`traffic-${index}`}
                  coordinates={segment.coordinates}
                  strokeColor={segment.color}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              ) : null
            ))}
          </>
        ) : routeCoordinates.length > 0 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeMode === 'motorcycle' ? '#FF6D00' : routeMode === 'driving' ? '#4285F4' : routeMode === 'bicycling' ? '#34A853' : '#FBBC04'}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {/* Connection lines to nearby buddies */}
        {!isNavigating && buddies.map(buddy => {
          const dist = parseFloat(getDistance(
            location.latitude,
            location.longitude,
            buddy.latitude,
            buddy.longitude
          ));
          if (dist < 0.5) {
            return (
              <Polyline
                key={`line-${buddy.id}`}
                coordinates={[
                  { latitude: location.latitude, longitude: location.longitude },
                  { latitude: buddy.latitude, longitude: buddy.longitude }
                ]}
                strokeColor="rgba(33, 150, 243, 0.3)"
                strokeWidth={2}
                lineDashPattern={[5, 5]}
              />
            );
          }
          return null;
        })}
      </MapView>

      {/* ─── Top Bar — Search ─── */}
      {!isNavigating && (
        <View style={styles.topBar}>
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
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
            />
            {isSearching && <ActivityIndicator size="small" color="#2196F3" />}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={[
                      styles.searchResultItem,
                      index < searchResults.length - 1 && styles.searchResultBorder,
                    ]}
                    onPress={() => selectPlace(item)}
                  >
                    <Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 12 }} />
                    <View style={styles.searchResultTextContainer}>
                      <Text style={styles.searchResultMain} numberOfLines={1}>
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.searchResultSecondary} numberOfLines={1}>
                        {item.structured_formatting.secondary_text}
                      </Text>
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
          {/* Destination name */}
          <View style={styles.routePreviewHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routePreviewDestName} numberOfLines={1}>
                {destinationName || 'Selected location'}
              </Text>
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

          {/* Route mode selector */}
          <View style={styles.routeModeRow}>
            <TouchableOpacity
              style={[styles.routeModeChip, routeMode === 'motorcycle' && styles.routeModeChipActive]}
              onPress={() => changeRouteMode('motorcycle')}
            >
              <FontAwesome5 name="motorcycle" size={14} color={routeMode === 'motorcycle' ? 'white' : '#666'} />
              <Text style={[styles.routeModeChipText, routeMode === 'motorcycle' && styles.routeModeChipTextActive]}>
                Moto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.routeModeChip, routeMode === 'driving' && styles.routeModeChipActive]}
              onPress={() => changeRouteMode('driving')}
            >
              <FontAwesome5 name="car" size={14} color={routeMode === 'driving' ? 'white' : '#666'} />
              <Text style={[styles.routeModeChipText, routeMode === 'driving' && styles.routeModeChipTextActive]}>
                Car
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.routeModeChip, routeMode === 'bicycling' && styles.routeModeChipActive]}
              onPress={() => changeRouteMode('bicycling')}
            >
              <FontAwesome5 name="bicycle" size={14} color={routeMode === 'bicycling' ? 'white' : '#666'} />
              <Text style={[styles.routeModeChipText, routeMode === 'bicycling' && styles.routeModeChipTextActive]}>
                Bike
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.routeModeChip, routeMode === 'walking' && styles.routeModeChipActive]}
              onPress={() => changeRouteMode('walking')}
            >
              <FontAwesome5 name="walking" size={14} color={routeMode === 'walking' ? 'white' : '#666'} />
              <Text style={[styles.routeModeChipText, routeMode === 'walking' && styles.routeModeChipTextActive]}>
                Walk
              </Text>
            </TouchableOpacity>
          </View>

          {/* Start button */}
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

      {/* ─── Navigation Mode: Top Info Bar ─── */}
      {isNavigating && (
        <View style={styles.navTopInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.navTopDestination} numberOfLines={1}>
              {destinationName || 'Destination'}
            </Text>
            <Text style={styles.navTopDetails}>
              {routeDistance}{routeDuration && routeDuration !== '~' ? ` • ${routeDuration}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.navStopButton} onPress={stopNavigation}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Floating Controls ─── */}
      <View style={[styles.floatingControls, isNavigating && { bottom: 30 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={centerOnUser}>
          <MaterialIcons name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* ─── Buddies List (hidden during navigation) ─── */}
      {/* {!isNavigating && (
        <View style={styles.buddiesContainer}>
          <Text style={styles.buddiesTitle}>Buddies ({buddies.length})</Text>
          <FlatList
            horizontal
            data={buddies}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.buddyCard,
                  selectedBuddy?.id === item.id && styles.buddyCardSelected
                ]}
                onPress={() => navigateToBuddy(item)}
              >
                <Image source={{ uri: item.avatar }} style={styles.buddyCardAvatar} />
                <Text style={styles.buddyCardName}>{item.name}</Text>
                <Text style={styles.buddyCardDistance}>
                  {getDistance(
                    location.latitude,
                    location.longitude,
                    item.latitude,
                    item.longitude
                  )} km
                </Text>
                <View style={styles.batteryIndicator}>
                  <Ionicons 
                    name={item.battery > 20 ? "battery-half" : "battery-dead"} 
                    size={12} 
                    color={item.battery > 20 ? "#4CAF50" : "#FF5252"} 
                  />
                  <Text style={styles.batteryText}>{item.battery}%</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )} */}

      {/* ─── Selected Buddy Info Panel ─── */}
      {selectedBuddy && !isNavigating && !destination && (
        <View style={styles.selectedBuddyInfo}>
          <View style={styles.selectedBuddyHeader}>
            <Image source={{ uri: selectedBuddy.avatar }} style={styles.selectedBuddyAvatar} />
            <View style={styles.selectedBuddyDetails}>
              <Text style={styles.selectedBuddyName}>{selectedBuddy.name}</Text>
              <Text style={styles.selectedBuddyStatus}>
                {selectedBuddy.status} • {selectedBuddy.lastSeen}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.navigateToBuddyBtn}
              onPress={() => navigateToBuddy(selectedBuddy)}
            >
              <Text style={styles.navigateToBuddyText}>Go</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeBuddyBtn}
              onPress={() => setSelectedBuddy(null)}
            >
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  map: {
    width: width,
    height: height,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // ─── User Marker ──────────────────────────────────────────────────
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
  },
  userDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // ─── Buddy Markers ────────────────────────────────────────────────
  buddyMarker: {
    alignItems: 'center',
  },
  buddyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  calloutDistance: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  calloutStatus: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: '600',
  },
  // ─── Destination Marker ───────────────────────────────────────────
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    zIndex: -1,
  },
  // ─── Top Search Bar ───────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  },
  // ─── Search Results Dropdown ──────────────────────────────────────
  searchResultsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 6,
    maxHeight: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchResultBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  searchResultSecondary: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  // ─── Route Preview Panel ──────────────────────────────────────────
  routePreviewPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  routePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routePreviewDestName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  routePreviewSubtext: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  clearDestBtn: {
    padding: 4,
    marginLeft: 8,
  },
  routeModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  routeModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  routeModeChipActive: {
    backgroundColor: '#4285F4',
  },
  routeModeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  routeModeChipTextActive: {
    color: 'white',
  },
  startNavButton: {
    backgroundColor: '#34A853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startNavButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
  },
  startNavButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // ─── Navigation Mode Top Info ─────────────────────────────────────
  navTopInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212121',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navTopDestination: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  navTopDetails: {
    fontSize: 13,
    color: '#BDBDBD',
    marginTop: 2,
  },
  navStopButton: {
    backgroundColor: '#FF5252',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // ─── Floating Controls ────────────────────────────────────────────
  floatingControls: {
    position: 'absolute',
    right: 16,
    bottom: 280,
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // ─── Buddies List ─────────────────────────────────────────────────
  buddiesContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  buddiesTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buddyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buddyCardSelected: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  buddyCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },
  buddyCardName: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  buddyCardDistance: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
  },
  batteryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  // ─── Selected Buddy Info ──────────────────────────────────────────
  selectedBuddyInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  selectedBuddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBuddyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedBuddyDetails: {
    flex: 1,
    marginLeft: 12,
  },
  selectedBuddyName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedBuddyStatus: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  navigateToBuddyBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  navigateToBuddyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeBuddyBtn: {
    padding: 4,
  },
});