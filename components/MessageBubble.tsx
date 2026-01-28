import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Message } from "@/types/chatTypes";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = React.memo(({ message }: MessageBubbleProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const renderContent = () => {
    switch (message.type) {
      case "text":
        return (
          <Text style={[styles.messageText, { color: message.isCurrentUser ? "#fff" : colors.text }]}>
            {message.content}
          </Text>
        );

      case "image":
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[styles.messageText, { color: message.isCurrentUser ? "#fff" : colors.text, marginTop: 8 }]}>
                {message.content}
              </Text>
            )}
          </View>
        );

      case "audio":
        return (
          <View style={styles.audioContainer}>
            <Ionicons name="play-circle" size={32} color={message.isCurrentUser ? "#fff" : colors.tint} />
            <View style={styles.audioInfo}>
              <View style={styles.audioWave} />
              <Text style={[styles.audioDuration, { color: message.isCurrentUser ? "#fff" : colors.text }]}>
                0:45
              </Text>
            </View>
          </View>
        );

      case "file":
        return (
          <View style={styles.fileContainer}>
            <Ionicons name="document" size={32} color={message.isCurrentUser ? "#fff" : colors.tint} />
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: message.isCurrentUser ? "#fff" : colors.text }]}>
                {message.fileName}
              </Text>
              <Text style={[styles.fileSize, { color: message.isCurrentUser ? "#fff" : colors.tabIconDefault }]}>
                {message.fileSize}
              </Text>
            </View>
          </View>
        );

      case "link":
        return (
          <Pressable onPress={() => handleLinkPress(message.content)}>
            <View style={styles.linkContainer}>
              {message.linkPreview?.imageUrl && (
                <Image
                  source={{ uri: message.linkPreview.imageUrl }}
                  style={styles.linkImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.linkInfo}>
                <Text style={[styles.linkTitle, { color: message.isCurrentUser ? "#fff" : colors.text }]}>
                  {message.linkPreview?.title || message.content}
                </Text>
                {message.linkPreview?.description && (
                  <Text style={[styles.linkDescription, { color: message.isCurrentUser ? "#fff" : colors.tabIconDefault }]} numberOfLines={2}>
                    {message.linkPreview.description}
                  </Text>
                )}
                <Text style={[styles.linkUrl, { color: message.isCurrentUser ? "#fff" : colors.tint }]}>
                  {message.content}
                </Text>
              </View>
            </View>
          </Pressable>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, message.isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer]}>
      {!message.isCurrentUser && (
        <Text style={[styles.senderName, { color: colors.tint }]}>
          {message.senderName}
        </Text>
      )}
      <View
        style={[
          styles.bubble,
          message.isCurrentUser
            ? { backgroundColor: colors.tint }
            : { backgroundColor: colorScheme === "dark" ? "#2a2a2a" : "#f0f0f0" },
        ]}
      >
        {renderContent()}
        <Text style={[styles.timestamp, { color: message.isCurrentUser ? "#fff" : colors.tabIconDefault }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: "80%",
  },
  currentUserContainer: {
    alignSelf: "flex-end",
  },
  otherUserContainer: {
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  imageContainer: {
    width: "100%",
  },
  messageImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioWave: {
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    marginBottom: 4,
  },
  audioDuration: {
    fontSize: 12,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  linkContainer: {
    width: "100%",
  },
  linkImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  linkInfo: {
    gap: 4,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  linkDescription: {
    fontSize: 12,
  },
  linkUrl: {
    fontSize: 11,
    marginTop: 4,
  },
});
