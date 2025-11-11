import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { hebrew } from "@/constants/hebrew";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, router]);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>{hebrew.tabs.home}</Label>
        <Icon sf="house.fill" drawable="ic_home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="classes">
        <Label>{hebrew.tabs.classes}</Label>
        <Icon sf="calendar" drawable="ic_calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <Label>{hebrew.tabs.shop}</Label>
        <Icon sf="bag.fill" drawable="ic_shop" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>{hebrew.tabs.profile}</Label>
        <Icon sf="person.fill" drawable="ic_profile" />
      </NativeTabs.Trigger>
      {isAdmin && (
        <NativeTabs.Trigger name="boss">
          <Label>בוס</Label>
          <Icon sf="crown.fill" drawable="ic_admin" />
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
