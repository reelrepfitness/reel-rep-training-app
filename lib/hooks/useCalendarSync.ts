// lib/hooks/useCalendarSync.ts
// React Hook for Calendar Integration

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIntegrationService,
  CalendarSyncSettings,
} from '@/lib/services/calendar-integration';

export function useCalendarSync() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState<CalendarSyncSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCalendarSettings();
      checkPermissions();
    }
  }, [user?.id]);

  const checkPermissions = async () => {
    const granted = await CalendarIntegrationService.checkPermissions();
    setHasPermission(granted);
  };

  const loadCalendarSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const userSettings = await CalendarIntegrationService.getUserCalendarSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading calendar settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await CalendarIntegrationService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  const enableAutoSync = async (reminderMinutes: number[] = [60, 15]): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await CalendarIntegrationService.enableAutoSync(user.id, reminderMinutes);

    if (success) {
      await loadCalendarSettings();
      setHasPermission(true);
    }

    return success;
  };

  const disableAutoSync = async (): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await CalendarIntegrationService.disableAutoSync(user.id);

    if (success) {
      await loadCalendarSettings();
    }

    return success;
  };

  const updateReminderTimes = async (reminderMinutes: number[]): Promise<boolean> => {
    if (!user?.id) return false;

    const success = await CalendarIntegrationService.updateReminderTimes(
      user.id,
      reminderMinutes
    );

    if (success) {
      await loadCalendarSettings();
    }

    return success;
  };

  const syncAllClasses = async (): Promise<number> => {
    if (!user?.id) return 0;

    setSyncing(true);
    try {
      const count = await CalendarIntegrationService.syncAllUpcomingClasses(user.id);
      return count;
    } finally {
      setSyncing(false);
    }
  };

  const createClassEvent = async (classData: {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    location: string;
    instructor: string;
    description?: string;
  }): Promise<string | null> => {
    if (!user?.id) return null;

    return await CalendarIntegrationService.createClassEvent(classData, user.id);
  };

  const deleteClassEvent = async (classId: string): Promise<boolean> => {
    if (!user?.id) return false;

    return await CalendarIntegrationService.deleteClassEvent(classId, user.id);
  };

  const calendarAppName = CalendarIntegrationService.getCalendarAppName();

  return {
    hasPermission,
    settings,
    loading,
    syncing,
    calendarAppName,
    requestPermissions,
    enableAutoSync,
    disableAutoSync,
    updateReminderTimes,
    syncAllClasses,
    createClassEvent,
    deleteClassEvent,
    reloadSettings: loadCalendarSettings,
  };
}
