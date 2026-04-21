import { MaterialIcons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NavigationHeaderProps {
  destinationName: string;
  routeDistance: string;
  routeDuration: string;
  onStop: () => void;
}

export const NavigationHeader = memo(({
  destinationName,
  routeDistance,
  routeDuration,
  onStop,
}: NavigationHeaderProps) => (
  <View style={styles.navTopInfo}>
    <View style={{ flex: 1 }}>
      <Text style={styles.navTopDestination} numberOfLines={1}>{destinationName || 'Destination'}</Text>
      <Text style={styles.navTopDetails}>
        {routeDistance}{routeDuration && routeDuration !== '~' ? ` • ${routeDuration}` : ''}
      </Text>
    </View>
    <TouchableOpacity style={styles.navStopButton} onPress={onStop}>
      <MaterialIcons name="close" size={24} color="white" />
    </TouchableOpacity>
  </View>
));

const styles = StyleSheet.create({
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
});
