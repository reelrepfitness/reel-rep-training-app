// lib/services/calendar-integration.ts
// Automatic Calendar Integration for Class Bookings
// Supports Apple Calendar (iOS) and Google Calendar (Android)

import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/constants/supabase';
import { PushNotificationService } from './push-notifications';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: number[]; // Minutes before event
}

export interface CalendarSyncSettings {
  autoSync: boolean;
  defaultCalendarId?: string;
  reminderMinutes: number[];
  syncPastEvents: boolean;
}

export class CalendarIntegrationService {
  private static defaultCalendarId: string | null = null;
  private static hasPermission: boolean = false;

  /**
   * Request calendar permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status === 'granted') {
        this.hasPermission = true;

        // Get or create default calendar
        await this.getOrCreateDefaultCalendar();

        return true;
      } else {
        this.hasPermission = false;
        return false;
      }
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  /**
   * Check if permissions are granted
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error checking calendar permissions:', error);
      return false;
    }
  }

  /**
   * Get or create the default calendar for the app
   */
  static async getOrCreateDefaultCalendar(): Promise<string | null> {
    try {
      if (this.defaultCalendarId) {
        return this.defaultCalendarId;
      }

      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      if (Platform.OS === 'ios') {
        // On iOS, find the default calendar
        const defaultCalendar = calendars.find(
          (cal) => cal.allowsModifications && cal.source.name === 'Default'
        );

        if (defaultCalendar) {
          this.defaultCalendarId = defaultCalendar.id;
          return defaultCalendar.id;
        }

        // If no default calendar, use the first writable one
        const writableCalendar = calendars.find((cal) => cal.allowsModifications);
        if (writableCalendar) {
          this.defaultCalendarId = writableCalendar.id;
          return writableCalendar.id;
        }
      } else if (Platform.OS === 'android') {
        // On Android, try to find or create a local calendar
        let appCalendar = calendars.find(
          (cal) => cal.title === 'Reel Rep Training' && cal.allowsModifications
        );

        if (!appCalendar) {
          // Create a new calendar for the app
          const defaultCalendarSource = calendars.find(
            (cal) => cal.source.name === 'Local' || cal.source.type === Calendar.SourceType.LOCAL
          )?.source;

          if (defaultCalendarSource) {
            const newCalendarId = await Calendar.createCalendarAsync({
              title: 'Reel Rep Training',
              color: '#da4477',
              entityType: Calendar.EntityTypes.EVENT,
              sourceId: defaultCalendarSource.id,
              source: defaultCalendarSource,
              name: 'Reel Rep Training',
              ownerAccount: 'personal',
              accessLevel: Calendar.CalendarAccessLevel.OWNER,
            });

            this.defaultCalendarId = newCalendarId;
            return newCalendarId;
          }
        } else {
          this.defaultCalendarId = appCalendar.id;
          return appCalendar.id;
        }

        // Fallback: use first writable calendar
        const writableCalendar = calendars.find((cal) => cal.allowsModifications);
        if (writableCalendar) {
          this.defaultCalendarId = writableCalendar.id;
          return writableCalendar.id;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting/creating default calendar:', error);
      return null;
    }
  }

  /**
   * Create a calendar event for a class booking
   */
  static async createClassEvent(
    classData: {
      id: string;
      title: string;
      date: string;
      time: string;
      duration: number;
      location: string;
      instructor: string;
      description?: string;
    },
    userId: string
  ): Promise<string | null> {
    try {
      // Check if auto-sync is enabled for this user
      const settings = await this.getUserCalendarSettings(userId);
      if (!settings?.autoSync) {
        return null;
      }

      // Check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.log('Calendar permission not granted');
        return null;
      }

      // Get calendar ID
      const calendarId = await this.getOrCreateDefaultCalendar();
      if (!calendarId) {
        console.error('No calendar available');
        return null;
      }

      // Parse date and time
      const classDate = new Date(classData.date);
      const [hours, minutes] = classData.time.split(':').map(Number);
      classDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(classDate);
      endDate.setMinutes(endDate.getMinutes() + classData.duration);

      // Create event details
      const eventDetails: Calendar.Event = {
        title: `🏋️ ${classData.title}`,
        startDate: classDate,
        endDate: endDate,
        location: classData.location,
        notes: `מאמן: ${classData.instructor}\n${classData.description || ''}`,
        timeZone: 'Asia/Jerusalem',
        alarms: settings.reminderMinutes.map((minutes) => ({ relativeOffset: -minutes })),
      };

      // Create the event
      const eventId = await Calendar.createEventAsync(calendarId, eventDetails);

      // Save event mapping to database
      await this.saveEventMapping(userId, classData.id, eventId);

      console.log('Calendar event created:', eventId);
      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Update a calendar event
   */
  static async updateClassEvent(
    classId: string,
    userId: string,
    updatedClassData: {
      title: string;
      date: string;
      time: string;
      duration: number;
      location: string;
      instructor: string;
      description?: string;
    }
  ): Promise<boolean> {
    try {
      // Get the calendar event ID from database
      const eventId = await this.getEventIdForClass(classId, userId);
      if (!eventId) {
        console.log('No calendar event found for this class');
        return false;
      }

      // Check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return false;
      }

      // Parse new date and time
      const classDate = new Date(updatedClassData.date);
      const [hours, minutes] = updatedClassData.time.split(':').map(Number);
      classDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(classDate);
      endDate.setMinutes(endDate.getMinutes() + updatedClassData.duration);

      // Get reminder settings
      const settings = await this.getUserCalendarSettings(userId);

      // Update event
      const eventDetails: Partial<Calendar.Event> = {
        title: `🏋️ ${updatedClassData.title}`,
        startDate: classDate,
        endDate: endDate,
        location: updatedClassData.location,
        notes: `מאמן: ${updatedClassData.instructor}\n${updatedClassData.description || ''}`,
        alarms: settings?.reminderMinutes.map((minutes) => ({ relativeOffset: -minutes })),
      };

      await Calendar.updateEventAsync(eventId, eventDetails);

      console.log('Calendar event updated:', eventId);
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  /**
   * Delete a calendar event (when class is cancelled)
   */
  static async deleteClassEvent(classId: string, userId: string): Promise<boolean> {
    try {
      // Get the calendar event ID from database
      const eventId = await this.getEventIdForClass(classId, userId);
      if (!eventId) {
        console.log('No calendar event found for this class');
        return false;
      }

      // Check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return false;
      }

      // Delete the event
      await Calendar.deleteEventAsync(eventId);

      // Remove mapping from database
      await this.removeEventMapping(classId, userId);

      console.log('Calendar event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Enable auto calendar sync for user
   */
  static async enableAutoSync(
    userId: string,
    reminderMinutes: number[] = [60, 15]
  ): Promise<boolean> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'הרשאות נדרשות',
          'כדי לסנכרן אוטומטית ליומן, נא לאשר הרשאות גישה ליומן בהגדרות המכשיר'
        );
        return false;
      }

      const calendarId = await this.getOrCreateDefaultCalendar();

      const { error } = await supabase
        .from('user_calendar_settings')
        .upsert({
          user_id: userId,
          auto_sync: true,
          default_calendar_id: calendarId,
          reminder_minutes: reminderMinutes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error enabling auto sync:', error);
      return false;
    }
  }

  /**
   * Disable auto calendar sync
   */
  static async disableAutoSync(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_calendar_settings')
        .update({ auto_sync: false })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error disabling auto sync:', error);
      return false;
    }
  }

  /**
   * Get user's calendar settings
   */
  static async getUserCalendarSettings(userId: string): Promise<CalendarSyncSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_calendar_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return {
          autoSync: data.auto_sync,
          defaultCalendarId: data.default_calendar_id,
          reminderMinutes: data.reminder_minutes || [60, 15],
          syncPastEvents: data.sync_past_events || false,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting calendar settings:', error);
      return null;
    }
  }

  /**
   * Update reminder times
   */
  static async updateReminderTimes(userId: string, reminderMinutes: number[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_calendar_settings')
        .update({ reminder_minutes: reminderMinutes })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating reminder times:', error);
      return false;
    }
  }

  /**
   * Save event mapping to database
   */
  private static async saveEventMapping(
    userId: string,
    classId: string,
    calendarEventId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_calendar_events')
        .insert({
          user_id: userId,
          class_id: classId,
          calendar_event_id: calendarEventId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving event mapping:', error);
    }
  }

  /**
   * Get calendar event ID for a class
   */
  private static async getEventIdForClass(classId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_calendar_events')
        .select('calendar_event_id')
        .eq('class_id', classId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return data?.calendar_event_id || null;
    } catch (error) {
      console.error('Error getting event ID:', error);
      return null;
    }
  }

  /**
   * Remove event mapping from database
   */
  private static async removeEventMapping(classId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_calendar_events')
        .delete()
        .eq('class_id', classId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing event mapping:', error);
    }
  }

  /**
   * Sync all upcoming booked classes to calendar
   */
  static async syncAllUpcomingClasses(userId: string): Promise<number> {
    try {
      // Get all upcoming class bookings
      const { data: bookings, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          classes:class_id (
            id,
            title,
            date,
            time,
            duration,
            location,
            instructor,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .gte('classes.date', new Date().toISOString());

      if (error) throw error;

      let syncedCount = 0;

      for (const booking of bookings || []) {
        if (booking.classes) {
          // Check if event already exists
          const existingEventId = await this.getEventIdForClass(booking.class_id, userId);

          if (!existingEventId) {
            // Create calendar event
            const eventId = await this.createClassEvent(booking.classes, userId);
            if (eventId) {
              syncedCount++;
            }
          }
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing all classes:', error);
      return 0;
    }
  }

  /**
   * Get calendar app name based on platform
   */
  static getCalendarAppName(): string {
    return Platform.OS === 'ios' ? 'Apple Calendar' : 'Google Calendar';
  }
}
