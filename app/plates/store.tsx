// app/plates/store.tsx
// Plates Store for Users

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trophy, Gift, Clock, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/constants/supabase';
import { PlatesManager, PlatesTransaction } from '@/lib/plates-manager';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function PlatesStore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PlatesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPlatesData();
    }
  }, [user]);

  const loadPlatesData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get balance
      const userBalance = await PlatesManager.getBalance(user.id);
      setBalance(userBalance);

      // Get transaction history
      const history = await PlatesManager.getTransactionHistory(user.id);
      setTransactions(history);
    } catch (error) {
      console.error('Error loading plates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscountCode = async () => {
    if (!user?.id || !discountCode.trim()) return;

    try {
      setApplyingCode(true);

      const result = await PlatesManager.applyDiscountCode(user.id, discountCode, 0);

      if (result.success && result.discount) {
        if (result.discount.discount_type === 'plates') {
          Alert.alert('🎉 הצלחה!', `קיבלת ${result.discount.discount_value} פלטות!`);
          loadPlatesData();
          setDiscountCode('');
        } else {
          Alert.alert('✅ קוד תקף', 'הקוד נשמר ויופעל ברכישה הבאה שלך');
          setDiscountCode('');
        }
      } else {
        Alert.alert('❌ קוד לא תקף', 'הקוד שהזנת אינו תקף או פג תוקפו');
      }
    } catch (error) {
      console.error('Error applying discount code:', error);
      Alert.alert('שגיאה', 'לא ניתן להפעיל את הקוד');
    } finally {
      setApplyingCode(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return Trophy;
      case 'spent':
        return Gift;
      case 'bonus':
        return TrendingUp;
      case 'refund':
        return Gift;
      default:
        return Trophy;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return Colors.success || '#4ade80';
      case 'spent':
        return Colors.error || '#ef4444';
      case 'bonus':
        return Colors.primary || '#da4477';
      case 'refund':
        return Colors.accent || '#60a5fa';
      default:
        return Colors.textSecondary || '#aaa';
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'earned':
        return 'הרווחת';
      case 'spent':
        return 'הוצאת';
      case 'bonus':
        return 'בונוס';
      case 'refund':
        return 'זיכוי';
      default:
        return type;
    }
  };

  const earningSources = [
    {
      title: 'השלמת אימון',
      description: '10 פלטות לכל אימון',
      icon: Trophy,
      color: Colors.success || '#4ade80',
    },
    {
      title: 'השתתפות בשיעור',
      description: '15 פלטות לכל שיעור',
      icon: Trophy,
      color: Colors.primary || '#da4477',
    },
    {
      title: 'השגת הישגים',
      description: 'פלטות משתנות לפי הישג',
      icon: Trophy,
      color: Colors.accent || '#60a5fa',
    },
  ];

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
          <Text style={styles.title}>🏆 חנות הפלטות</Text>
          <Text style={styles.subtitle}>מערכת תגמולים</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Trophy size={32} color={Colors.primary} />
          </View>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>יתרת פלטות שלך</Text>
            <Text style={styles.balanceValue}>{balance} פלטות</Text>
            <Text style={styles.balanceSubtext}>
              שווה ערך ל-₪{balance} הנחה ברכישות
            </Text>
          </View>
        </View>

        {/* Discount Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 קוד הנחה</Text>
          <View style={styles.discountContainer}>
            <TouchableOpacity
              style={[styles.applyButton, applyingCode && styles.applyButtonDisabled]}
              onPress={handleApplyDiscountCode}
              disabled={applyingCode}
            >
              {applyingCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>הפעל</Text>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.discountInput}
              placeholder="הזן קוד הנחה..."
              placeholderTextColor={Colors.textSecondary}
              value={discountCode}
              onChangeText={setDiscountCode}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* How to Earn Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 איך להרוויח פלטות</Text>
          {earningSources.map((source, index) => (
            <View key={index} style={styles.earningCard}>
              <View style={[styles.earningIcon, { backgroundColor: source.color + '20' }]}>
                <source.icon size={24} color={source.color} />
              </View>
              <View style={styles.earningContent}>
                <Text style={styles.earningTitle}>{source.title}</Text>
                <Text style={styles.earningDescription}>{source.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How to Use Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 איך להשתמש בפלטות</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • השתמש בפלטות לקבלת הנחה עד 50% בכל רכישה{'\n'}
              • 1 פלטה = ₪1 הנחה{'\n'}
              • הפלטות נשמרות ללא הגבלת זמן{'\n'}
              • צבור פלטות והשתמש בהן מתי שתרצה
            </Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 היסטוריית תנועות</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>עדיין אין תנועות</Text>
              <Text style={styles.emptySubtext}>התחל לאמן כדי לצבור פלטות!</Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const TransactionIcon = getTransactionIcon(transaction.transaction_type);
              const color = getTransactionColor(transaction.transaction_type);

              return (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, { backgroundColor: color + '20' }]}>
                    <TransactionIcon size={20} color={color} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                    <Text style={styles.transactionType}>
                      {getTransactionTypeText(transaction.transaction_type)}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color }]}>
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount}
                  </Text>
                </View>
              );
            })
          )}
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
  balanceCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: (Colors.primary || '#da4477') + '40',
  },
  balanceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: (Colors.primary || '#da4477') + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  balanceContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary || '#da4477',
    textAlign: 'right',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'right',
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
  discountContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  discountInput: {
    flex: 1,
    backgroundColor: Colors.card || '#222',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#fff',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  applyButton: {
    backgroundColor: Colors.primary || '#da4477',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  earningCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  earningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  earningContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  earningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  earningDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
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
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text || '#fff',
    lineHeight: 24,
    textAlign: 'right',
  },
  emptyState: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text || '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: Colors.card || '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  transactionInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight || '#888',
    textAlign: 'right',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 12,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary || '#aaa',
  },
});
