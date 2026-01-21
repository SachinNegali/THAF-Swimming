import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface Trip {
  id: string;
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface TripCardProps {
  trip: Trip;
  style?: StyleProp<ViewStyle>;
}

export function TripCard({ trip, style }: TripCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.tabIconDefault + "30",
        },
        style,
      ]}
    >
      {/* Route Section */}
      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <Ionicons
            name="location"
            size={20}
            color={colors.tint}
            style={styles.locationIcon}
          />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationLabel, { color: colors.tabIconDefault }]}>
              From
            </Text>
            <Text style={[styles.locationText, { color: colors.text }]}>
              {trip.from}
            </Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dotLine, { borderColor: colors.tabIconDefault }]} />
        </View>

        <View style={styles.locationRow}>
          <Ionicons
            name="location"
            size={20}
            color="#ef4444"
            style={styles.locationIcon}
          />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationLabel, { color: colors.tabIconDefault }]}>
              To
            </Text>
            <Text style={[styles.locationText, { color: colors.text }]}>
              {trip.to}
            </Text>
          </View>
        </View>
      </View>

      {/* Dates Section */}
      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.tabIconDefault}
          />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(trip.startDate)}
          </Text>
        </View>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.tabIconDefault}
        />
        <View style={styles.dateItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.tabIconDefault}
          />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(trip.endDate)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.createdAt, { color: colors.tabIconDefault }]}>
          Created {formatTime(trip.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    marginLeft: 10,
    paddingVertical: 8,
  },
  dotLine: {
    borderLeftWidth: 2,
    borderStyle: "dotted",
    height: 20,
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    marginBottom: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  createdAt: {
    fontSize: 12,
  },
});
