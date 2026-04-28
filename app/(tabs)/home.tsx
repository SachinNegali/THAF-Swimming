import React, { useCallback } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DEMO_FEATURED, DEMO_RIDES } from '../../data/demoData';
import { colors, fonts } from '../../theme';
import { FeaturedRide, Ride } from '../../types';
// import { StatusBar } from '../../components/co/StatusBar';
import { router } from 'expo-router';
import { Avatar } from '../../components/core/Avatar';
import { Kicker } from '../../components/core/Kicker';
import { FeaturedRideCard } from '../../components/home/FeaturedRideCard';
import { LiveTripCard } from '../../components/home/LiveTripCard';
import { RideRow } from '../../components/home/RideRow';
import { IconArrowRight, IconSearch } from '../../icons/Icons';

interface ExploreScreenProps {
  onOpenRide: (ride: Ride | FeaturedRide) => void;
  onTabChange: (tab: string) => void;
  onCreate: () => void;
}

const ExploreScreen = React.memo(({ onOpenRide, onTabChange, onCreate }: ExploreScreenProps) => {
  const handleTrackPress = useCallback(() => onTabChange('maps'), [onTabChange]);
  const handleFeaturedPress = useCallback(() => onOpenRide(DEMO_FEATURED), [onOpenRide]);
  // const handleRidePress = useCallback((ride: Ride) => () => onOpenRide(ride), [onOpenRide]);
  const handleRidePress = () => router.push("/tripDetailsScreen");

  return (
    <SafeAreaView style={styles.screen}>
      {/* <StatusBar /> */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Kicker>Friday · 19 Apr</Kicker>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>Evening, </Text>
              <Text style={styles.greetingItalic}>Ravi</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push("/searchScreen")}>
              <IconSearch size={18} color={colors.ink}/>
            </Pressable>
            <Avatar name="Ravi Negali" size={36} tone={2} />
          </View>
        </View>

        {/* Live Trip */}
        <View style={styles.section}>
          <LiveTripCard onTrackPress={handleTrackPress} />
        </View>

        {/* Featured */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Kicker>Featured this week</Kicker>
            <Kicker style={{ color: colors.ink }}>01 / 04</Kicker>
          </View>
          <FeaturedRideCard ride={DEMO_FEATURED} onPress={handleFeaturedPress} />
        </View>

        {/* Ride List */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { alignItems: 'flex-end', marginBottom: 4 }]}>
            <View>
              <Kicker>Recommended for you</Kicker>
              <Text style={styles.listTitle}>Open rides</Text>
            </View>
            <Pressable style={styles.viewAll}>
              <Text style={styles.viewAllText}>View all</Text>
              <IconArrowRight size={14} color={colors.n600} />
            </Pressable>
          </View>
        </View>

        <View style={styles.list}>
          {DEMO_RIDES.map((r, i) => (
            // <RideRow key={r.id} r={r} onPress={handleRidePress(r)} index={i} />
            <RideRow key={r.id} r={r} onPress={handleRidePress} index={i} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  greeting: {
    fontFamily: fonts.sans,
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.84,
    color: colors.ink,
  },
  greetingItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 28,
    color: colors.ink,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  section: {
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.4,
    color: colors.ink,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: colors.n600,
    fontFamily: fonts.sans,
    marginRight: 4,
  },
  list: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 10
  },
});

export default ExploreScreen;