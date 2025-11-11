// app/settings/notifications.tsx
// Push Notification Settings Screen

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Trophy, Calendar, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { PushNotificationService } from '@/lib/services/push-notifications';
import Colors from '@/constants/colors';

export default function NotificationsSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { permissionStatus, requestPermission, sendTestNotification } = useNotifications();

  const [preferences, setPreferences] = useState({
    plates_earned: true,
    achievements: true,
    class_reminders: true,
    subscription_alerts: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      const prefs = await PushNotificationService.getNotificationPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('✅ הצלחה!', 'התראות הופעלו בהצלחה');
    } else {
      Alert.alert(
        'הרשאות נדרשות',
        'כדי לקבל התראות, נא לאשר הרשאות בהגדרות המכשיר',
        [
          { text: 'בטל', style: 'cancel' },
          {
            text: 'פתח הגדרות',
            onPress: () => {
              // Open settings
              // Linking.openSettings(); // You can add this
            },
          },
        ]
      );
    }
  };

  const handleTogglePreference = async (key: string, value: boolean) => {
    if (!user?.id) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    await PushNotificationService.updateNotificationPreferences(user.id, newPreferences);
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('✅ נשלח!', 'התראת בדיקה נשלחה בהצלחה');
  };

  const notificationTypes = [
    {
      key: 'plates_earned',
      icon: Trophy,
      title: 'פלטות הורווחו',
      description: 'התראה כשאתה מרוויח פלטות',
      color: Colors.primary,
    },
    {
      key: 'achievements',
      icon: Trophy,
      title: 'הישגים',
      description: 'התראה כשאתה משיג הישג חדש',
      color: Colors.success,
    },
    {
      key: 'class_reminders',
      icon: Calendar,
      title: 'תזכורות לשיעורים',
      description: 'תזכורת לפני תחילת שיעור',
      color: Colors.accent,
    },
    {
      key: 'subscription_alerts',
      icon: AlertCircle,
      title: 'התראות מנוי',
      description: 'התראה כשהמנוי עומד לפוג',
      color: '#f97316',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🔔 התראות</Text>
          <Text style={styles.subtitle}>הגדרות התראות Push</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סטטוס הרשאות</Text>

          {permissionStatus === 'granted' ? (
            <View style={styles.statusCard}>
              <CheckCircle size={48} color={Colors.success} />
              <Text style={[styles.statusTitle, { color: Colors.success }]}>התראות מופעלות</Text>
              <Text style={styles.statusText}>
                קיבלת אישור לקבל התראות מהאפליקציה
              </Text>
            </View>
          ) : permissionStatus === 'denied' ? (
            <View style={styles.statusCard}>
              <AlertCircle size={48} color={Colors.error} />
              <Text style={[styles.statusTitle, { color: Colors.error }]}>התראות חסומות</Text>
              <Text style={styles.statusText}>
                התראות נחסמו. עבור להגדרות המכשיר כדי לאפשר
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.error }]}
                onPress={handleRequestPermission}
              >
                <Text style={styles.actionButtonText}>פתח הגדרות</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <Bell size={48} color={Colors.textSecondary} />
              <Text style={styles.statusTitle}>התראות לא מופעלות</Text>
              <Text style={styles.statusText}>
                אפשר התראות כדי לקבל עדכונים על פלטות והישגים
              </Text>
              <TouchableOpacity style={styles.actionButton} onPress={handleRequestPermission}>
                <Text style={styles.actionButtonText}>אפשר התראות</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notification Types */}
        {permissionStatus === 'granted' && !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>סוגי התראות</Text>

            {notificationTypes.map((type) => (
              <View key={type.key} style={styles.notificationCard}>
                <View style={[styles.notificationIcon, { backgroundColor: type.color + '20' }]}>
                  <type.icon size={24} color={type.color} />
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{type.title}</Text>
                  <Text style={styles.notificationDescription}>{type.description}</Text>
                </View>
                <Switch
                  value={preferences[type.key as keyof typeof preferences]}
                  onValueChange={(value) => handleTogglePreference(type.key, value)}
                  trackColor={{ false: '#3e3e3e', true: type.color + '60' }}
                  thumbColor={
                    preferences[type.key as keyof typeof preferences] ? type.color : '#8e8e8e'
                  }
                />
              </View>
            ))}
          </View>
        )}

        {/* Test Notification */}
        {permissionStatus === 'granted' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>בדיקה</Text>
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Bell size={20} color={Colors.primary} />
              <Text style={styles.testButtonText}>שלח התראת בדיקה</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מידע</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              📱 <Text style={styles.infoBold}>התראות מקומיות:</Text> מופיעות מיד כשמתרחש אירוע
              {'\n\n'}
              🔔 <Text style={styles.infoBold}>התראות Push:</Text> יכולות להתקבל גם כשהאפליקציה
              סגורה{'\n\n'}
              🎯 <Text style={styles.infoBold}>פלטות הורווחו:</Text> התראה בזמן אמת כשזוכים
              בפלטות{'\n\n'}
              🏆 <Text style={styles.infoBold}>הישגים:</Text> התראה מיוחדת לפתיחת הישגים{'\n\n'}
              📅 <Text style={styles.infoBold}>תזכורות:</Text> תזכורת שעה לפני שיעור
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text || '#fff',
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
  actionButton: {
    backgroundColor: Colors.primary || '#da4477',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  notificationCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  notificationInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
  },
  testButton: {
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
  testButtonText: {
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
