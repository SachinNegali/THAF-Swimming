import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  BuddyMapMarker,
  type LatLng,
  ROUTE_MODE_COLORS,
  type RouteMode,
  type TrafficSegment,
} from '../explore';
import type { Buddy as TrackedBuddy } from '../ride/types';

interface PaperMapProps {
  mapRef: RefObject<MapView | null>;
  location: { latitude: number; longitude: number; heading?: number | null } | null;
  destination: LatLng | null;
  buddies: TrackedBuddy[];
  routeCoordinates: LatLng[];
  trafficSegments: TrafficSegment[];
  routeMode: RouteMode;
  isNavigating: boolean;
  heading: number;
  getDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => string;
  onMapPress?: (e: any) => void;
  onBuddyPress: (b: TrackedBuddy) => void;
  onCalloutPress: (b: TrackedBuddy) => void;
}

export const PaperMap = React.memo(({
  mapRef,
  location,
  destination,
  buddies,
  routeCoordinates,
  trafficSegments,
  routeMode,
  isNavigating,
  heading,
  getDistance,
  onMapPress,
  onBuddyPress,
  onCalloutPress,
}: PaperMapProps) => {
  if (!location) return <View style={styles.wrap} />;

  return (
    <MapView
      ref={mapRef}
      style={styles.wrap}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={onMapPress}
      showsUserLocation={!isNavigating}
      showsMyLocationButton={false}
      showsCompass
      showsTraffic
      mapType="standard"
    >
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

      {buddies.map((buddy) => (
        <BuddyMapMarker
          key={buddy.id}
          buddy={buddy}
          distanceKm={getDistance(location.latitude, location.longitude, buddy.latitude, buddy.longitude)}
          onPress={() => onBuddyPress(buddy)}
          onCalloutPress={() => onCalloutPress(buddy)}
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
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="rgba(0,0,0,0.15)"
            strokeWidth={10}
            lineCap="round"
            lineJoin="round"
          />
          {trafficSegments.map((seg, i) =>
            seg.coordinates.length >= 2 ? (
              <Polyline
                key={`traffic-${i}`}
                coordinates={seg.coordinates}
                strokeColor={seg.color}
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            ) : null,
          )}
        </>
      ) : routeCoordinates.length > 0 ? (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={ROUTE_MODE_COLORS[routeMode]}
          strokeWidth={6}
          lineCap="round"
          lineJoin="round"
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
            strokeColor="rgba(33, 150, 243, 0.3)"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />
        ) : null;
      })}
    </MapView>
  );
});

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  userMarker: { alignItems: 'center', justifyContent: 'center' },
  userPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(33,150,243,0.3)',
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
  destinationMarker: { alignItems: 'center', justifyContent: 'center' },
  destinationPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,82,82,0.2)',
    zIndex: -1,
  },
});
