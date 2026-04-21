import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Trip } from '../../types/api';

interface NoRideCardProps {
  onStartQuickRide: () => void;
  plannedTrips: Trip[];
  onStartTripRide: (trip: Trip) => void;
  joinTripCode: string;
  onJoinTripCodeChange: (code: string) => void;
  onJoinByCode: () => void;
  isJoiningTrip: boolean;
}

export const NoRideCard = memo(({
  onStartQuickRide,
  plannedTrips,
  onStartTripRide,
  joinTripCode,
  onJoinTripCodeChange,
  onJoinByCode,
  isJoiningTrip,
}: NoRideCardProps) => (
  <View style={styles.noRideCard}>
    <Text style={styles.noRideTitle}>Not in a ride</Text>
    <Text style={styles.noRideSubtitle}>Start sharing your location with buddies</Text>
    <View style={styles.noRideActions}>
      <TouchableOpacity style={styles.quickRideBtn} onPress={onStartQuickRide}>
        <Ionicons name="flash" size={16} color="white" />
        <Text style={styles.quickRideBtnText}>Quick Ride</Text>
      </TouchableOpacity>

      {plannedTrips.map((trip) => (
        <TouchableOpacity
          key={trip.id}
          style={styles.tripRideBtn}
          onPress={() => onStartTripRide(trip)}
        >
          <Ionicons name="map" size={16} color="#2196F3" />
          <Text style={styles.tripRideBtnText} numberOfLines={1}>{trip.title}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.joinCodeRow}>
      <View style={styles.joinCodeInputWrap}>
        <Ionicons name="key-outline" size={16} color="#9E9E9E" />
        <TextInput
          style={styles.joinCodeInput}
          placeholder="Enter trip code..."
          placeholderTextColor="#BDBDBD"
          value={joinTripCode}
          onChangeText={onJoinTripCodeChange}
          onSubmitEditing={onJoinByCode}
          returnKeyType="go"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity
        style={[styles.joinCodeBtn, (!joinTripCode.trim() || isJoiningTrip) && { opacity: 0.5 }]}
        onPress={onJoinByCode}
        disabled={!joinTripCode.trim() || isJoiningTrip}
      >
        {isJoiningTrip ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.joinCodeBtnText}>Join</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
));

const styles = StyleSheet.create({
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
  joinCodeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0', paddingTop: 12,
  },
  joinCodeInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, height: 40,
  },
  joinCodeInput: { flex: 1, fontSize: 14, color: '#212121', paddingVertical: 0 },
  joinCodeBtn: {
    backgroundColor: '#2196F3', paddingHorizontal: 18, height: 40,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  joinCodeBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
});
