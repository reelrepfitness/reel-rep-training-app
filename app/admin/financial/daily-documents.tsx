// app/admin/financial/daily-documents.tsx
// Daily Income and Documents View

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
import { ChevronLeft, Calendar, DollarSign } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/constants/supabase';
import Colors from '@/constants/colors';

interface DailyDocument {
  id: string;
  gi_document_id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

export default function DailyDocuments() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documents, setDocuments] = useState<DailyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyTotal, setDailyTotal] = useState(0);

  useEffect(() => {
    loadDailyDocuments();
  }, [selectedDate]);

  const loadDailyDocuments = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('green_invoice_documents')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .gte('created_at', dateStr)
        .lt('created_at', new Date(selectedDate.getTime() + 86400000).toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const docsWithNames = data?.map(doc => ({
        ...doc,
        user_name: doc.profiles?.full_name || 'משתמש לא ידוע',
      })) || [];

      setDocuments(docsWithNames);

      const total = docsWithNames
        .filter(doc => doc.status === 'paid')
        .reduce((sum, doc) => sum + (doc.amount || 0), 0);

      setDailyTotal(total);
    } catch (error) {
      console.error('Error loading daily documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.success || '#4ade80';
      case 'pending':
        return '#fbbf24';
      case 'cancelled':
        return Colors.error || '#ef4444';
      default:
        return Colors.textSecondary || '#aaa';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'שולם';
      case 'pending':
        return 'ממתין';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📅 מסמכים יומיים</Text>
          <Text style={styles.subtitle}>הכנסות ומסמכים לפי יום</Text>
        </View>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={20} color={Colors.primary} />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
      </View>

      {/* Daily Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <DollarSign size={28} color={Colors.success} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>סך הכנסות ליום</Text>
          <Text style={styles.summaryValue}>₪{dailyTotal.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{documents.length} מסמכים</Text>
        </View>
      </View>

      {/* Documents List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>אין מסמכים ליום זה</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.user_name}</Text>
                  <Text style={styles.documentDescription}>{doc.description}</Text>
                  <Text style={styles.documentTime}>{formatTime(doc.created_at)}</Text>
                </View>
                <View style={styles.documentAmount}>
                  <Text style={styles.amountValue}>₪{doc.amount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                      {getStatusText(doc.status)}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.documentId}>מסמך: {doc.gi_document_id}</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#181818',
  },
  centered: {
    flex: 1,
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
  dateSelector: {
    padding: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card || '#222',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#fff',
  },
  summaryCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: (Colors.success || '#4ade80') + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  summaryContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.success || '#4ade80',
    textAlign: 'right',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    marginBottom: 4,
  },
  documentTime: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'right',
  },
  documentAmount: {
    alignItems: 'flex-start',
    marginRight: 16,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text || '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  documentId: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
  },
});
