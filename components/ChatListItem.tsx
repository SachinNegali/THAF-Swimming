import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Chat } from "@/types/chatTypes";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ChatListItemProps {
  chat: Chat;
}

export const ChatListItem = React.memo(({ chat }: ChatListItemProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handlePress = () => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: chat.id,
        name: chat.name,
        isGroup: chat.isGroup.toString(),
        avatar: chat.avatar || "",
        isOnline: chat.isOnline?.toString() || "false",
        participants: chat.participants ? JSON.stringify(chat.participants) : "",
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? colorScheme === "dark"
              ? "#2a2a2a"
              : "#f5f5f5"
            : colors.background,
        },
      ]}
      onPress={handlePress}
    >
      <View style={styles.avatarContainer}>
        {chat.avatar ? (
          <Image source={{ uri: chat.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
            <Text style={styles.avatarText}>
              {chat.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        {!chat.isGroup && chat.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
            {formatTime(chat.timestamp)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.lastMessage,
              { color: colors.tabIconDefault },
              chat.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.tint }]}>
              <Text style={styles.badgeText}>
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    // color: "#fff",
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ade80",
    borderWidth: 2,
    borderColor: "#fff",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    // color: "#fff",
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },
});
