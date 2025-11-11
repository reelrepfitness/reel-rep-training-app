// app/admin/green-invoice-test.tsx
// Green Invoice Testing & Admin Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useGreenInvoice } from '../hooks/useGreenInvoice';
import { supabase } from '@/constants/supabase';

export default function GreenInvoiceTestScreen() {
  const {
    syncClient,
    createInvoice,
    getDashboardStats,
    isUserSynced,
    loading,
    error,
  } = useGreenInvoice();

  const [synced, setSynced] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const isSynced = await isUserSynced(user.id);
      setSynced(isSynced);
    }
  };

  const handleSyncClient = async () => {
    try {
      const result = await syncClient({
        name: user?.user_metadata?.full_name || 'Test User',
        phone: '0501234567',
        city: 'Tel Aviv',
      });

      Alert.alert('✅ הצלחה!', 'הלקוח סונכרן ל-Green Invoice');
      console.log('Sync result:', result);
      setSynced(true);
    } catch (err: any) {
      Alert.alert('❌ שגיאה', err.message);
      console.error('Sync error:', err);
    }
  };

  const handleCreateTestInvoice = async () => {
    if (!synced) {
      Alert.alert('שים לב', 'קודם צריך לסנכרן את הלקוח');
      return;
    }

    try {
      const result = await createInvoice({
        amount: 99,
        description: 'מנוי חודשי פרימיום - בדיקה',
        subscriptionType: 'Premium Monthly Test',
        paymentMethod: 'credit_card',
        documentType: 'invoice_receipt',
      });

      Alert.alert(
        '✅ חשבונית נוצרה!',
        `מספר מסמך: ${result.document.gi_document_id}\nסכום: ₪${result.document.amount}`,
        [
          {
            text: 'הצג PDF',
            onPress: () => {
              console.log('PDF URL:', result.downloadUrl);
              // You can open the URL here with Linking.openURL(result.downloadUrl)
            },
          },
          { text: 'סגור' },
        ]
      );
      console.log('Invoice result:', result);
    } catch (err: any) {
      Alert.alert('❌ שגיאה', err.message);
      console.error('Invoice error:', err);
    }
  };

  const handleLoadStats = async () => {
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
      Alert.alert('✅ הצלחה!', 'הנתונים נטענו');
      console.log('Stats:', dashboardStats);
    } catch (err: any) {
      Alert.alert('❌ שגיאה', err.message);
      console.error('Stats error:', err);
    }
  };

  const handleCheckSandbox = () => {
    Alert.alert(
      'Sandbox Green Invoice',
      'פתח את הדפדפן והיכנס ל:\nhttps://app.sandbox.d.greeninvoice.co.il\n\nבדוק:\n- לקוחות (Clients)\n- מסמכים (Documents)',
      [{ text: 'אישור' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Green Invoice - בדיקות</Text>
        <Text style={styles.subtitle}>Sandbox Environment</Text>
      </View>

      {/* User Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>סטטוס משתמש</Text>
        {user && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>User ID: {user.id.slice(0, 8)}...</Text>
            <Text style={styles.infoText}>Email: {user.email}</Text>
            <Text style={[styles.infoText, synced && styles.successText]}>
              {synced ? '✅ מסונכרן ל-Green Invoice' : '⏳ לא מסונכרן'}
            </Text>
          </View>
        )}
      </View>

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>פעולות בדיקה</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSyncClient}
          disabled={loading || synced}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {synced ? '✅ כבר מסונכרן' : '1. סנכרן לקוח'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, !synced && styles.disabledButton]}
          onPress={handleCreateTestInvoice}
          disabled={loading || !synced}
        >
          {loading ? (
            <ActivityIndicator color="#da4477" />
          ) : (
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              2. צור חשבונית בדיקה (₪99)
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleLoadStats}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#da4477" />
          ) : (
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              3. טען נתונים סטטיסטיים
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleCheckSandbox}
        >
          <Text style={[styles.buttonText, styles.outlineButtonText]}>
            4. פתח Sandbox בדפדפן
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Display */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>נתונים פיננסיים</Text>
          <View style={styles.statsBox}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>סך הכנסות:</Text>
              <Text style={styles.statValue}>₪{stats.totalRevenue.toFixed(2)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>חשבוניות:</Text>
              <Text style={styles.statValue}>{stats.totalInvoices}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>קבלות:</Text>
              <Text style={styles.statValue}>{stats.totalReceipts}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>לקוחות:</Text>
              <Text style={styles.statValue}>{stats.clientCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>ממוצע עסקה:</Text>
              <Text style={styles.statValue}>₪{stats.averageTransactionValue.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ שגיאה: {error}</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>הוראות</Text>
        <Text style={styles.instructionText}>
          1. לחץ "סנכרן לקוח" ליצירת לקוח ב-Green Invoice{'\n'}
          2. לחץ "צור חשבונית" ליצירת חשבונית בדיקה{'\n'}
          3. פתח Sandbox בדפדפן כדי לראות את התוצאות{'\n'}
          4. בדוק את הטבלאות ב-Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  header: {
    padding: 20,
    backgroundColor: '#da4477',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'right',
  },
  successText: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#da4477',
  },
  secondaryButton: {
    backgroundColor: '#fff',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#da4477',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#da4477',
  },
  outlineButtonText: {
    color: '#da4477',
  },
  statsBox: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#ff4444',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  instructionText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
});
