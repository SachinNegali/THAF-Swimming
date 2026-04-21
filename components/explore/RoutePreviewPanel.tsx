import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RouteMode } from './types';

const ROUTE_MODE_CONFIG: { mode: RouteMode; icon: string; label: string }[] = [
  { mode: 'motorcycle', icon: 'motorcycle', label: 'Moto' },
  { mode: 'driving', icon: 'car', label: 'Car' },
  { mode: 'bicycling', icon: 'bicycle', label: 'Bike' },
  { mode: 'walking', icon: 'walking', label: 'Walk' },
];

interface RoutePreviewPanelProps {
  destinationName: string;
  routeDistance: string;
  routeDuration: string;
  routeMode: RouteMode;
  isLoadingRoute: boolean;
  onChangeMode: (mode: RouteMode) => void;
  onStartNavigation: () => void;
  onClearDestination: () => void;
}

export const RoutePreviewPanel = memo(({
  destinationName,
  routeDistance,
  routeDuration,
  routeMode,
  isLoadingRoute,
  onChangeMode,
  onStartNavigation,
  onClearDestination,
}: RoutePreviewPanelProps) => (
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
      <TouchableOpacity onPress={onClearDestination} style={styles.clearDestBtn}>
        <Ionicons name="close" size={22} color="#666" />
      </TouchableOpacity>
    </View>

    <View style={styles.routeModeRow}>
      {ROUTE_MODE_CONFIG.map(({ mode, icon, label }) => (
        <TouchableOpacity
          key={mode}
          style={[styles.routeModeChip, routeMode === mode && styles.routeModeChipActive]}
          onPress={() => onChangeMode(mode)}
        >
          <FontAwesome5 name={icon} size={14} color={routeMode === mode ? 'white' : '#666'} />
          <Text style={[styles.routeModeChipText, routeMode === mode && styles.routeModeChipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity
      style={[styles.startNavButton, isLoadingRoute && styles.startNavButtonDisabled]}
      onPress={onStartNavigation}
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
));

const styles = StyleSheet.create({
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
});
