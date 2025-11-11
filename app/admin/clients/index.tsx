// app/admin/clients/index.tsx
// Client Management Screen

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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Search,
  Users,
  Edit,
  Ban,
  CheckCircle,
  Calendar,
  Plus,
  Minus,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/constants/supabase';
import Colors from '@/constants/colors';

interface Client {
  id: string;
  full_name: string;
  email: string;
  subscription_type: string;
  subscription_status: string;
  subscription_start: string;
  subscription_end: string;
  classes_per_month: number;
  classes_used: number;
  block_end_date?: string;
  late_cancellations: number;
  plate_balance: number;
  total_workouts: number;
}

export default function ClientManagement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingField, setEditingField] = useState<string>('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    applySearch();
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את רשימת הלקוחות');
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.full_name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
    );

    setFilteredClients(filtered);
  };

  const handleBlockClient = async (client: Client) => {
    const isBlocked = client.block_end_date && new Date(client.block_end_date) > new Date();

    if (isBlocked) {
      // Unblock
      Alert.alert('ביטול חסימה', `האם לבטל את החסימה של ${client.full_name}?`, [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'כן',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ block_end_date: null })
                .eq('id', client.id);

              if (error) throw error;

              Alert.alert('הצלחה', 'החסימה בוטלה');
              loadClients();
            } catch (error) {
              console.error('Error unblocking client:', error);
              Alert.alert('שגיאה', 'לא ניתן לבטל את החסימה');
            }
          },
        },
      ]);
    } else {
      // Block for 30 days
      Alert.alert('חסימת לקוח', `האם לחסום את ${client.full_name} ל-30 ימים?`, [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'כן',
          style: 'destructive',
          onPress: async () => {
            try {
              const blockDate = new Date();
              blockDate.setDate(blockDate.getDate() + 30);

              const { error } = await supabase
                .from('profiles')
                .update({ block_end_date: blockDate.toISOString() })
                .eq('id', client.id);

              if (error) throw error;

              Alert.alert('הצלחה', 'הלקוח נחסם ל-30 ימים');
              loadClients();
            } catch (error) {
              console.error('Error blocking client:', error);
              Alert.alert('שגיאה', 'לא ניתן לחסום את הלקוח');
            }
          },
        },
      ]);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleUpdateField = async (field: string, value: any) => {
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', selectedClient.id);

      if (error) throw error;

      Alert.alert('הצלחה', 'השדה עודכן בהצלחה');
      loadClients();
      setSelectedClient({ ...selectedClient, [field]: value });
    } catch (error) {
      console.error('Error updating field:', error);
      Alert.alert('שגיאה', 'לא ניתן לעדכן את השדה');
    }
  };

  const handleChangeClasses = async (delta: number) => {
    if (!selectedClient) return;

    const newValue = Math.max(0, selectedClient.classes_used + delta);

    await handleUpdateField('classes_used', newValue);
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success || '#4ade80';
      case 'expired':
        return Colors.error || '#ef4444';
      case 'cancelled':
        return Colors.textSecondary || '#aaa';
      default:
        return Colors.textSecondary || '#aaa';
    }
  };

  const getSubscriptionText = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'expired':
        return 'פג תוקף';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const isClientBlocked = (client: Client) => {
    return client.block_end_date && new Date(client.block_end_date) > new Date();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'לא נקבע';
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>👥 ניהול לקוחות</Text>
          <Text style={styles.subtitle}>{clients.length} לקוחות</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש לפי שם או אימייל..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Clients List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredClients.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>לא נמצאו לקוחות</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredClients.map((client) => {
            const blocked = isClientBlocked(client);

            return (
              <View
                key={client.id}
                style={[styles.clientCard, blocked && styles.clientCardBlocked]}
              >
                <View style={styles.clientHeader}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.full_name || 'משתמש'}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                    {blocked && (
                      <View style={styles.blockedBadge}>
                        <Ban size={14} color={Colors.error} />
                        <Text style={styles.blockedText}>
                          חסום עד {formatDate(client.block_end_date)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.clientStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>מנוי</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getSubscriptionColor(client.subscription_status || 'cancelled') + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getSubscriptionColor(client.subscription_status || 'cancelled') },
                        ]}
                      >
                        {getSubscriptionText(client.subscription_status || 'cancelled')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>שיעורים</Text>
                    <Text style={styles.statValue}>
                      {client.classes_used || 0}/{client.classes_per_month || 0}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>פלטות</Text>
                    <Text style={styles.statValue}>{client.plate_balance || 0}</Text>
                  </View>
                </View>

                <View style={styles.clientActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditClient(client)}
                  >
                    <Edit size={18} color={Colors.primary} />
                    <Text style={[styles.actionButtonText, { color: Colors.primary }]}>ערוך</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      blocked ? styles.unblockButton : styles.blockButton,
                    ]}
                    onPress={() => handleBlockClient(client)}
                  >
                    {blocked ? (
                      <>
                        <CheckCircle size={18} color={Colors.success} />
                        <Text style={[styles.actionButtonText, { color: Colors.success }]}>
                          בטל חסימה
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ban size={18} color={Colors.error} />
                        <Text style={[styles.actionButtonText, { color: Colors.error }]}>חסום</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedClient && (
              <>
                <Text style={styles.modalTitle}>עריכת {selectedClient.full_name}</Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Subscription Dates */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>תאריך תחילת מנוי</Text>
                    <TouchableOpacity
                      style={styles.editButton2}
                      onPress={() => {
                        setEditingField('subscription_start');
                        setShowDatePicker(true);
                      }}
                    >
                      <Calendar size={18} color={Colors.primary} />
                      <Text style={styles.editButtonText2}>
                        {formatDate(selectedClient.subscription_start)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>תאריך סיום מנוי</Text>
                    <TouchableOpacity
                      style={styles.editButton2}
                      onPress={() => {
                        setEditingField('subscription_end');
                        setShowDatePicker(true);
                      }}
                    >
                      <Calendar size={18} color={Colors.primary} />
                      <Text style={styles.editButtonText2}>
                        {formatDate(selectedClient.subscription_end)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Classes Used */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>שיעורים שנוצלו</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleChangeClasses(1)}
                      >
                        <Plus size={20} color={Colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{selectedClient.classes_used || 0}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => handleChangeClasses(-1)}
                      >
                        <Minus size={20} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.editSection}>
                    <Text style={styles.editLabel}>סטטיסטיקות</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxValue}>{selectedClient.total_workouts || 0}</Text>
                        <Text style={styles.statBoxLabel}>סך אימונים</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statBoxValue}>
                          {selectedClient.late_cancellations || 0}
                        </Text>
                        <Text style={styles.statBoxLabel}>ביטולים מאוחרים</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                  }}
                >
                  <Text style={styles.closeButtonText}>סגור</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && selectedClient && (
        <DateTimePicker
          value={
            editingField === 'subscription_start'
              ? new Date(selectedClient.subscription_start || new Date())
              : new Date(selectedClient.subscription_end || new Date())
          }
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              handleUpdateField(editingField, date.toISOString());
            }
          }}
        />
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
  },
  searchContainer: {
    padding: 20,
  },
  searchBar: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  clientCard: {
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
  clientCardBlocked: {
    borderWidth: 2,
    borderColor: (Colors.error || '#ef4444') + '40',
  },
  clientHeader: {
    marginBottom: 12,
  },
  clientInfo: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'right',
    marginBottom: 8,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: (Colors.error || '#ef4444') + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  blockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error || '#ef4444',
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border || '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
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
  clientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    backgroundColor: (Colors.primary || '#da4477') + '20',
  },
  blockButton: {
    backgroundColor: (Colors.error || '#ef4444') + '20',
  },
  unblockButton: {
    backgroundColor: (Colors.success || '#4ade80') + '20',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card || '#222',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 24,
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text || '#fff',
    textAlign: 'right',
    marginBottom: 8,
  },
  editButton2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background || '#181818',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  editButtonText2: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#fff',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: (Colors.primary || '#da4477') + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text || '#fff',
    minWidth: 60,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background || '#181818',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text || '#fff',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary || '#aaa',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.primary || '#da4477',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
