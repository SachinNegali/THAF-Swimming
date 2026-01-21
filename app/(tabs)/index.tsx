import { LocationSearchBar } from "@/components/LocationSearchBar";
import { Trip, TripCard } from "@/components/TripCard";
import { BottomSheet, Button } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Mock trip data
const MOCK_TRIPS: Trip[] = [
  {
    id: "1",
    from: "San Francisco, CA",
    to: "Los Angeles, CA",
    startDate: "2026-02-15T09:00:00",
    endDate: "2026-02-17T18:00:00",
    createdAt: "2026-01-19T10:30:00",
  },
  {
    id: "2",
    from: "New York, NY",
    to: "Boston, MA",
    startDate: "2026-03-01T08:00:00",
    endDate: "2026-03-03T20:00:00",
    createdAt: "2026-01-18T14:20:00",
  },
  {
    id: "3",
    from: "Seattle, WA",
    to: "Portland, OR",
    startDate: "2026-02-20T10:00:00",
    endDate: "2026-02-22T16:00:00",
    createdAt: "2026-01-17T09:15:00",
  },
  {
    id: "4",
    from: "Chicago, IL",
    to: "Detroit, MI",
    startDate: "2026-03-10T07:00:00",
    endDate: "2026-03-12T19:00:00",
    createdAt: "2026-01-16T16:45:00",
  },
  {
    id: "5",
    from: "Miami, FL",
    to: "Orlando, FL",
    startDate: "2026-02-25T11:00:00",
    endDate: "2026-02-27T17:00:00",
    createdAt: "2026-01-15T11:00:00",
  },
];

const HEADER_HEIGHT = 180;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("down");
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        // Determine scroll direction
        if (diff > 0 && scrollDirection.current !== "up") {
          // Scrolling up - hide header
          scrollDirection.current = "up";
          Animated.timing(headerTranslateY, {
            toValue: -HEADER_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (diff < 0 && scrollDirection.current !== "down") {
          // Scrolling down - show header
          scrollDirection.current = "down";
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.title, { color: colors.text }]}>
        Your Trips
      </Text>
      <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
        {MOCK_TRIPS.length} trips planned
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Trip }) => (
    <TripCard trip={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
        No trips found
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
        Start planning your next adventure!
      </Text>
    </View>
  );

  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header with Search Bars */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Find Your Ride
          </Text>
          <LocationSearchBar
            placeholder="From location"
            value={fromLocation}
            onChangeText={setFromLocation}
            style={styles.searchBar}
          />
          <LocationSearchBar
            placeholder="To location"
            value={toLocation}
            onChangeText={setToLocation}
            style={styles.searchBar}
          />
        </View>
        <Button textStyle={{color: 'red'}} title="Open Sheet" onPress={() => setIsOpen(true)} />
      </Animated.View>
      {/* Trip List */}
      <FlatList
        data={MOCK_TRIPS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: HEADER_HEIGHT + 20 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
      <View>
      
      <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={["25%", "50%", "90%"]}
      >
        <View style={{ padding: 20 }}>
          <Text>Bottom Sheet Content</Text>
          <Button title="Close" onPress={() => setIsOpen(false)} />
        </View>
      </BottomSheet>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 60,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  listHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});
