// app/admin/financial/monthly-comparison.tsx
// Monthly Comparison with Charts

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { supabase } from '@/constants/supabase';
import Colors from '@/constants/colors';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  month: string;
  revenue: number;
  invoiceCount: number;
  avgTransaction: number;
}

export default function MonthlyComparison() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState({
    currentMonth: 0,
    lastMonth: 0,
    percentageChange: 0,
    trend: 'up' as 'up' | 'down',
  });

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);

      // Get last 6 months data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('green_invoice_documents')
        .select('*')
        .gte('created_at', sixMonthsAgo.toISOString())
        .eq('status', 'paid')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyMap = new Map<string, { revenue: number; count: number }>();

      data?.forEach((doc) => {
        const date = new Date(doc.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { revenue: 0, count: 0 });
        }

        const current = monthlyMap.get(monthKey)!;
        current.revenue += doc.amount || 0;
        current.count += 1;
      });

      // Convert to array
      const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries()).map(
        ([month, data]) => ({
          month,
          revenue: data.revenue,
          invoiceCount: data.count,
          avgTransaction: data.count > 0 ? data.revenue / data.count : 0,
        })
      );

      setMonthlyData(monthlyArray);

      // Calculate comparison
      if (monthlyArray.length >= 2) {
        const current = monthlyArray[monthlyArray.length - 1].revenue;
        const last = monthlyArray[monthlyArray.length - 2].revenue;
        const change = last > 0 ? ((current - last) / last) * 100 : 0;

        setComparisonData({
          currentMonth: current,
          lastMonth: last,
          percentageChange: Math.abs(change),
          trend: change >= 0 ? 'up' : 'down',
        });
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'ינואר',
      'פברואר',
      'מרץ',
      'אפריל',
      'מאי',
      'יוני',
      'יולי',
      'אוגוסט',
      'ספטמבר',
      'אוקטובר',
      'נובמבר',
      'דצמבר',
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const chartConfig = {
    backgroundColor: Colors.card || '#222',
    backgroundGradientFrom: Colors.card || '#222',
    backgroundGradientTo: Colors.card || '#222',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(218, 68, 119, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary || '#da4477',
    },
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>טוען נתונים...</Text>
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
          <Text style={styles.title}>📊 השוואה חודשית</Text>
          <Text style={styles.subtitle}>גרפים וטרנדים</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Comparison Card */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>חודש נוכחי vs. חודש קודם</Text>
          </View>

          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>חודש נוכחי</Text>
              <Text style={styles.comparisonValue}>₪{comparisonData.currentMonth.toFixed(2)}</Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>חודש קודם</Text>
              <Text style={styles.comparisonValue}>₪{comparisonData.lastMonth.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.trendContainer}>
            {comparisonData.trend === 'up' ? (
              <TrendingUp size={24} color={Colors.success} />
            ) : (
              <TrendingDown size={24} color={Colors.error} />
            )}
            <Text
              style={[
                styles.trendText,
                { color: comparisonData.trend === 'up' ? Colors.success : Colors.error },
              ]}
            >
              {comparisonData.percentageChange.toFixed(1)}%{' '}
              {comparisonData.trend === 'up' ? 'עלייה' : 'ירידה'}
            </Text>
          </View>
        </View>

        {/* Revenue Chart */}
        {monthlyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>הכנסות חודשיות</Text>
            <LineChart
              data={{
                labels: monthlyData.map((d) => d.month.split('-')[1]),
                datasets: [
                  {
                    data: monthlyData.map((d) => d.revenue),
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Invoice Count Chart */}
        {monthlyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>מספר חשבוניות</Text>
            <BarChart
              data={{
                labels: monthlyData.map((d) => d.month.split('-')[1]),
                datasets: [
                  {
                    data: monthlyData.map((d) => d.invoiceCount),
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        {/* Monthly Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>פירוט חודשי</Text>
          {monthlyData.reverse().map((month) => (
            <View key={month.month} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthName}>{formatMonth(month.month)}</Text>
                <Text style={styles.monthRevenue}>₪{month.revenue.toFixed(2)}</Text>
              </View>
              <View style={styles.monthStats}>
                <View style={styles.monthStat}>
                  <Text style={styles.monthStatValue}>{month.invoiceCount}</Text>
                  <Text style={styles.monthStatLabel}>חשבוניות</Text>
                </View>
                <View style={styles.monthStat}>
                  <Text style={styles.monthStatValue}>₪{month.avgTransaction.toFixed(2)}</Text>
                  <Text style={styles.monthStatLabel}>ממוצע עסקה</Text>
                </View>
              </View>
            </View>
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
  comparisonCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonHeader: {
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text || '#fff',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  breakdownSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 16,
  },
  monthCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
  },
  monthRevenue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary || '#da4477',
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
    marginBottom: 4,
  },
  monthStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary || '#aaa',
  },
});
