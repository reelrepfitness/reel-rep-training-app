// hooks/useGreenInvoice.ts
// React Native hook for Green Invoice integration

import { useState } from 'react';
import { supabase } from '@/constants/supabase';

export interface InvoiceData {
  amount: number;
  description: string;
  subscriptionType: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paypal' | 'bit' | 'cash';
  documentType?: 'invoice' | 'invoice_receipt';
}

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  totalReceipts: number;
  totalRefunds: number;
  revenueByMonth: Record<string, number>;
  clientCount: number;
  averageTransactionValue: number;
}

export function useGreenInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sync current user as Green Invoice client
   * Call this when user subscribes for the first time
   */
  const syncClient = async (userData?: {
    name?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('gi-sync-client', {
        body: { userData },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync client');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create invoice/receipt for a payment
   * Call this when subscription payment is successful
   */
  const createInvoice = async (invoiceData: InvoiceData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('gi-create-invoice', {
        body: invoiceData,
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get financial dashboard statistics
   * For admin panel
   */
  const getDashboardStats = async (
    startDate?: string,
    endDate?: string,
    includeGIData = false
  ): Promise<DashboardStats | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (includeGIData) params.append('include_gi_data', 'true');

      const { data, error: fnError } = await supabase.functions.invoke(
        `gi-get-stats?${params.toString()}`,
        { method: 'GET' }
      );

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to get stats');
      }

      return data.stats;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user's invoices
   */
  const getUserInvoices = async (userId?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('green_invoice_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is synced with Green Invoice
   */
  const isUserSynced = async (userId?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const targetUserId = userId || session?.session?.user?.id;

      if (!targetUserId) return false;

      const { data, error: dbError } = await supabase
        .from('green_invoice_clients')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      return !dbError && !!data;
    } catch {
      return false;
    }
  };

  return {
    loading,
    error,
    syncClient,
    createInvoice,
    getDashboardStats,
    getUserInvoices,
    isUserSynced,
  };
}

// Example usage in a component:
/*
import { useGreenInvoice } from './hooks/useGreenInvoice';

function SubscriptionScreen() {
  const { syncClient, createInvoice, loading } = useGreenInvoice();

  const handleSubscribe = async () => {
    try {
      // 1. First, sync user as client (only on first subscription)
      const isSync = await isUserSynced();
      if (!isSync) {
        await syncClient({
          name: 'Ivan Cohen',
          phone: '0501234567',
        });
      }

      // 2. Process payment with your payment provider (Grow/Boostapp)
      const paymentResult = await processPayment();

      // 3. Create invoice in Green Invoice
      await createInvoice({
        amount: 99,
        description: 'חודש מנוי פרימיום',
        subscriptionType: 'Premium Monthly',
        paymentMethod: 'credit_card',
        documentType: 'invoice_receipt',
      });

      Alert.alert('הצלחה!', 'התשלום בוצע והחשבונית נוצרה');
    } catch (error) {
      Alert.alert('שגיאה', error.message);
    }
  };

  return (
    <Button 
      title="הירשם למנוי" 
      onPress={handleSubscribe} 
      loading={loading} 
    />
  );
}
*/
