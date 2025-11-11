// app/settings/health-sync.tsx
// Health Data Sync Screen

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Activity,
  Footprints,
  Flame,
  Clock,
  Trophy,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useHealthSync } from '@/lib/hooks/useHealthSync';
import Colors from '@/constants/colors';

export default function HealthSyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isAvailable,
    permissions,
    healthStats,
    isSyncing,
    lastSyncDate,
    requestPermissions,
    syncHealthData,
    enableAutoSync,
    disableAutoSync,
    loadHealthStats,
  } = useHealthSync();

  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(false);

  useEffect(() => {
    loadHealthStats(7);
  }, []);

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      await syncHealthData();
    }
  };

  const handleSync = async () => {
    const success = await syncHealthData();
    if (success) {
      await loadHealthStats(7);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    if (enabled) {
      await enableAutoSync();
    } else {
      await disableAutoSync();
    }
  };

  const hasAllPermissions = Object.values(permissions).every((p) => p === true);
  const hasAnyPermission = Object.values(permissions).some((p) => p === true);

  const platformName = Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit / Health Connect';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏃 סנכרון בריאות</Text>
          <Text style={styles.subtitle}>חיבור ל-{platformName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סטטוס חיבור</Text>

          {!isAvailable ? (
            <View style={styles.statusCard}>
              <XCircle size={48} color={Colors.error} />
              <Text style={styles.statusTitle}>לא זמין במכשיר זה</Text>
              <Text style={styles.statusText}>
                {platformName} לא זמין או לא מותקן במכשיר זה
              </Text>
            </View>
          ) : !hasAnyPermission ? (
            <View style={styles.statusCard}>
              <Activity size={48} color={Colors.textSecondary} />
              <Text style={styles.statusTitle}>לא מחובר</Text>
              <Text style={styles.statusText}>
                חבר את האפליקציה ל-{platformName} כדי להרוויח פלטות אוטומטית
              </Text>
              <TouchableOpacity style={styles.connectButton} onPress={handleRequestPermissions}>
                <Text style={styles.connectButtonText}>חבר עכשיו</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <CheckCircle size={48} color={Colors.success} />
              <Text style={[styles.statusTitle, { color: Colors.success }]}>מחובר!</Text>
              <Text style={styles.statusText}>
                האפליקציה מחוברת ל-{platformName} ומסונכרנת אוטומטית
              </Text>
              {lastSyncDate && (
                <Text style={styles.lastSyncText}>
                  סנכרון אחרון:{' '}
                  {new Intl.DateTimeFormat('he-IL', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(lastSyncDate)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Permissions */}
        {hasAnyPermission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הרשאות</Text>
            <View style={styles.permissionsCard}>
              <PermissionItem
                icon={Footprints}
                label="צעדים"
                granted={permissions.steps}
                color={Colors.primary}
              />
              <PermissionItem
                icon={Activity}
                label="מרחק"
                granted={permissions.distance}
                color={Colors.accent}
              />
              <PermissionItem
                icon={Trophy}
                label="אימונים"
                granted={permissions.workouts}
                color={Colors.success}
              />
              <PermissionItem
                icon={Flame}
                label="קלוריות"
                granted={permissions.calories}
                color="#f97316"
              />
            </View>
          </View>
        )}

        {/* Auto Sync Toggle */}
        {hasAnyPermission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הגדרות</Text>
            <View style={styles.settingCard}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>סנכרון אוטומטי</Text>
                <Text style={styles.settingDescription}>
                  סנכרן נתוני בריאות אוטומטית כל יום
                </Text>
              </View>
              <Switch
                value={autoSyncEnabled}
                onValueChange={handleToggleAutoSync}
                trackColor={{ false: '#3e3e3e', true: Colors.primary + '60' }}
                thumbColor={autoSyncEnabled ? Colors.primary : '#8e8e8e'}
              />
            </View>
          </View>
        )}

        {/* Stats */}
        {healthStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>סטטיסטיקות (7 ימים)</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <RefreshCw size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon={Footprints}
                label="צעדים"
                value={healthStats.totalSteps.toLocaleString()}
                average={`${healthStats.averageSteps.toLocaleString()} / יום`}
                color={Colors.primary}
              />
              <StatCard
                icon={Activity}
                label="מרחק"
                value={`${(healthStats.totalDistance / 1000).toFixed(1)} ק"מ`}
                average={`${(healthStats.averageDistance / 1000).toFixed(1)} / יום`}
                color={Colors.accent}
              />
              <StatCard
                icon={Flame}
                label="קלוריות"
                value={healthStats.totalCalories.toLocaleString()}
                average={`${healthStats.averageCalories.toLocaleString()} / יום`}
                color="#f97316"
              />
              <StatCard
                icon={Clock}
                label="פעילות"
                value={`${healthStats.totalActiveMinutes} דק'`}
                average={`${healthStats.averageActiveMinutes} / יום`}
                color={Colors.success}
              />
            </View>
          </View>
        )}

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>איך זה עובד?</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              🏃 <Text style={styles.infoBold}>אימון אוטומטי:</Text> כל אימון שמזוהה ב-
              {platformName} מרוויח לך 10-25 פלטות{'\n\n'}
              👟 <Text style={styles.infoBold}>10,000 צעדים:</Text> הגעת ל-10,000 צעדים ביום?
              קבל 20 פלטות!{'\n\n'}
              ⏱️ <Text style={styles.infoBold}>30 דקות פעילות:</Text> 30 דקות פעילות יומית
              מזכות 15 פלטות{'\n\n'}
              🔄 <Text style={styles.infoBold}>סנכרון יומי:</Text> הנתונים מסתנכרנים אוטומטית
              כל יום
            </Text>
          </View>
        </View>

        {/* Manual Sync Button */}
        {hasAnyPermission && (
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.syncButtonText}>סנכרן עכשיו</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface PermissionItemProps {
  icon: any;
  label: string;
  granted: boolean;
  color: string;
}

function PermissionItem({ icon: Icon, label, granted, color }: PermissionItemProps) {
  return (
    <View style={styles.permissionItem}>
      <View style={[styles.permissionIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.permissionLabel}>{label}</Text>
      {granted ? (
        <CheckCircle size={20} color={Colors.success} />
      ) : (
        <XCircle size={20} color={Colors.textSecondary} />
      )}
    </View>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string;
  average: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, average, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statAverage}>{average}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#181818',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#333',
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text || '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
  },
  refreshButton: {
    padding: 8,
  },
  statusCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text || '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  lastSyncText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    marginTop: 12,
  },
  connectButton: {
    backgroundColor: Colors.primary || '#da4477',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 20,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  permissionsCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#fff',
    textAlign: 'right',
  },
  settingCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text || '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary || '#aaa',
    marginBottom: 4,
  },
  statAverage: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text || '#fff',
    lineHeight: 24,
    textAlign: 'right',
  },
  infoBold: {
    fontWeight: '700',
  },
  syncButton: {
    backgroundColor: Colors.primary || '#da4477',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
