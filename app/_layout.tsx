import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initSentry, routingInstrumentation, Sentry } from "@/lib/sentry";
import { AppProviders } from "@/providers/AppProviders";

initSentry();

function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef.current) {
      routingInstrumentation.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AppProviders>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
                <Stack.Screen name="groupInfo" options={{ headerShown: false }} />
                <Stack.Screen name="tripDetails" options={{ headerShown: false}}/>
                <Stack.Screen name="searchTrips" options={{ headerShown: false }} />
                <Stack.Screen
                  name="tripForm"
                  options={{
                    headerShown: false,
                    presentation: 'pageSheet'
                  }}
                />
                <Stack.Screen
                  name="medicalEmergency"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="join-ride/[id]"
                  options={{ headerShown: false }}
                />
                {/*New Flow screens*/}
              <Stack.Screen name="searchScreen" options={{ headerShown: false }} />
              <Stack.Screen name="tripDetailsScreen" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </AppProviders>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
