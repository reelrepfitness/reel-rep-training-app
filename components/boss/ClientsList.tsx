import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/constants/supabase';
import { Search, ChevronRight, User } from 'lucide-react-native';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  subscription_status: string;
  subscription_type?: string;
  plate_balance: number;
  is_blocked: boolean;
  fitness_level?: string;
}

export function ClientsList() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.full_name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone_number?.includes(query)
    );
    setFilteredClients(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4ade80';
      case 'expired':
        return '#f87171';
      case 'cancelled':
        return '#94a3b8';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'expired':
        return 'פג תוקף';
      case 'cancelled':
        return 'בוטל';
      default:
        return 'לא פעיל';
    }
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={[styles.clientCard, item.is_blocked && styles.clientCardBlocked]}
      onPress={() => router.push(`/client-dashboard?clientId=${item.id}` as any)}
    >
      <View style={styles.clientMain}>
        <ChevronRight size={20} color="#94a3b8" />

        <View style={styles.clientInfo}>
          <View style={styles.clientHeader}>
            <Text style={styles.clientName}>{item.full_name || 'ללא שם'}</Text>
            {item.is_blocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedText}>חסום</Text>
              </View>
            )}
          </View>

          <Text style={styles.clientEmail}>{item.email}</Text>
          <Text style={styles.clientPhone}>{item.phone_number}</Text>

          <View style={styles.clientFooter}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.subscription_status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.subscription_status)}</Text>
            </View>

            {item.subscription_type && (
              <Text style={styles.subscriptionType}>{item.subscription_type}</Text>
            )}

            <Text style={styles.plateBalance}>🏋️ {item.plate_balance || 0}</Text>
          </View>
        </View>

        <View style={styles.clientAvatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <User size={24} color="#94a3b8" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#da4477" />
        <Text style={styles.loadingText}>טוען לקוחות...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לקוח (שם, אימייל, טלפון)..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{clients.length}</Text>
          <Text style={styles.statLabel}>סה"כ לקוחות</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {clients.filter((c) => c.subscription_status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>פעילים</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {clients.filter((c) => c.is_blocked).length}
          </Text>
          <Text style={styles.statLabel}>חסומים</Text>
        </View>
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>לא נמצאו לקוחות</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#181818',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientCardBlocked: {
    borderWidth: 2,
    borderColor: '#f87171',
    backgroundColor: '#fff5f5',
  },
  clientMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  blockedBadge: {
    backgroundColor: '#f87171',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 8,
  },
  clientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscriptionType: {
    fontSize: 12,
    color: '#666',
  },
  plateBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#da4477',
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
