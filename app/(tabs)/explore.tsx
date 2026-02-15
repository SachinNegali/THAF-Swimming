import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Google Maps API Key - Replace with your actual key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

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

type RouteMode = 'driving' | 'bicycling' | 'walking';

export default function BuddyMapExpo() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [buddies, setBuddies] = useState(MOCK_BUDDIES);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedBuddy, setSelectedBuddy] = useState<typeof MOCK_BUDDIES[0] | null>(null);
  const [heading, setHeading] = useState(0);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

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
      // Request permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get current position
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation?.coords);
      
      // Start watching position
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
          
          // Broadcast to buddies (implement your API here)
          broadcastLocation(newLocation.coords);
          
          // If navigating, recenter map
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
    console.log('Broadcasting location:', coords);
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
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  // Fetch route from Google Directions API
  const fetchRoute = async (dest: { latitude: number; longitude: number }) => {
    if (!location) {
      Alert.alert('Location Error', 'Unable to get your current location');
      return;
    }

    setIsLoadingRoute(true);
    try {
      const origin = `${location.latitude},${location.longitude}`;
      const destination = `${dest.latitude},${dest.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${routeMode}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        
        // Set distance and duration
        const leg = route.legs[0];
        setRouteDistance(leg.distance.text);
        setRouteDuration(leg.duration.text);
      } else {
        // Fallback to straight line if API fails
        console.warn('Directions API failed, using straight line');
        generateStraightRoute(dest);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback to straight line
      generateStraightRoute(dest);
    } finally {
      setIsLoadingRoute(false);
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
    
    // Calculate approximate distance
    const dist = getDistance(location.latitude, location.longitude, dest.latitude, dest.longitude);
    setRouteDistance(`${dist} km`);
    setRouteDuration('~');
  };

  const handleMapPress = (e: any) => {
    if (!isNavigating) {
      const coord = e.nativeEvent.coordinate;
      setDestination(coord);
      fetchRoute(coord);
    }
  };

  const startNavigation = () => {
    if (!destination) {
      Alert.alert('Select Destination', 'Tap anywhere on the map to set your destination');
      return;
    }
    if (!location) {
      Alert.alert('Location Error', 'Unable to get your current location');
      return;
    }
    
    setIsNavigating(true);
    
    // Fit to show route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          destination
        ],
        { edgePadding: { top: 100, right: 50, bottom: 200, left: 50 }, animated: true }
      );
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRouteCoordinates([]);
    setRouteDistance('');
    setRouteDuration('');
    setSelectedBuddy(null);
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
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
    fetchRoute(dest);
    setSelectedBuddy(buddy);
    
    // Fit to show both
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: buddy.latitude, longitude: buddy.longitude }
        ],
        { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
      );
    }
  }, [location, routeMode]);

  const changeRouteMode = (mode: RouteMode) => {
    setRouteMode(mode);
    if (destination) {
      fetchRoute(destination);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    Keyboard.dismiss();
    
    try {
      // Use Google Geocoding API
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        const dest = {
          latitude: location.lat,
          longitude: location.lng
        };
        
        setDestination(dest);
        fetchRoute(dest);
        
        // Animate to destination
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
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

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'walking': return 'walking';
      case 'driving': return 'car';
      case 'cycling': return 'bicycle';
      default: return 'map-marker-alt';
    }
  };

  const getRouteModeIcon = (mode: RouteMode) => {
    switch(mode) {
      case 'driving': return 'car';
      case 'bicycling': return 'bicycle';
      case 'walking': return 'walking';
    }
  };

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
        {/* Custom User Location Marker */}
        {isNavigating && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={heading}
          >
            <View style={styles.userMarker}>
              <View style={styles.userPulse} />
              <View style={styles.userDot}>
                <MaterialIcons name="navigation" size={20} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {/* Buddy Markers */}
        {buddies.map(buddy => (
          <Marker
            key={buddy.id}
            coordinate={{
              latitude: buddy.latitude,
              longitude: buddy.longitude
            }}
            onPress={() => setSelectedBuddy(buddy)}
          >
            <View style={styles.buddyMarker}>
              <Image source={{ uri: buddy.avatar }} style={styles.buddyAvatar} />
              <View style={[styles.statusBadge, { backgroundColor: 
                buddy.status === 'walking' ? '#4CAF50' : 
                buddy.status === 'driving' ? '#2196F3' : '#FF9800'
              }]}>
                <FontAwesome5 name={getStatusIcon(buddy.status)} size={8} color="white" />
              </View>
            </View>
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
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.destinationMarker}>
              <Ionicons name="location-sharp" size={40} color="#FF5252" />
              <View style={styles.destinationPulse} />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeMode === 'driving' ? '#2196F3' : routeMode === 'bicycling' ? '#4CAF50' : '#FF9800'}
            strokeWidth={5}
          />
        )}

        {/* Connection lines to nearby buddies */}
        {buddies.map(buddy => {
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

      {/* Top Bar - Search */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {isSearching && <ActivityIndicator size="small" color="#2196F3" />}
        </View>
      </View>

      {/* Route Mode Selector */}
      {destination && (
        <View style={styles.routeModeContainer}>
          <TouchableOpacity
            style={[styles.routeModeButton, routeMode === 'driving' && styles.routeModeButtonActive]}
            onPress={() => changeRouteMode('driving')}
          >
            <FontAwesome5 name="car" size={18} color={routeMode === 'driving' ? 'white' : '#666'} />
            <Text style={[styles.routeModeText, routeMode === 'driving' && styles.routeModeTextActive]}>
              Car
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.routeModeButton, routeMode === 'bicycling' && styles.routeModeButtonActive]}
            onPress={() => changeRouteMode('bicycling')}
          >
            <FontAwesome5 name="bicycle" size={18} color={routeMode === 'bicycling' ? 'white' : '#666'} />
            <Text style={[styles.routeModeText, routeMode === 'bicycling' && styles.routeModeTextActive]}>
              Bike
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.routeModeButton, routeMode === 'walking' && styles.routeModeButtonActive]}
            onPress={() => changeRouteMode('walking')}
          >
            <FontAwesome5 name="walking" size={18} color={routeMode === 'walking' ? 'white' : '#666'} />
            <Text style={[styles.routeModeText, routeMode === 'walking' && styles.routeModeTextActive]}>
              Walk
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Route Info */}
      {destination && routeDistance && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoItem}>
            <MaterialIcons name="straighten" size={20} color="#666" />
            <Text style={styles.routeInfoText}>{routeDistance}</Text>
          </View>
          {routeDuration !== '~' && (
            <View style={styles.routeInfoItem}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <Text style={styles.routeInfoText}>{routeDuration}</Text>
            </View>
          )}
        </View>
      )}

      {/* Navigation Controls */}
      <View style={styles.navControls}>
        {!isNavigating ? (
          <TouchableOpacity 
            style={[styles.navButton, (!destination || isLoadingRoute) && styles.navButtonDisabled]} 
            onPress={startNavigation}
            disabled={!destination || isLoadingRoute}
          >
            {isLoadingRoute ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="navigation" size={24} color="white" />
                <Text style={styles.navButtonText}>Start</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navButton, styles.stopButton]} 
            onPress={stopNavigation}
          >
            <MaterialIcons name="close" size={24} color="white" />
            <Text style={styles.navButtonText}>Stop</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.iconButton} onPress={centerOnUser}>
          <MaterialIcons name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Buddies List */}
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

      {/* Selected Buddy Info */}
      {selectedBuddy && !isNavigating && (
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
  // User Marker Styles
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
  // Buddy Marker Styles
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
  // Destination Marker
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
  // Top Bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
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
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  // Route Mode Selector
  routeModeContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 6,
  },
  routeModeButtonActive: {
    backgroundColor: '#2196F3',
  },
  routeModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  routeModeTextActive: {
    color: 'white',
  },
  // Route Info
  routeInfoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 170 : 150,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 16,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Navigation Controls
  navControls: {
    position: 'absolute',
    right: 20,
    bottom: 280,
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  stopButton: {
    backgroundColor: '#FF5252',
  },
  navButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
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
  // Buddies List
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
  // Selected Buddy Info
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