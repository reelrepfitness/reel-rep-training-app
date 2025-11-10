import { NativeTabs, Icon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS } from 'react-native';
import { Home, Calendar, ShoppingBag, User as UserIcon } from "lucide-react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { hebrew } from "@/constants/hebrew";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
          writingDirection: 'rtl' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: hebrew.tabs.home,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: hebrew.tabs.classes,
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: hebrew.tabs.shop,
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: hebrew.tabs.profile,
          tabBarIcon: ({ color, size }) => <UserIcon size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
