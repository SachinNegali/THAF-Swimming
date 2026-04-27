import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';
import type { Buddy } from '../ride/types';

const PIN_COLOR = '#E53935';

export const BuddyMarkerView = React.memo(({ buddy }: { buddy: Buddy }) => {
  const initial = (buddy.name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <View style={styles.pin}>
      <View style={styles.pinHead}>
        <View style={styles.pinInner}>
          <Text style={styles.pinInitial}>{initial}</Text>
        </View>
      </View>
      <View style={styles.pinTailOutline} />
      <View style={styles.pinTail} />
    </View>
  );
});

type BuddyMapMarkerProps = {
  buddy: Buddy;
  distanceKm: string;
  onPress: () => void;
  onCalloutPress: () => void;
};

export const BuddyMapMarker = React.memo(({
  buddy,
  distanceKm,
  onPress,
  onCalloutPress,
}: BuddyMapMarkerProps) => {
  const [tracksChanges, setTracksChanges] = useState(true);

  useEffect(() => {
    setTracksChanges(true);
  }, [buddy.name]);

  useEffect(() => {
    if (!tracksChanges) return;
    const t = setTimeout(() => setTracksChanges(false), 800);
    return () => clearTimeout(t);
  }, [tracksChanges]);

  return (
    <Marker
      coordinate={{ latitude: buddy.latitude, longitude: buddy.longitude }}
      onPress={onPress}
      tracksViewChanges={tracksChanges}
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: -22 }}
    >
      <BuddyMarkerView buddy={buddy} />
      <Callout tooltip onPress={onCalloutPress}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutName}>{buddy.name}</Text>
          <Text style={styles.calloutDistance}>{distanceKm} km away</Text>
          {buddy.speed !== undefined && (
            <Text style={styles.calloutStatus}>{buddy.speed} km/h</Text>
          )}
          <Text style={styles.calloutStatus}>Tap to navigate</Text>
        </View>
      </Callout>
    </Marker>
  );
});

const HEAD_SIZE = 40;
const TAIL_SIZE = 14;

const styles = StyleSheet.create({
  pin: {
    width: HEAD_SIZE,
    alignItems: 'center',
    paddingBottom: TAIL_SIZE,
  },
  pinHead: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: HEAD_SIZE / 2,
    backgroundColor: PIN_COLOR,
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
  pinInner: {
    width: HEAD_SIZE - 10,
    height: HEAD_SIZE - 10,
    borderRadius: (HEAD_SIZE - 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pinTailOutline: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_SIZE / 2 + 2,
    borderRightWidth: TAIL_SIZE / 2 + 2,
    borderTopWidth: TAIL_SIZE + 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  pinTail: {
    position: 'absolute',
    bottom: 2,
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_SIZE / 2,
    borderRightWidth: TAIL_SIZE / 2,
    borderTopWidth: TAIL_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PIN_COLOR,
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
  calloutName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  calloutDistance: { color: '#666', fontSize: 12, marginBottom: 4 },
  calloutStatus: { color: '#2196F3', fontSize: 11, fontWeight: '600' },
});
