// lib/services/health-integration.ts
// Health App Integration for iOS HealthKit and Android Health Connect

import { Platform } from 'react-native';
import { supabase } from '@/constants/supabase';
import { PlatesManager } from '@/lib/plates-manager';
import { PushNotificationService } from './push-notifications';

// NOTE: For iOS HealthKit, you'll need to install: npx expo install expo-apple-healthkit
// NOTE: For Android, expo-health-connect is already installed

// Since we don't have expo-apple-healthkit installed yet, I'll create an interface-based approach
// that will work with both platforms once you install the iOS package

export interface HealthData {
  date: string;
  steps: number;
  distance: number; // in meters
  activeMinutes: number;
  calories: number;
  workouts: HealthWorkout[];
}

export interface HealthWorkout {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  calories?: number;
  distance?: number;
}

export interface HealthPermissions {
  steps: boolean;
  distance: boolean;
  workouts: boolean;
  calories: boolean;
}

export class HealthIntegrationService {
  private static isInitialized = false;
  private static lastSyncDate: Date | null = null;

  /**
   * Check if health data is available on this platform
   */
  static async isHealthDataAvailable(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // Check if HealthKit is available (requires device with iOS 8+)
      // This would normally use expo-apple-healthkit
      return true; // Assume available on iOS devices
    } else if (Platform.OS === 'android') {
      // Check if Health Connect is available (requires Android 14+ or app installed)
      try {
        // You would normally check with expo-health-connect here
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Request health permissions
   */
  static async requestPermissions(): Promise<HealthPermissions> {
    if (Platform.OS === 'ios') {
      return await this.requestIOSPermissions();
    } else if (Platform.OS === 'android') {
      return await this.requestAndroidPermissions();
    }

    return {
      steps: false,
      distance: false,
      workouts: false,
      calories: false,
    };
  }

  /**
   * Request iOS HealthKit permissions
   */
  private static async requestIOSPermissions(): Promise<HealthPermissions> {
    try {
      // This is a placeholder implementation
      // When you install expo-apple-healthkit, replace with actual implementation:

      /*
      import AppleHealthKit from 'expo-apple-healthkit';

      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Workout,
          ],
        },
      };

      const result = await AppleHealthKit.initHealthKit(permissions);
      */

      // Placeholder return
      console.log('iOS HealthKit permissions requested (install expo-apple-healthkit)');
      return {
        steps: true,
        distance: true,
        workouts: true,
        calories: true,
      };
    } catch (error) {
      console.error('Error requesting iOS health permissions:', error);
      return {
        steps: false,
        distance: false,
        workouts: false,
        calories: false,
      };
    }
  }

  /**
   * Request Android Health Connect permissions
   */
  private static async requestAndroidPermissions(): Promise<HealthPermissions> {
    try {
      // Using expo-health-connect
      // Placeholder implementation - replace with actual when configured

      /*
      import { HealthConnect } from 'expo-health-connect';

      const permissions = await HealthConnect.requestPermissions([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'ExerciseSession' },
      ]);
      */

      console.log('Android Health Connect permissions requested');
      return {
        steps: true,
        distance: true,
        workouts: true,
        calories: true,
      };
    } catch (error) {
      console.error('Error requesting Android health permissions:', error);
      return {
        steps: false,
        distance: false,
        workouts: false,
        calories: false,
      };
    }
  }

  /**
   * Sync health data from device
   */
  static async syncHealthData(userId: string, startDate: Date, endDate: Date): Promise<HealthData | null> {
    try {
      if (Platform.OS === 'ios') {
        return await this.syncIOSHealthData(userId, startDate, endDate);
      } else if (Platform.OS === 'android') {
        return await this.syncAndroidHealthData(userId, startDate, endDate);
      }
      return null;
    } catch (error) {
      console.error('Error syncing health data:', error);
      return null;
    }
  }

  /**
   * Sync iOS HealthKit data
   */
  private static async syncIOSHealthData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HealthData | null> {
    try {
      // Placeholder implementation
      // When you install expo-apple-healthkit, replace with:

      /*
      import AppleHealthKit from 'expo-apple-healthkit';

      const steps = await AppleHealthKit.getStepCount({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const distance = await AppleHealthKit.getDistanceWalkingRunning({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const calories = await AppleHealthKit.getActiveEnergyBurned({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const workouts = await AppleHealthKit.getSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'Workout',
      });
      */

      const healthData: HealthData = {
        date: new Date().toISOString(),
        steps: 0,
        distance: 0,
        activeMinutes: 0,
        calories: 0,
        workouts: [],
      };

      await this.processHealthData(userId, healthData);
      return healthData;
    } catch (error) {
      console.error('Error syncing iOS health data:', error);
      return null;
    }
  }

  /**
   * Sync Android Health Connect data
   */
  private static async syncAndroidHealthData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HealthData | null> {
    try {
      // Placeholder implementation
      // Replace with actual expo-health-connect implementation

      const healthData: HealthData = {
        date: new Date().toISOString(),
        steps: 0,
        distance: 0,
        activeMinutes: 0,
        calories: 0,
        workouts: [],
      };

      await this.processHealthData(userId, healthData);
      return healthData;
    } catch (error) {
      console.error('Error syncing Android health data:', error);
      return null;
    }
  }

  /**
   * Process health data and award plates
   */
  private static async processHealthData(userId: string, healthData: HealthData): Promise<void> {
    try {
      // Save health data to Supabase
      const { error: saveError } = await supabase
        .from('user_health_data')
        .upsert({
          user_id: userId,
          date: healthData.date,
          steps: healthData.steps,
          distance: healthData.distance,
          active_minutes: healthData.activeMinutes,
          calories: healthData.calories,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        });

      if (saveError) throw saveError;

      // Award plates for workouts detected
      for (const workout of healthData.workouts) {
        await this.processWorkout(userId, workout);
      }

      // Award plates for daily step goals
      if (healthData.steps >= 10000) {
        const alreadyAwarded = await this.checkIfPlatesAwarded(
          userId,
          'daily_steps',
          healthData.date
        );

        if (!alreadyAwarded) {
          await PlatesManager.addPlates(
            userId,
            20,
            'health_sync',
            '🚶 10,000 צעדים ביום!'
          );

          // Send notification
          const prefs = await PushNotificationService.getNotificationPreferences(userId);
          if (prefs.plates_earned) {
            await PushNotificationService.notifyPlatesEarned(20, 'עבור 10,000 צעדים');
          }
        }
      }

      // Award plates for active minutes
      if (healthData.activeMinutes >= 30) {
        const alreadyAwarded = await this.checkIfPlatesAwarded(
          userId,
          'active_minutes',
          healthData.date
        );

        if (!alreadyAwarded) {
          await PlatesManager.addPlates(
            userId,
            15,
            'health_sync',
            '⏱️ 30 דקות פעילות!'
          );

          const prefs = await PushNotificationService.getNotificationPreferences(userId);
          if (prefs.plates_earned) {
            await PushNotificationService.notifyPlatesEarned(15, 'עבור 30 דקות פעילות');
          }
        }
      }

      this.lastSyncDate = new Date();
    } catch (error) {
      console.error('Error processing health data:', error);
    }
  }

  /**
   * Process individual workout and award plates
   */
  private static async processWorkout(userId: string, workout: HealthWorkout): Promise<void> {
    try {
      // Check if workout already processed
      const { data: existing } = await supabase
        .from('user_health_workouts')
        .select('id')
        .eq('user_id', userId)
        .eq('external_id', workout.id)
        .single();

      if (existing) return; // Already processed

      // Save workout
      const { error: saveError } = await supabase
        .from('user_health_workouts')
        .insert({
          user_id: userId,
          external_id: workout.id,
          workout_type: workout.type,
          start_time: workout.startTime,
          end_time: workout.endTime,
          duration: workout.duration,
          calories: workout.calories,
          distance: workout.distance,
        });

      if (saveError) throw saveError;

      // Award plates based on workout duration
      let platesAmount = 10; // Base amount

      if (workout.duration >= 30) {
        platesAmount = 15;
      }
      if (workout.duration >= 60) {
        platesAmount = 25;
      }

      await PlatesManager.addPlates(
        userId,
        platesAmount,
        'health_workout',
        `🏃 אימון ${workout.type} - ${workout.duration} דקות`
      );

      // Send notification
      const prefs = await PushNotificationService.getNotificationPreferences(userId);
      if (prefs.plates_earned) {
        await PushNotificationService.notifyPlatesEarned(
          platesAmount,
          `עבור אימון ${workout.type}`
        );
      }
    } catch (error) {
      console.error('Error processing workout:', error);
    }
  }

  /**
   * Check if plates were already awarded for a specific achievement today
   */
  private static async checkIfPlatesAwarded(
    userId: string,
    source: string,
    date: string
  ): Promise<boolean> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('plates_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('source', source)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .limit(1);

      if (error) throw error;

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking if plates awarded:', error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  static getSyncStatus(): {
    isInitialized: boolean;
    lastSyncDate: Date | null;
  } {
    return {
      isInitialized: this.isInitialized,
      lastSyncDate: this.lastSyncDate,
    };
  }

  /**
   * Enable automatic daily sync
   */
  static async enableAutoSync(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_health_sync_settings')
        .upsert({
          user_id: userId,
          auto_sync_enabled: true,
          sync_frequency: 'daily',
          last_sync: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      console.log('Auto sync enabled');
    } catch (error) {
      console.error('Error enabling auto sync:', error);
    }
  }

  /**
   * Disable automatic sync
   */
  static async disableAutoSync(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_health_sync_settings')
        .update({ auto_sync_enabled: false })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('Auto sync disabled');
    } catch (error) {
      console.error('Error disabling auto sync:', error);
    }
  }

  /**
   * Get health sync statistics
   */
  static async getHealthStats(userId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_health_data')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      if (error) throw error;

      const totalSteps = data?.reduce((sum, day) => sum + (day.steps || 0), 0) || 0;
      const totalDistance = data?.reduce((sum, day) => sum + (day.distance || 0), 0) || 0;
      const totalCalories = data?.reduce((sum, day) => sum + (day.calories || 0), 0) || 0;
      const totalActiveMinutes = data?.reduce((sum, day) => sum + (day.active_minutes || 0), 0) || 0;

      return {
        days,
        totalSteps,
        averageSteps: Math.round(totalSteps / days),
        totalDistance: Math.round(totalDistance),
        averageDistance: Math.round(totalDistance / days),
        totalCalories: Math.round(totalCalories),
        averageCalories: Math.round(totalCalories / days),
        totalActiveMinutes,
        averageActiveMinutes: Math.round(totalActiveMinutes / days),
        dailyData: data,
      };
    } catch (error) {
      console.error('Error getting health stats:', error);
      return null;
    }
  }
}
