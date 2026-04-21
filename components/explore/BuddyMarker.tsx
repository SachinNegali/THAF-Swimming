import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Buddy } from '../ride/types';

function getStatusIcon(status: string) {
  switch (status) {
    case 'walking':  return 'walking';
    case 'driving':  return 'car';
    case 'cycling':  return 'bicycle';
    default:         return 'map-marker-alt';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'walking':  return '#4CAF50';
    case 'driving':  return '#2196F3';
    default:         return '#FF9800';
  }
}

export const BuddyMarkerView = React.memo(({ buddy }: { buddy: Buddy }) => (
  <View style={styles.buddyMarker}>
    <Image source={{ uri: buddy.avatar }} style={styles.buddyAvatar} />
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(buddy.status) }]}>
      <FontAwesome5 name={getStatusIcon(buddy.status)} size={8} color="white" />
    </View>
  </View>
));

const styles = StyleSheet.create({
  buddyMarker: { alignItems: 'center' },
  buddyAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  statusBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white',
  },
});
