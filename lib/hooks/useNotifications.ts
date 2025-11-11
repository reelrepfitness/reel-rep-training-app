// lib/hooks/useNotifications.ts
// React Hook for Push Notifications

import { useEffect, useState, useRef } from 'react';
import { Subscription } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { PushNotificationService } from '@/lib/services/push-notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    // Check initial permission status
    checkPermissionStatus();

    // Set up notification listeners
    notificationListener.current = PushNotificationService.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = PushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Register for push notifications when user logs in
    if (user?.id && permissionStatus === 'granted') {
      registerForPushNotifications();
    }
  }, [user?.id, permissionStatus]);

  const checkPermissionStatus = async () => {
    const status = await PushNotificationService.getPermissionStatus();
    setPermissionStatus(status);
    setIsLoading(false);
  };

  const registerForPushNotifications = async () => {
    try {
      const token = await PushNotificationService.registerForPushNotifications();
      if (token && user?.id) {
        setPushToken(token);
        await PushNotificationService.savePushToken(user.id, token);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    const token = await PushNotificationService.registerForPushNotifications();
    if (token) {
      setPushToken(token);
      setPermissionStatus('granted');

      if (user?.id) {
        await PushNotificationService.savePushToken(user.id, token);
      }

      return true;
    } else {
      setPermissionStatus('denied');
      return false;
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Handle different notification types
    switch (data.type) {
      case 'plates_earned':
        // Navigate to plates store or show details
        console.log('Plates earned notification tapped:', data);
        break;

      case 'achievement_unlocked':
        // Navigate to achievements screen
        console.log('Achievement notification tapped:', data);
        break;

      case 'class_reminder':
        // Navigate to classes screen
        console.log('Class reminder notification tapped:', data);
        break;

      default:
        console.log('Generic notification tapped:', data);
    }
  };

  const sendTestNotification = async () => {
    await PushNotificationService.sendLocalNotification({
      type: 'general',
      title: 'בדיקת התראות',
      body: 'ההתראות עובדות בהצלחה! 🎉',
    });
  };

  return {
    permissionStatus,
    pushToken,
    notification,
    isLoading,
    requestPermission,
    sendTestNotification,
  };
}
