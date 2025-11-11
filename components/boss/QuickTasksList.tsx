import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { supabase } from '@/constants/supabase';

interface TaskData {
  title: string;
  count: number;
  users: Array<{
    id: string;
    name: string;
    phone_number: string;
    full_name: string;
  }>;
  whatsappMessage: string;
}

export function QuickTasksList() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // לקוחות שלא הגיעו שבוע
      const { data: noShowWeek } = await supabase
        .from('profiles')
        .select('*')
        .lt('updated_at', oneWeekAgo.toISOString())
        .gte('updated_at', twoWeeksAgo.toISOString())
        .eq('subscription_status', 'active');

      // לקוחות שלא הגיעו שבועיים
      const { data: noShowTwoWeeks } = await supabase
        .from('profiles')
        .select('*')
        .lt('updated_at', twoWeeksAgo.toISOString())
        .gte('updated_at', threeWeeksAgo.toISOString())
        .eq('subscription_status', 'active');

      // לקוחות שלא הגיעו 3 שבועות
      const { data: noShowThreeWeeks } = await supabase
        .from('profiles')
        .select('*')
        .lt('updated_at', threeWeeksAgo.toISOString())
        .eq('subscription_status', 'active');

      // מנוי נגמר בעוד 3 ימים
      const { data: subscriptionExpiringSoon } = await supabase
        .from('profiles')
        .select('*')
        .lte('subscription_end', threeDaysFromNow.toISOString())
        .gte('subscription_end', now.toISOString())
        .eq('subscription_status', 'active');

      // ניקוב אחרון בכרטיסייה (classes_per_month - classes_used = 1)
      const { data: lastPunch } = await supabase
        .from('profiles')
        .select('*')
        .eq('subscription_status', 'active')
        .filter('classes_per_month', 'gt', 0);

      const lastPunchFiltered = lastPunch?.filter(
        (p) => p.classes_per_month - p.classes_used === 1
      );

      // מנוי שנגמר
      const { data: subscriptionExpired } = await supabase
        .from('profiles')
        .select('*')
        .lt('subscription_end', now.toISOString())
        .or('subscription_status.eq.cancelled,subscription_status.eq.expired');

      // כרטיסייה שנגמרה (classes_used >= classes_per_month)
      const { data: cardExpired } = await supabase
        .from('profiles')
        .select('*')
        .eq('subscription_status', 'active')
        .filter('classes_per_month', 'gt', 0);

      const cardExpiredFiltered = cardExpired?.filter(
        (p) => p.classes_used >= p.classes_per_month
      );

      setTasks([
        {
          title: 'לא הגיעו שבוע',
          count: noShowWeek?.length || 0,
          users: noShowWeek || [],
          whatsappMessage: 'היי! מתגעגעים אליך 😊 מה נשמע? נשמח לראות אותך שוב באולם!',
        },
        {
          title: 'לא הגיעו שבועיים',
          count: noShowTwoWeeks?.length || 0,
          users: noShowTwoWeeks || [],
          whatsappMessage: 'היי! שבועיים לא ראינו אותך 🥺 הכל בסדר? נשמח לעזור!',
        },
        {
          title: 'לא הגיעו 3 שבועות',
          count: noShowThreeWeeks?.length || 0,
          users: noShowThreeWeeks || [],
          whatsappMessage: 'היי! כבר 3 שבועות לא ראינו אותך 💔 מה קורה? בוא נדבר!',
        },
        {
          title: 'מנוי נגמר בקרוב',
          count: subscriptionExpiringSoon?.length || 0,
          users: subscriptionExpiringSoon || [],
          whatsappMessage: 'היי! המנוי שלך עומד להיגמר בקרוב 📅 רוצה לחדש?',
        },
        {
          title: 'ניקוב אחרון',
          count: lastPunchFiltered?.length || 0,
          users: lastPunchFiltered || [],
          whatsappMessage: 'היי! נשאר לך ניקוב אחרון בכרטיסייה 🎟️ בוא נדאג שלא תישאר בלי!',
        },
        {
          title: 'מנוי נגמר',
          count: subscriptionExpired?.length || 0,
          users: subscriptionExpired || [],
          whatsappMessage: 'היי! המנוי שלך הסתיים 😔 נשמח לראות אותך שוב!',
        },
        {
          title: 'כרטיסייה נגמרה',
          count: cardExpiredFiltered?.length || 0,
          users: cardExpiredFiltered || [],
          whatsappMessage: 'היי! הכרטיסייה שלך הסתיימה 🎫 בוא נחדש!',
        },
      ]);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = async (phone: string, message: string, userName: string) => {
    try {
      // Remove any non-digit characters and ensure it starts with 972
      const cleanPhone = phone.replace(/\D/g, '');
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('שגיאה', 'לא ניתן לפתוח WhatsApp');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('שגיאה', 'לא ניתן לשלוח הודעה');
    }
  };

  const handleTaskPress = (task: TaskData) => {
    if (task.count === 0) {
      Alert.alert('אין משימות', 'אין לקוחות בקטגוריה זו 🎉');
      return;
    }

    // Show list of users with WhatsApp buttons
    Alert.alert(
      task.title,
      `${task.count} לקוחות`,
      [
        ...task.users.slice(0, 5).map((user) => ({
          text: `📱 ${user.full_name || user.name}`,
          onPress: () => sendWhatsApp(user.phone_number, task.whatsappMessage, user.full_name || user.name),
        })),
        ...(task.users.length > 5
          ? [{ text: `ועוד ${task.users.length - 5} לקוחות...`, style: 'default' as const }]
          : []),
        { text: 'סגור', style: 'cancel' as const },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {tasks.map((task, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.taskCard,
            task.count === 0 && styles.taskCardEmpty,
            task.count > 5 && styles.taskCardUrgent,
          ]}
          onPress={() => handleTaskPress(task)}
        >
          <View style={styles.taskHeader}>
            <Text style={styles.taskCount}>{task.count}</Text>
            {task.count > 0 && (
              <View style={styles.whatsappBadge}>
                <Text style={styles.whatsappIcon}>💬</Text>
              </View>
            )}
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.count > 0 && <Text style={styles.taskAction}>לחץ לשליחה →</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  taskCard: {
    width: 160,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskCardEmpty: {
    opacity: 0.5,
    borderColor: '#e0e0e0',
  },
  taskCardUrgent: {
    borderColor: '#da4477',
    backgroundColor: '#fff5f8',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#181818',
  },
  whatsappBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappIcon: {
    fontSize: 18,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
    marginBottom: 4,
  },
  taskAction: {
    fontSize: 12,
    color: '#da4477',
    textAlign: 'right',
  },
});