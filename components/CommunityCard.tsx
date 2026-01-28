import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Community } from "@/types/chatTypes";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface CommunityCardProps {
  community: Community;
  onJoinToggle: (communityId: string) => void;
}

export const CommunityCard = React.memo(({ community, onJoinToggle }: CommunityCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.tabIconDefault + "30",
        },
      ]}
    >
      {community.imageUrl ? (
        <Image source={{ uri: community.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.tint }]}>
          <Ionicons name="people" size={40} color="#000" />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {community.name}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: colors.tint + "20" }]}>
            <Text style={[styles.categoryText, { color: colors.tint }]}>
              {community.category}
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: colors.tabIconDefault }]} numberOfLines={2}>
          {community.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.memberInfo}>
            <Ionicons name="people-outline" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.memberCount, { color: colors.tabIconDefault }]}>
              {community.memberCount.toLocaleString()} members
            </Text>
          </View>

          <Pressable
            style={[
              styles.joinButton,
              {
                backgroundColor: community.isJoined ? "transparent" : colors.tint,
                borderWidth: community.isJoined ? 1 : 0,
                borderColor: colors.tint,
              },
            ]}
            onPress={() => onJoinToggle(community.id)}
          >
            <Text
              style={[
                styles.joinButtonText,
                { color: community.isJoined ? colors.tint : "#fff" },
              ]}
            >
              {community.isJoined ? "Joined" : "Join"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 150,
  },
  imagePlaceholder: {
    width: "100%",
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberCount: {
    fontSize: 13,
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
