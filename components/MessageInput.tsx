import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function MessageInput({ onSend, placeholder = "Type a message..." }: MessageInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.tabIconDefault + "30" }]}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="add-circle" size={28} color={colors.tint} />
        </Pressable>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === "dark" ? "#2a2a2a" : "#f0f0f0",
              color: colors.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.tabIconDefault}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />

        <Pressable
          style={[styles.sendButton, { backgroundColor: message.trim() ? colors.tint : colors.tabIconDefault }]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
