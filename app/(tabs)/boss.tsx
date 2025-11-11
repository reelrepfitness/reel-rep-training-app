import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/constants/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FinancialCards } from '@/components/boss/FinancialCards';
import { QuickTasksList } from '@/components/boss/QuickTasksList';
import { TodayClassCard } from '@/components/boss/TodayClassCard';

interface ClassData {
  id: string;
  name_hebrew: string;
  class_date: string;
  max_participants: number;
  current_participants: number;
  bookings: any[];
}

export default function BossTab() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [todayClasses, setTodayClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await loadTodayClasses();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayClasses = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          bookings:class_bookings(
            *,
            user:profiles(*)
          )
        `)
        .gte('class_date', today.toISOString())
        .lt('class_date', tomorrow.toISOString())
        .eq('is_active', true)
        .order('class_date', { ascending: true });

      if (error) throw error;

      setTodayClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏋️ לוח הבוס</Text>
          <Text style={styles.headerSubtitle}>ברוך הבא, מאסטר!</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 כספים</Text>
          <FinancialCards />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ משימות זריזות</Text>
          <QuickTasksList />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 אימוני היום</Text>
          {todayClasses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>אין אימונים היום 🎉</Text>
            </View>
          ) : (
            todayClasses.map((classItem) => (
              <TodayClassCard
                key={classItem.id}
                classData={classItem}
                onUpdate={loadTodayClasses}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 CRM</Text>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>בקרוב...</Text>
            <Text style={styles.comingSoonSubtext}>
              ניהול לידים ומעקב אחר לקוחות פוטנציאליים
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: 12,
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#da4477',
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
