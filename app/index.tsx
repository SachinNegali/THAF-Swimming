import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  const { isAuthenticated, isInitialized } = useSelector((state: any) => state.auth);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Once auth is initialized, navigate based on authentication status
    if (isInitialized) {
      // Small delay just to let the animation finish or feel natural
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, isAuthenticated]);

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
