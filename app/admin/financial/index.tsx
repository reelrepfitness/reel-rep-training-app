// app/admin/financial/index.tsx
// Financial Dashboard - Main Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DollarSign, Calendar, TrendingUp, FileText, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/constants/supabase';
import Colors from '@/constants/colors';

interface FinancialStats {
  todayRevenue: number;
  monthRevenue: number;
  totalInvoices: number;
  pendingPayments: number;
}

export default function FinancialDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<FinancialStats>({
    todayRevenue: 0,
    monthRevenue: 0,
    totalInvoices: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialStats();
  }, []);

  const loadFinancialStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      // Get today's revenue
      const { data: todayData } = await supabase
        .from('green_invoice_documents')
        .select('amount')
        .gte('created_at', today)
        .eq('status', 'paid');

      const todayRevenue = todayData?.reduce((sum, doc) => sum + (doc.amount || 0), 0) || 0;

      // Get month revenue
      const { data: monthData } = await supabase
        .from('green_invoice_documents')
        .select('amount')
        .gte('created_at', firstDayOfMonth)
        .eq('status', 'paid');

      const monthRevenue = monthData?.reduce((sum, doc) => sum + (doc.amount || 0), 0) || 0;

      // Get total invoices
      const { count: totalInvoices } = await supabase
        .from('green_invoice_documents')
        .select('*', { count: 'exact', head: true });

      // Get pending payments
      const { count: pendingPayments } = await supabase
        .from('green_invoice_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        todayRevenue,
        monthRevenue,
        totalInvoices: totalInvoices || 0,
        pendingPayments: pendingPayments || 0,
      });
    } catch (error) {
      console.error('Error loading financial stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'הכנסות היום',
      value: `₪${stats.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: Colors.success || '#4ade80',
    },
    {
      label: 'הכנסות חודשיות',
      value: `₪${stats.monthRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: Colors.primary || '#da4477',
    },
    {
      label: 'סך חשבוניות',
      value: stats.totalInvoices.toString(),
      icon: FileText,
      color: Colors.accent || '#60a5fa',
    },
    {
      label: 'תשלומים ממתינים',
      value: stats.pendingPayments.toString(),
      icon: Calendar,
      color: '#fbbf24',
    },
  ];

  const menuItems = [
    {
      title: 'מסמכים יומיים',
      subtitle: 'צפה בהכנסות ומסמכים לפי יום',
      icon: Calendar,
      color: Colors.primary || '#da4477',
      route: '/admin/financial/daily-documents',
    },
    {
      title: 'השוואה חודשית',
      subtitle: 'גרפים והשוואות בין חודשים',
      icon: TrendingUp,
      color: Colors.accent || '#60a5fa',
      route: '/admin/financial/monthly-comparison',
    },
    {
      title: 'כל החשבוניות',
      subtitle: 'צפה וסנן את כל המסמכים',
      icon: FileText,
      color: Colors.success || '#4ade80',
      route: '/admin/financial/all-invoices',
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>טוען נתונים פיננסיים...</Text>
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
          <Text style={styles.title}>💰 לוח ניהול פיננסי</Text>
          <Text style={styles.subtitle}>מערכת Green Invoice</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <item.icon size={28} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronLeft size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  menuSection: {
    gap: 12,
  },
  menuCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  menuContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
  },
});
