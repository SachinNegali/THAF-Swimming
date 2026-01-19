import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to login after 3 seconds
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.brandingContainer}>
          <Text
            style={[
              styles.brandingText,
              { color: Colors[colorScheme ?? "light"].tint },
            ]}
          >
            Wroom
          </Text>
          <Text
            style={[
              styles.brandingText,
              styles.brandingTextSecondary,
              { color: Colors[colorScheme ?? "light"].tint },
            ]}
          >
            wroom
          </Text>
        </View>
        <View style={styles.taglineContainer}>
          <Text
            style={[
              styles.tagline,
              { color: Colors[colorScheme ?? "light"].tabIconDefault },
            ]}
          >
            Your ride companion
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  brandingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandingText: {
    fontSize: 56,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  brandingTextSecondary: {
    fontWeight: "300",
    fontStyle: "italic",
  },
  taglineContainer: {
    marginTop: 10,
  },
  tagline: {
    fontSize: 16,
    letterSpacing: 1,
  },
});
