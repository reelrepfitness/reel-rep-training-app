import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { supabase } from '@/constants/supabase';

interface FinancialData {
  todayIncome: number;
  lastMonthIncome: number;
  currentMonthIncome: number;
}

export function FinancialCards() {
  const [data, setData] = useState<FinancialData>({
    todayIncome: 0,
    lastMonthIncome: 0,
    currentMonthIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      // Today's income
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayDocs, error: todayError } = await supabase
        .from('green_invoice_documents')
        .select('amount')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .eq('status', 1); // Paid status

      if (todayError) throw todayError;

      const todayIncome = todayDocs?.reduce((sum, doc) => sum + Number(doc.amount), 0) || 0;

      // Last month income
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      const { data: lastMonthDocs, error: lastMonthError } = await supabase
        .from('green_invoice_documents')
        .select('amount')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .eq('status', 1);

      if (lastMonthError) throw lastMonthError;

      const lastMonthIncome = lastMonthDocs?.reduce((sum, doc) => sum + Number(doc.amount), 0) || 0;

      // Current month income
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: currentMonthDocs, error: currentMonthError } = await supabase
        .from('green_invoice_documents')
        .select('amount')
        .gte('created_at', currentMonthStart.toISOString())
        .eq('status', 1);

      if (currentMonthError) throw currentMonthError;

      const currentMonthIncome = currentMonthDocs?.reduce((sum, doc) => sum + Number(doc.amount), 0) || 0;

      setData({
        todayIncome,
        lastMonthIncome,
        currentMonthIncome,
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
  };

  const chartData = {
    labels: ['חודש שעבר', 'החודש'],
    datasets: [
      {
        data: [data.lastMonthIncome, data.currentMonthIncome],
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        {/* Today's Income Card */}
        <View style={[styles.card, styles.todayCard]}>
          <Text style={styles.cardLabel}>הכנסות היום</Text>
          <Text style={styles.cardValue}>{formatCurrency(data.todayIncome)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>💰</Text>
          </View>
        </View>

        {/* Monthly Comparison Chart */}
        <View style={[styles.card, styles.chartCard]}>
          <Text style={styles.cardLabel}>השוואת חודשים</Text>
          <BarChart
            data={chartData}
            width={screenWidth * 0.42}
            height={120}
            yAxisLabel="₪"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => {
                // Last month = pink, Current month = green
                return `rgba(218, 68, 119, ${opacity})`;
              },
              labelColor: (opacity = 1) => `rgba(24, 24, 24, ${opacity})`,
              style: {
                borderRadius: 12,
              },
              propsForLabels: {
                fontSize: 10,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e3e3e3',
                strokeWidth: 1,
              },
            }}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
          {data.currentMonthIncome > data.lastMonthIncome ? (
            <Text style={styles.trendUp}>📈 גדל!</Text>
          ) : data.currentMonthIncome < data.lastMonthIncome ? (
            <Text style={styles.trendDown}>📉 ירד</Text>
          ) : (
            <Text style={styles.trendEqual}>➡️ זהה</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCard: {
    position: 'relative',
  },
  chartCard: {
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#da4477',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  trendUp: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  trendDown: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 4,
  },
  trendEqual: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginTop: 4,
  },
});