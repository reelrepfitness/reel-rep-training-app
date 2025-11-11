// app/settings/calendar-sync.tsx
// Calendar Sync Settings Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, CheckCircle, XCircle, Bell, RefreshCw } from 'lucide-react-native';
import { useCalendarSync } from '@/lib/hooks/useCalendarSync';
import Colors from '@/constants/colors';

export default function CalendarSyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
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
  } = useCalendarSync();

  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableAutoSync = async () => {
    setIsEnabling(true);
    try {
      const success = await enableAutoSync();

      if (success) {
        Alert.alert('✅ הצלחה!', `סנכרון אוטומטי ל-${calendarAppName} הופעל בהצלחה`);

        // Optionally sync existing classes
        Alert.alert(
          'סנכרון שיעורים קיימים',
          'האם תרצה לסנכרן את כל השיעורים הקרובים שלך ליומן?',
          [
            { text: 'לא', style: 'cancel' },
            {
              text: 'כן',
              onPress: async () => {
                const count = await syncAllClasses();
                if (count > 0) {
                  Alert.alert('✅ סונכרן!', `${count} שיעורים נוספו ליומן`);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'שגיאה',
          'לא ניתן להפעיל סנכרון אוטומטי. ודא שנתת הרשאות גישה ליומן בהגדרות המכשיר.'
        );
      }
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableAutoSync = async () => {
    Alert.alert(
      'ביטול סנכרון אוטומטי',
      'האם אתה בטוח שברצונך לכבות את הסנכרון האוטומטי ליומן?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'כן, כבה',
          style: 'destructive',
          onPress: async () => {
            const success = await disableAutoSync();
            if (success) {
              Alert.alert('✅ בוטל', 'סנכרון אוטומטי כובה. שיעורים חדשים לא יתווספו ליומן.');
            }
          },
        },
      ]
    );
  };

  const handleToggleReminder = async (minutes: number, enabled: boolean) => {
    if (!settings) return;

    let newReminders: number[];

    if (enabled) {
      // Add reminder
      newReminders = [...settings.reminderMinutes, minutes].sort((a, b) => b - a);
    } else {
      // Remove reminder
      newReminders = settings.reminderMinutes.filter((m) => m !== minutes);
    }

    const success = await updateReminderTimes(newReminders);

    if (!success) {
      Alert.alert('שגיאה', 'לא ניתן לעדכן את התזכורות');
    }
  };

  const handleSyncAll = async () => {
    Alert.alert(
      'סנכרון כל השיעורים',
      'פעולה זו תוסיף את כל השיעורים הקרובים שלך ליומן. האם להמשיך?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'כן',
          onPress: async () => {
            const count = await syncAllClasses();

            if (count > 0) {
              Alert.alert('✅ סונכרן!', `${count} שיעורים נוספו ל-${calendarAppName}`);
            } else if (count === 0) {
              Alert.alert('ℹ️', 'כל השיעורים כבר מסונכרנים ליומן או שאין שיעורים קרובים');
            }
          },
        },
      ]
    );
  };

  const reminderOptions = [
    { minutes: 1440, label: 'יום לפני', icon: '📅' },
    { minutes: 120, label: 'שעתיים לפני', icon: '⏰' },
    { minutes: 60, label: 'שעה לפני', icon: '🕐' },
    { minutes: 30, label: '30 דקות לפני', icon: '⏱️' },
    { minutes: 15, label: '15 דקות לפני', icon: '⏱️' },
    { minutes: 5, label: '5 דקות לפני', icon: '⏰' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📅 סנכרון יומן</Text>
          <Text style={styles.subtitle}>חיבור ל-{calendarAppName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סטטוס</Text>

          {!hasPermission ? (
            <View style={styles.statusCard}>
              <XCircle size={48} color={Colors.textSecondary} />
              <Text style={styles.statusTitle}>לא מחובר</Text>
              <Text style={styles.statusText}>
                חבר את האפליקציה ל-{calendarAppName} כדי שכל שיעור שאתה מזמין יתווסף אוטומטית
                ליומן שלך
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleEnableAutoSync}
                disabled={isEnabling}
              >
                {isEnabling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.connectButtonText}>חבר ליומן</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : !settings?.autoSync ? (
            <View style={styles.statusCard}>
              <Calendar size={48} color={Colors.textSecondary} />
              <Text style={styles.statusTitle}>סנכרון כבוי</Text>
              <Text style={styles.statusText}>
                הרשאות ניתנו, אבל הסנכרון האוטומטי כבוי. הפעל אותו כדי שכל הזמנת שיעור תתווסף
                ליומן
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleEnableAutoSync}
                disabled={isEnabling}
              >
                {isEnabling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.connectButtonText}>הפעל סנכרון</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <CheckCircle size={48} color={Colors.success} />
              <Text style={[styles.statusTitle, { color: Colors.success }]}>מחובר ומסונכרן!</Text>
              <Text style={styles.statusText}>
                כל שיעור שאתה מזמין מתווסף אוטומטית ל-{calendarAppName} שלך
              </Text>
            </View>
          )}
        </View>

        {/* Auto Sync Toggle */}
        {hasPermission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הגדרות</Text>

            <View style={styles.settingCard}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>סנכרון אוטומטי</Text>
                <Text style={styles.settingDescription}>
                  הוסף שיעורים ליומן אוטומטית בזמן ההזמנה
                </Text>
              </View>
              <Switch
                value={settings?.autoSync || false}
                onValueChange={(value) => {
                  if (value) {
                    handleEnableAutoSync();
                  } else {
                    handleDisableAutoSync();
                  }
                }}
                trackColor={{ false: '#3e3e3e', true: Colors.primary + '60' }}
                thumbColor={settings?.autoSync ? Colors.primary : '#8e8e8e'}
              />
            </View>
          </View>
        )}

        {/* Reminders */}
        {settings?.autoSync && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={Colors.text} />
              <Text style={styles.sectionTitle}>תזכורות</Text>
            </View>
            <Text style={styles.sectionDescription}>
              בחר מתי לקבל תזכורות לפני כל שיעור
            </Text>

            {reminderOptions.map((option) => {
              const isEnabled = settings.reminderMinutes?.includes(option.minutes) || false;

              return (
                <View key={option.minutes} style={styles.reminderCard}>
                  <Text style={styles.reminderIcon}>{option.icon}</Text>
                  <Text style={styles.reminderLabel}>{option.label}</Text>
                  <Switch
                    value={isEnabled}
                    onValueChange={(value) => handleToggleReminder(option.minutes, value)}
                    trackColor={{ false: '#3e3e3e', true: Colors.primary + '60' }}
                    thumbColor={isEnabled ? Colors.primary : '#8e8e8e'}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Sync All Button */}
        {settings?.autoSync && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.syncAllButton, syncing && styles.syncAllButtonDisabled]}
              onPress={handleSyncAll}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <RefreshCw size={20} color={Colors.primary} />
                  <Text style={styles.syncAllButtonText}>סנכרן את כל השיעורים הקרובים</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>איך זה עובד?</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              📅 <Text style={styles.infoBold}>הזמנת שיעור:</Text> השיעור מתווסף אוטומטית ליומן
              שלך{'\n\n'}
              ⏰ <Text style={styles.infoBold}>תזכורות:</Text> קבל תזכורות בזמנים שבחרת לפני
              השיעור{'\n\n'}
              🔄 <Text style={styles.infoBold}>עדכון אוטומטי:</Text> שינויים בשיעור מתעדכנים
              ביומן{'\n\n'}
              ❌ <Text style={styles.infoBold}>ביטול:</Text> ביטול שיעור מסיר אותו מהיומן
              אוטומטית{'\n\n'}
              🔐 <Text style={styles.infoBold}>פרטיות:</Text> רק אתה רואה את האירועים ביומן שלך
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#181818',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    marginBottom: 16,
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
  connectButton: {
    backgroundColor: Colors.primary || '#da4477',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
  reminderCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  reminderLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text || '#fff',
    textAlign: 'right',
  },
  syncAllButton: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.primary || '#da4477',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  syncAllButtonDisabled: {
    opacity: 0.5,
  },
  syncAllButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary || '#da4477',
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
});
