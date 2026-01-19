import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleSuccessfulLogin(response.authentication);
    } else if (response?.type === "error") {
      handleLoginError();
    }
  }, [response]);

  const handleSuccessfulLogin = async (authentication: any) => {
    try {
      setLoading(true);
      // Store the token or user info as needed
      console.log("Auth token:", authentication?.accessToken);

      // Navigate to tabs after successful login
      setTimeout(() => {
        router.replace("/(tabs)");
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      handleLoginError();
    }
  };

  const handleLoginError = () => {
    setLoading(false);
    Alert.alert(
      "Login Failed",
      "Unable to sign in with Google. Please try again.",
      [{ text: "OK" }]
    );
  };

  const handleGoogleLogin = async () => {
    // try {
    //   setLoading(true);
    //   await promptAsync();
    // } catch (error) {
    //   console.error("Error initiating login:", error);
    //   handleLoginError();
    // }

    router.replace("/(tabs)");
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Welcome to
          </Text>
          <Text
            style={[
              styles.brandTitle,
              { color: Colors[colorScheme ?? "light"].tint },
            ]}
          >
            Wroom wroom
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: Colors[colorScheme ?? "light"].tabIconDefault },
            ]}
          >
            Sign in to continue your journey
          </Text>
        </View>

        {/* Login Button */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={Colors[colorScheme ?? "light"].tint}
              />
              <Text
                style={[
                  styles.loadingText,
                  { color: Colors[colorScheme ?? "light"].tabIconDefault },
                ]}
              >
                Signing in...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  backgroundColor: Colors[colorScheme ?? "light"].tint,
                  opacity: !request ? 0.5 : 1,
                },
              ]}
              onPress={handleGoogleLogin}
              disabled={!request || loading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: Colors[colorScheme ?? "light"].tabIconDefault },
            ]}
          >
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    gap: 48,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    minHeight: 60,
  },
  googleButton: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
