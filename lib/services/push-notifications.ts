// lib/services/push-notifications.ts
// Push Notification Service for iOS and Android

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/constants/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'plates_earned' | 'achievement_unlocked' | 'class_reminder' | 'subscription_expiring' | 'general';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushNotificationService {
  private static pushToken: string | null = null;

  /**
   * Request notification permissions and get push token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      });

      this.pushToken = tokenData.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#da4477',
        });

        // Plates notification channel
        await Notifications.setNotificationChannelAsync('plates', {
          name: 'Plates Earned',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#da4477',
          sound: 'default',
        });

        // Achievement notification channel
        await Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4ade80',
          sound: 'default',
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save push token to Supabase for the current user
   */
  static async savePushToken(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform',
        });

      if (error) throw error;

      console.log('Push token saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  /**
   * Remove push token from Supabase (on logout)
   */
  static async removePushToken(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', Platform.OS);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  }

  /**
   * Send a local notification immediately
   */
  static async sendLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: data.type,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Schedule a notification for later
   */
  static async scheduleNotification(
    data: NotificationData,
    trigger: Date | number
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: data.type,
        },
        trigger:
          typeof trigger === 'number'
            ? { seconds: trigger }
            : { date: trigger },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set up notification listeners
   */
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  static addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Check notification permissions status
   */
  static async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  }

  /**
   * Send plates earned notification
   */
  static async notifyPlatesEarned(amount: number, reason: string): Promise<void> {
    const titles = [
      '🏆 פלטות הורווחו!',
      '🎉 יופי! קיבלת פלטות!',
      '⭐ פלטות חדשות!',
      '💪 עבודה נהדרת!',
    ];

    const title = titles[Math.floor(Math.random() * titles.length)];

    await this.sendLocalNotification({
      type: 'plates_earned',
      title,
      body: `זכית ב-${amount} פלטות ${reason}! 🎁`,
      data: {
        amount,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send achievement unlocked notification
   */
  static async notifyAchievementUnlocked(
    achievementName: string,
    plates: number
  ): Promise<void> {
    await this.sendLocalNotification({
      type: 'achievement_unlocked',
      title: '🏆 הישג חדש הושג!',
      body: `סיימת את "${achievementName}" וקיבלת ${plates} פלטות!`,
      data: {
        achievementName,
        plates,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send class reminder notification
   */
  static async scheduleClassReminder(
    className: string,
    classTime: Date,
    minutesBefore: number = 60
  ): Promise<string | null> {
    const reminderTime = new Date(classTime.getTime() - minutesBefore * 60 * 1000);

    return await this.scheduleNotification(
      {
        type: 'class_reminder',
        title: '⏰ תזכורת לשיעור',
        body: `השיעור "${className}" מתחיל בעוד ${minutesBefore} דקות!`,
        data: {
          className,
          classTime: classTime.toISOString(),
        },
      },
      reminderTime
    );
  }

  /**
   * Send subscription expiring notification
   */
  static async notifySubscriptionExpiring(daysLeft: number): Promise<void> {
    await this.sendLocalNotification({
      type: 'subscription_expiring',
      title: '⚠️ המנוי שלך עומד לפוג',
      body: `נותרו ${daysLeft} ימים למנוי שלך. חדש עכשיו!`,
      data: {
        daysLeft,
      },
    });
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: {
      plates_earned?: boolean;
      achievements?: boolean;
      class_reminders?: boolean;
      subscription_alerts?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        plates_earned: true,
        achievements: true,
        class_reminders: true,
        subscription_alerts: true,
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        plates_earned: true,
        achievements: true,
        class_reminders: true,
        subscription_alerts: true,
      };
    }
  }
}
