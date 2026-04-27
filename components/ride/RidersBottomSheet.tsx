import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
// import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheet } from '../ui';
import { Buddy } from './types';

const { width } = Dimensions.get('window');

interface RidersBottomSheetProps {
  buddies: Buddy[];
  selectedBuddy: Buddy | null;
  userLocation: { latitude: number; longitude: number } | null;
  getDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => string;
  onBuddyPress: (buddy: Buddy) => void;
  rideId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

type SheetTab = 'riders' | 'qr';

export default function RidersBottomSheet({
  buddies,
  selectedBuddy,
  userLocation,
  getDistance,
  onBuddyPress,
  rideId,
  isOpen,
  setIsOpen,
}: RidersBottomSheetProps) {
//   const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '50%', '90%'], []);
  const [activeTab, setActiveTab] = useState<SheetTab>('riders');

//   const handleToggle = useCallback(() => {
//     if (isOpen) {
//       sheetRef.current?.snapToIndex(0); // back to nudge
//     } else {
//       sheetRef.current?.snapToIndex(1); // expand to 50%
//     }
//   }, [isOpen]);

//   const handleSheetChange = useCallback((index: number) => {
//     setIsOpen(index > 0); // 0 = nudge (closed), 1+ = open
//   }, []);

  const copyRideId = useCallback(() => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Trip code: ${rideId}`, ToastAndroid.LONG);
    } else {
      Alert.alert('Trip Code', rideId, [{ text: 'OK' }]);
    }
  }, [rideId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'driving': return 'motorcycle';
      case 'walking': return 'walking';
      case 'bicycling': return 'bicycle';
      default: return 'map-marker-alt';
    }
  };

  // Custom handle with chevron nudge
//   const renderHandle = useCallback(() => (
//     <TouchableOpacity
//       style={styles.handleContainer}
//       onPress={handleToggle}
//       activeOpacity={0.7}
//     >
//       <View style={styles.handleBar} />
//       <Ionicons
//         name={isOpen ? 'chevron-down' : 'chevron-up'}
//         size={18}
//         color="#9E9E9E"
//       />
//     </TouchableOpacity>
//   ), [isOpen, handleToggle]);

console.log("IN BUDDIESS.....", buddies)
  return (
    // <BottomSheet
    //   ref={sheetRef}
    //   index={0}
    //   snapPoints={snapPoints}
    //   onChange={handleSheetChange}
    //   enablePanDownToClose={false}
    //   backgroundStyle={styles.sheetBg}
    //   handleComponent={renderHandle}
    // //   backgroundComponent={() => <View style={{ height: 40, width: 30, backgroundColor: 'red', position: 'absolute', top: -10, left: 0, zIndex: 100 }} />}
    // //   backdropComponent={() => <View style={{flex: 1, backgroundColor: 'blue', height: '100%', width: '100%'}}/>}
    // >
    <BottomSheet
                visible={isOpen}
                onClose={() => setIsOpen(false)}
                snapPoints={snapPoints}
                scrollable={true}
              >
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'riders' && styles.tabActive]}
          onPress={() => setActiveTab('riders')}
        >
          <FontAwesome5
            name="users"
            size={14}
            color={activeTab === 'riders' ? '#FF6D00' : '#9E9E9E'}
          />
          <Text style={[styles.tabLabel, activeTab === 'riders' && styles.tabLabelActive]}>
            Riders ({buddies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.tabActive]}
          onPress={() => setActiveTab('qr')}
        >
          <MaterialIcons
            name="qr-code"
            size={16}
            color={activeTab === 'qr' ? '#FF6D00' : '#9E9E9E'}
          />
          <Text style={[styles.tabLabel, activeTab === 'qr' && styles.tabLabelActive]}>
            Join Ride
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'riders' ? (
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {buddies.map((buddy) => (
            <TouchableOpacity
              key={buddy.id}
              style={[
                styles.buddyRow,
                selectedBuddy?.id === buddy.id && styles.buddyRowSelected,
              ]}
              onPress={() => onBuddyPress(buddy)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: buddy.avatar }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{buddy.name}</Text>
                <View style={styles.meta}>
                  <FontAwesome5
                    name={getStatusIcon(buddy.status)}
                    size={10}
                    color="#757575"
                  />
                  <Text style={styles.status}>{buddy.status}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.lastSeen}>{buddy.lastSeen}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={styles.distance}>
                  {userLocation
                    ? `${getDistance(userLocation.latitude, userLocation.longitude, buddy.latitude, buddy.longitude)} km`
                    : '--'}
                </Text>
                <View style={styles.battery}>
                  <Ionicons
                    name={buddy.battery > 20 ? 'battery-half' : 'battery-dead'}
                    size={14}
                    color={buddy.battery > 20 ? '#4CAF50' : '#FF5252'}
                  />
                  <Text style={[styles.batteryText, { color: buddy.battery > 20 ? '#4CAF50' : '#FF5252' }]}>
                    {buddy.battery}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
      ) : (
        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            <QRCode
              value={`thaf://join-ride/${rideId}`}
              size={200}
              color="#212121"
              backgroundColor="white"
            />
          </View>
          <Text style={styles.qrTitle}>Scan to Join This Ride</Text>
          <Text style={styles.qrHint}>
            Others can scan this QR with any scanner app, or enter the code below on the map screen
          </Text>
          <TouchableOpacity style={styles.rideIdBadge} activeOpacity={0.7} onPress={copyRideId}>
            <Text style={styles.rideIdLabel}>TRIP CODE</Text>
            <View style={styles.rideIdRow}>
              <Text style={styles.rideIdValue}>{rideId}</Text>
              <Ionicons name="copy-outline" size={16} color="#9E9E9E" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // Handle
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FAFAFA',
  },
  handleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DADADA',
    marginBottom: 4,
  },
  sheetBg: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  tabLabelActive: {
    color: '#212121',
  },
  // Riders list
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  buddyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  buddyRowSelected: {
    borderWidth: 2,
    borderColor: '#FF6D00',
    backgroundColor: '#FFF3E0',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#EEEEEE',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  status: {
    fontSize: 12,
    color: '#757575',
    textTransform: 'capitalize',
  },
  dot: {
    fontSize: 10,
    color: '#BDBDBD',
  },
  lastSeen: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  right: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  battery: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  batteryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // QR Tab
  qrContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  qrHint: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  qrCard: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  rideIdBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  rideIdLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  rideIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rideIdValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    letterSpacing: 2,
  },
});
