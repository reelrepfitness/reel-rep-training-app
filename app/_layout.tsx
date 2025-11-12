import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nManager, Platform } from "react-native";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkoutProvider } from "@/contexts/WorkoutContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { ClassesProvider } from "@/contexts/ClassesContext";
import { AchievementsProvider } from "@/contexts/AchievementsContext";

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "חזור",
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen
        name="workout-log"
        options={{
          presentation: "modal",
          title: "רשום אימון",
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          presentation: "card",
          title: "הישגים",
        }}
      />
      <Stack.Screen
        name="client-dashboard"
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <WorkoutProvider>
            <ShopProvider>
              <ClassesProvider>
                <AchievementsProvider>
                  <RootLayoutNav />
                </AchievementsProvider>
              </ClassesProvider>
            </ShopProvider>
          </WorkoutProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
