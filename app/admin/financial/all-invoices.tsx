// app/admin/financial/all-invoices.tsx
// All Invoices with Filters

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Filter } from 'lucide-react-native';
import { supabase } from '@/constants/supabase';
import Colors from '@/constants/colors';

interface Invoice {
  id: string;
  gi_document_id: string;
  amount: number;
  description: string;
  status: string;
  document_type: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

type FilterStatus = 'all' | 'paid' | 'pending' | 'cancelled';
type FilterType = 'all' | 'invoice' | 'invoice_receipt' | 'receipt';

export default function AllInvoices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, typeFilter, invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('green_invoice_documents')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const invoicesWithNames = data?.map((inv) => ({
        ...inv,
        user_name: inv.profiles?.full_name || 'משתמש לא ידוע',
      })) || [];

      setInvoices(invoicesWithNames);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.document_type === typeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.user_name?.toLowerCase().includes(query) ||
          inv.description?.toLowerCase().includes(query) ||
          inv.gi_document_id?.toLowerCase().includes(query)
      );
    }

    setFilteredInvoices(filtered);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  const getTypeText = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'חשבונית';
      case 'invoice_receipt':
        return 'חשבונית מס/קבלה';
      case 'receipt':
        return 'קבלה';
      default:
        return type;
    }
  };

  const totalAmount = filteredInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📋 כל החשבוניות</Text>
          <Text style={styles.subtitle}>סינון וחיפוש מסמכים</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש לפי שם, תיאור או מספר מסמך..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>סטטוס:</Text>
            <View style={styles.filterOptions}>
              {(['all', 'paid', 'pending', 'cancelled'] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    statusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status === 'all'
                      ? 'הכל'
                      : status === 'paid'
                      ? 'שולם'
                      : status === 'pending'
                      ? 'ממתין'
                      : 'בוטל'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>סוג מסמך:</Text>
            <View style={styles.filterOptions}>
              {(['all', 'invoice', 'invoice_receipt', 'receipt'] as FilterType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, typeFilter === type && styles.filterChipActive]}
                  onPress={() => setTypeFilter(type)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      typeFilter === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type === 'all' ? 'הכל' : getTypeText(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {filteredInvoices.length} מסמכים • סך: ₪{totalAmount.toFixed(2)}
        </Text>
      </View>

      {/* Invoices List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>לא נמצאו מסמכים</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredInvoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceName}>{invoice.user_name}</Text>
                  <Text style={styles.invoiceDescription}>{invoice.description}</Text>
                  <Text style={styles.invoiceDate}>{formatDate(invoice.created_at)}</Text>
                  <Text style={styles.invoiceId}>מסמך: {invoice.gi_document_id}</Text>
                </View>
                <View style={styles.invoiceAmount}>
                  <Text style={styles.amountValue}>₪{invoice.amount.toFixed(2)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(invoice.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                      {getStatusText(invoice.status)}
                    </Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{getTypeText(invoice.document_type)}</Text>
                  </View>
                </View>
              </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card || '#222',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text || '#fff',
    paddingVertical: 12,
    textAlign: 'right',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.card || '#222',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    backgroundColor: Colors.card || '#222',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background || '#181818',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border || '#333',
  },
  filterChipActive: {
    backgroundColor: Colors.primary || '#da4477',
    borderColor: Colors.primary || '#da4477',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary || '#aaa',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  summaryBar: {
    backgroundColor: Colors.card || '#222',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
  },
  invoiceInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  invoiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceId: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'right',
  },
  invoiceAmount: {
    alignItems: 'flex-start',
    marginRight: 16,
    gap: 6,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text || '#fff',
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
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.background || '#181818',
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary || '#aaa',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
  },
});
