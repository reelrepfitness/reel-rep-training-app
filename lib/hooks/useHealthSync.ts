// lib/hooks/useHealthSync.ts
// React Hook for Health Data Integration

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HealthIntegrationService, HealthData, HealthPermissions } from '@/lib/services/health-integration';

export function useHealthSync() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [permissions, setPermissions] = useState<HealthPermissions>({
    steps: false,
    distance: false,
    workouts: false,
    calories: false,
  });
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [healthStats, setHealthStats] = useState<any>(null);

  useEffect(() => {
    checkAvailability();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadHealthStats();
    }
  }, [user?.id]);

  const checkAvailability = async () => {
    const available = await HealthIntegrationService.isHealthDataAvailable();
    setIsAvailable(available);
  };

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await HealthIntegrationService.requestPermissions();
    setPermissions(granted);

    return Object.values(granted).some((v) => v === true);
  };

  const syncHealthData = async (): Promise<boolean> => {
    if (!user?.id) return false;

    setIsSyncing(true);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const data = await HealthIntegrationService.syncHealthData(user.id, startDate, endDate);

      if (data) {
        setHealthData(data);
        setLastSyncDate(new Date());

        // Reload stats after sync
        await loadHealthStats();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error syncing health data:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const enableAutoSync = async (): Promise<void> => {
    if (!user?.id) return;

    await HealthIntegrationService.enableAutoSync(user.id);
  };

  const disableAutoSync = async (): Promise<void> => {
    if (!user?.id) return;

    await HealthIntegrationService.disableAutoSync(user.id);
  };

  const loadHealthStats = async (days: number = 7): Promise<void> => {
    if (!user?.id) return;

    const stats = await HealthIntegrationService.getHealthStats(user.id, days);
    setHealthStats(stats);
  };

  const syncStatus = HealthIntegrationService.getSyncStatus();

  return {
    isAvailable,
    permissions,
    healthData,
    healthStats,
    isSyncing,
    lastSyncDate: lastSyncDate || syncStatus.lastSyncDate,
    requestPermissions,
    syncHealthData,
    enableAutoSync,
    disableAutoSync,
    loadHealthStats,
  };
}
