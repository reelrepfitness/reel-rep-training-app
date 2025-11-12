import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/constants/supabase';
import { useGreenInvoice } from './hooks/useGreenInvoice';
import {
  ArrowLeft,
  Save,
  Ban,
  CheckCircle,
  Calendar,
  CreditCard,
  Trophy,
  Activity,
  FileText,
  MessageSquare,
  Clock,
  X,
  Download,
  Edit2,
  Trash2,
} from 'lucide-react-native';

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  subscription_status: string;
  subscription_type?: string;
  subscription_start?: string;
  subscription_end?: string;
  plate_balance: number;
  is_blocked: boolean;
  block_reason?: string;
  block_end_date?: string;
  fitness_level?: string;
  late_cancellations: number;
  address?: string;
  city?: string;
  birth_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  goals?: string;
  created_at: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const { getUserInvoices, loading: invoicesLoading } = useGreenInvoice();

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode states
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [editingPlateBalance, setEditingPlateBalance] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [goals, setGoals] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('');
  const [subscriptionStart, setSubscriptionStart] = useState('');
  const [subscriptionEnd, setSubscriptionEnd] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [plateBalance, setPlateBalance] = useState('0');

  // Additional data states
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);

      // Load client profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      if (profileError) throw profileError;

      setClient(profileData);
      populateFormFields(profileData);

      // Load additional data in parallel
      await Promise.all([
        loadWorkoutLogs(),
        loadChallenges(),
        loadInvoices(),
        loadAttendance(),
        loadNotes(),
      ]);
    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את נתוני הלקוח');
    } finally {
      setLoading(false);
    }
  };

  const populateFormFields = (data: ClientProfile) => {
    setFullName(data.full_name || '');
    setEmail(data.email || '');
    setPhone(data.phone_number || '');
    setAddress(data.address || '');
    setCity(data.city || '');
    setBirthDate(data.birth_date || '');
    setEmergencyContactName(data.emergency_contact_name || '');
    setEmergencyContactPhone(data.emergency_contact_phone || '');
    setMedicalNotes(data.medical_notes || '');
    setGoals(data.goals || '');
    setFitnessLevel(data.fitness_level || 'beginner');
    setSubscriptionType(data.subscription_type || '');
    setSubscriptionStart(data.subscription_start || '');
    setSubscriptionEnd(data.subscription_end || '');
    setSubscriptionStatus(data.subscription_status || 'inactive');
    setPlateBalance(String(data.plate_balance || 0));
  };

  const loadWorkoutLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWorkoutLogs(data || []);
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
  };

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await getUserInvoices(String(clientId));
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClientData();
    setRefreshing(false);
  };

  const handleSaveInfo = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
          phone_number: phone,
          address: address,
          city: city,
          birth_date: birthDate,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          medical_notes: medicalNotes,
          goals: goals,
          fitness_level: fitnessLevel,
        })
        .eq('id', clientId);

      if (error) throw error;

      Alert.alert('✅ נשמר', 'המידע עודכן בהצלחה');
      setEditingInfo(false);
      await loadClientData();
    } catch (error) {
      console.error('Error saving client info:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את המידע');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubscription = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_type: subscriptionType,
          subscription_start: subscriptionStart,
          subscription_end: subscriptionEnd,
          subscription_status: subscriptionStatus,
        })
        .eq('id', clientId);

      if (error) throw error;

      Alert.alert('✅ נשמר', 'המנוי עודכן בהצלחה');
      setEditingSubscription(false);
      await loadClientData();
    } catch (error) {
      console.error('Error saving subscription:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את המנוי');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlateBalance = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          plate_balance: parseInt(plateBalance) || 0,
        })
        .eq('id', clientId);

      if (error) throw error;

      Alert.alert('✅ נשמר', 'יתרת הפלטות עודכנה בהצלחה');
      setEditingPlateBalance(false);
      await loadClientData();
    } catch (error) {
      console.error('Error saving plate balance:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את יתרת הפלטות');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    Alert.alert(
      'שחרור חסימה',
      'האם אתה בטוח שברצונך לשחרר את החסימה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'שחרר',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  is_blocked: false,
                  block_reason: null,
                  block_end_date: null,
                  late_cancellations: 0,
                })
                .eq('id', clientId);

              if (error) throw error;

              Alert.alert('✅ הצלחה', 'החסימה שוחררה');
              await loadClientData();
            } catch (error) {
              console.error('Error unblocking client:', error);
              Alert.alert('שגיאה', 'לא הצלחנו לשחרר את החסימה');
            }
          },
        },
      ]
    );
  };

  const handleBlockClient = async () => {
    Alert.prompt(
      'חסימת לקוח',
      'הזן סיבה לחסימה:',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'חסום',
          onPress: async (reason) => {
            try {
              const blockEndDate = new Date();
              blockEndDate.setDate(blockEndDate.getDate() + 7); // Block for 7 days

              const { error } = await supabase
                .from('profiles')
                .update({
                  is_blocked: true,
                  block_reason: reason || 'לא צוין',
                  block_end_date: blockEndDate.toISOString(),
                })
                .eq('id', clientId);

              if (error) throw error;

              Alert.alert('✅ הצלחה', 'הלקוח נחסם ל-7 ימים');
              await loadClientData();
            } catch (error) {
              console.error('Error blocking client:', error);
              Alert.alert('שגיאה', 'לא הצלחנו לחסום את הלקוח');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleToggleChallengeCompletion = async (challengeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_challenges')
        .update({ completed: !currentStatus })
        .eq('id', challengeId);

      if (error) throw error;

      await loadChallenges();
    } catch (error) {
      console.error('Error toggling challenge:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את האתגר');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase.from('admin_notes').insert({
        client_id: clientId,
        note: newNote,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      setNewNote('');
      await loadNotes();
      Alert.alert('✅ נשמר', 'ההערה נוספה');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף את ההערה');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert('מחיקת הערה', 'האם למחוק את ההערה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('admin_notes').delete().eq('id', noteId);

            if (error) throw error;

            await loadNotes();
          } catch (error) {
            console.error('Error deleting note:', error);
            Alert.alert('שגיאה', 'לא הצלחנו למחוק את ההערה');
          }
        },
      },
    ]);
  };

  const handleDownloadInvoice = async (invoiceUrl: string) => {
    try {
      await Linking.openURL(invoiceUrl);
    } catch (error) {
      console.error('Error opening invoice:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לפתוח את החשבונית');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#da4477" />
          <Text style={styles.loadingText}>טוען נתוני לקוח...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>לא נמצא לקוח</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>חזור</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#181818" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{client.full_name}</Text>
          <Text style={styles.headerSubtitle}>{client.email}</Text>
        </View>

        <View style={styles.headerAvatar}>
          {client.avatar_url ? (
            <Image source={{ uri: client.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {client.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Blocked Status Card */}
        {client.is_blocked && (
          <View style={styles.blockedCard}>
            <View style={styles.blockedHeader}>
              <Ban size={24} color="#fff" />
              <Text style={styles.blockedTitle}>לקוח חסום</Text>
            </View>
            <Text style={styles.blockedReason}>סיבה: {client.block_reason || 'לא צוין'}</Text>
            {client.block_end_date && (
              <Text style={styles.blockedDate}>
                עד: {new Date(client.block_end_date).toLocaleDateString('he-IL')}
              </Text>
            )}
            <TouchableOpacity style={styles.unblockButton} onPress={handleUnblock}>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.unblockButtonText}>שחרר חסימה</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {!client.is_blocked && (
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={handleBlockClient}>
              <Ban size={20} color="#f87171" />
              <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>חסום לקוח</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(`tel:${client.phone_number}`)}
          >
            <Text style={styles.actionButtonText}>📱 התקשר</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(`whatsapp://send?phone=${client.phone_number}`)}
          >
            <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => setEditingInfo(!editingInfo)}>
              <Edit2 size={20} color="#da4477" />
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          </View>

          {editingInfo ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                placeholder="שם מלא"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="אימייל"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="טלפון"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="כתובת"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="עיר"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={styles.input}
                placeholder="תאריך לידה (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
                value={birthDate}
                onChangeText={setBirthDate}
              />
              <TextInput
                style={styles.input}
                placeholder="איש קשר חירום - שם"
                placeholderTextColor="#94a3b8"
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
              />
              <TextInput
                style={styles.input}
                placeholder="איש קשר חירום - טלפון"
                placeholderTextColor="#94a3b8"
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="הערות רפואיות"
                placeholderTextColor="#94a3b8"
                value={medicalNotes}
                onChangeText={setMedicalNotes}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="מטרות"
                placeholderTextColor="#94a3b8"
                value={goals}
                onChangeText={setGoals}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>רמת כושר:</Text>
              <View style={styles.levelButtons}>
                {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      fitnessLevel === level && styles.levelButtonActive,
                    ]}
                    onPress={() => setFitnessLevel(level)}
                  >
                    <Text
                      style={[
                        styles.levelButtonText,
                        fitnessLevel === level && styles.levelButtonTextActive,
                      ]}
                    >
                      {level === 'beginner' && 'מתחיל'}
                      {level === 'intermediate' && 'בינוני'}
                      {level === 'advanced' && 'מתקדם'}
                      {level === 'expert' && 'מומחה'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonCancel]}
                  onPress={() => {
                    setEditingInfo(false);
                    populateFormFields(client);
                  }}
                >
                  <X size={20} color="#666" />
                  <Text style={styles.formButtonCancelText}>ביטול</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonSave]}
                  onPress={handleSaveInfo}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Save size={20} color="#fff" />
                      <Text style={styles.formButtonSaveText}>שמור</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>טלפון:</Text>
                <Text style={styles.infoValue}>{client.phone_number || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>כתובת:</Text>
                <Text style={styles.infoValue}>{client.address || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>עיר:</Text>
                <Text style={styles.infoValue}>{client.city || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>תאריך לידה:</Text>
                <Text style={styles.infoValue}>
                  {client.birth_date
                    ? new Date(client.birth_date).toLocaleDateString('he-IL')
                    : '-'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>רמת כושר:</Text>
                <Text style={styles.infoValue}>
                  {client.fitness_level === 'beginner' && 'מתחיל'}
                  {client.fitness_level === 'intermediate' && 'בינוני'}
                  {client.fitness_level === 'advanced' && 'מתקדם'}
                  {client.fitness_level === 'expert' && 'מומחה'}
                  {!client.fitness_level && '-'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>איש קשר חירום:</Text>
                <Text style={styles.infoValue}>
                  {client.emergency_contact_name || '-'} ({client.emergency_contact_phone || '-'})
                </Text>
              </View>
              {client.medical_notes && (
                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>הערות רפואיות:</Text>
                  <Text style={styles.infoValue}>{client.medical_notes}</Text>
                </View>
              )}
              {client.goals && (
                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>מטרות:</Text>
                  <Text style={styles.infoValue}>{client.goals}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => setEditingSubscription(!editingSubscription)}>
              <Edit2 size={20} color="#da4477" />
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>מנוי</Text>
          </View>

          {editingSubscription ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                placeholder="סוג מנוי (Premium, Basic, וכו')"
                placeholderTextColor="#94a3b8"
                value={subscriptionType}
                onChangeText={setSubscriptionType}
              />
              <TextInput
                style={styles.input}
                placeholder="תאריך התחלה (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
                value={subscriptionStart}
                onChangeText={setSubscriptionStart}
              />
              <TextInput
                style={styles.input}
                placeholder="תאריך סיום (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
                value={subscriptionEnd}
                onChangeText={setSubscriptionEnd}
              />

              <Text style={styles.inputLabel}>סטטוס מנוי:</Text>
              <View style={styles.levelButtons}>
                {['active', 'expired', 'cancelled', 'inactive'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.levelButton,
                      subscriptionStatus === status && styles.levelButtonActive,
                    ]}
                    onPress={() => setSubscriptionStatus(status)}
                  >
                    <Text
                      style={[
                        styles.levelButtonText,
                        subscriptionStatus === status && styles.levelButtonTextActive,
                      ]}
                    >
                      {status === 'active' && 'פעיל'}
                      {status === 'expired' && 'פג תוקף'}
                      {status === 'cancelled' && 'בוטל'}
                      {status === 'inactive' && 'לא פעיל'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonCancel]}
                  onPress={() => {
                    setEditingSubscription(false);
                    populateFormFields(client);
                  }}
                >
                  <X size={20} color="#666" />
                  <Text style={styles.formButtonCancelText}>ביטול</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonSave]}
                  onPress={handleSaveSubscription}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Save size={20} color="#fff" />
                      <Text style={styles.formButtonSaveText}>שמור</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>סוג מנוי:</Text>
                <Text style={styles.infoValue}>{client.subscription_type || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>סטטוס:</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(client.subscription_status) }]}>
                  {getStatusText(client.subscription_status)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>התחלה:</Text>
                <Text style={styles.infoValue}>
                  {client.subscription_start
                    ? new Date(client.subscription_start).toLocaleDateString('he-IL')
                    : '-'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>סיום:</Text>
                <Text style={styles.infoValue}>
                  {client.subscription_end
                    ? new Date(client.subscription_end).toLocaleDateString('he-IL')
                    : '-'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Plate Balance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => setEditingPlateBalance(!editingPlateBalance)}>
              <Edit2 size={20} color="#da4477" />
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>יתרת פלטות 🏋️</Text>
          </View>

          {editingPlateBalance ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                placeholder="יתרת פלטות"
                placeholderTextColor="#94a3b8"
                value={plateBalance}
                onChangeText={setPlateBalance}
                keyboardType="numeric"
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonCancel]}
                  onPress={() => {
                    setEditingPlateBalance(false);
                    populateFormFields(client);
                  }}
                >
                  <X size={20} color="#666" />
                  <Text style={styles.formButtonCancelText}>ביטול</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonSave]}
                  onPress={handleSavePlateBalance}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Save size={20} color="#fff" />
                      <Text style={styles.formButtonSaveText}>שמור</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.plateBalanceDisplay}>
              <Text style={styles.plateBalanceValue}>{client.plate_balance || 0}</Text>
              <Text style={styles.plateBalanceLabel}>פלטות</Text>
            </View>
          )}
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אתגרים</Text>
          {challenges.length === 0 ? (
            <Text style={styles.emptyText}>אין אתגרים</Text>
          ) : (
            challenges.map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeCard}
                onPress={() =>
                  handleToggleChallengeCompletion(challenge.id, challenge.completed)
                }
              >
                <View style={styles.challengeContent}>
                  <Text style={styles.challengeName}>{challenge.challenge?.name || 'אתגר'}</Text>
                  <Text style={styles.challengeDate}>
                    {new Date(challenge.created_at).toLocaleDateString('he-IL')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.challengeStatus,
                    challenge.completed && styles.challengeStatusCompleted,
                  ]}
                >
                  <Text style={styles.challengeStatusText}>
                    {challenge.completed ? '✅ הושלם' : '⏳ בתהליך'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Workout Logs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>יומן אימונים (10 אחרונים)</Text>
          {workoutLogs.length === 0 ? (
            <Text style={styles.emptyText}>אין אימונים</Text>
          ) : (
            workoutLogs.map((log) => (
              <View key={log.id} style={styles.workoutCard}>
                <Text style={styles.workoutDate}>
                  {new Date(log.created_at).toLocaleDateString('he-IL')}
                </Text>
                <Text style={styles.workoutType}>{log.exercise_type || 'אימון כללי'}</Text>
                {log.weight && <Text style={styles.workoutDetail}>משקל: {log.weight} ק"ג</Text>}
                {log.reps && <Text style={styles.workoutDetail}>חזרות: {log.reps}</Text>}
                {log.sets && <Text style={styles.workoutDetail}>סטים: {log.sets}</Text>}
                {log.duration && <Text style={styles.workoutDetail}>משך: {log.duration} דק'</Text>}
              </View>
            ))
          )}
        </View>

        {/* Attendance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>נוכחות בשיעורים (20 אחרונים)</Text>
          {attendance.length === 0 ? (
            <Text style={styles.emptyText}>אין נתוני נוכחות</Text>
          ) : (
            attendance.map((booking) => (
              <View key={booking.id} style={styles.attendanceCard}>
                <Text style={styles.attendanceDate}>
                  {booking.class?.class_date
                    ? new Date(booking.class.class_date).toLocaleDateString('he-IL')
                    : '-'}
                </Text>
                <Text style={styles.attendanceClass}>{booking.class?.name_hebrew || 'שיעור'}</Text>
                <Text
                  style={[
                    styles.attendanceStatus,
                    booking.status === 'confirmed' && styles.attendanceStatusConfirmed,
                    booking.status === 'cancelled' && styles.attendanceStatusCancelled,
                  ]}
                >
                  {booking.status === 'confirmed' && '✅ אושר'}
                  {booking.status === 'cancelled' && '❌ בוטל'}
                  {booking.status === 'waitlist' && '⏳ רשימת המתנה'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Invoices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>חשבוניות וקבלות</Text>
          {invoicesLoading ? (
            <ActivityIndicator color="#da4477" />
          ) : invoices.length === 0 ? (
            <Text style={styles.emptyText}>אין חשבוניות</Text>
          ) : (
            invoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => handleDownloadInvoice(invoice.pdf_url)}
              >
                <View style={styles.invoiceContent}>
                  <Text style={styles.invoiceNumber}>
                    {invoice.gi_document_id || invoice.document_number}
                  </Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(invoice.created_at).toLocaleDateString('he-IL')}
                  </Text>
                  <Text style={styles.invoiceAmount}>₪{invoice.amount}</Text>
                </View>
                <Download size={20} color="#da4477" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Admin Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הערות אדמין</Text>

          <View style={styles.addNoteContainer}>
            <TouchableOpacity style={styles.addNoteButton} onPress={handleAddNote}>
              <Text style={styles.addNoteButtonText}>הוסף</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.addNoteInput}
              placeholder="הוסף הערה..."
              placeholderTextColor="#94a3b8"
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />
          </View>

          {notes.length === 0 ? (
            <Text style={styles.emptyText}>אין הערות</Text>
          ) : (
            notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <TouchableOpacity
                  style={styles.noteDeleteButton}
                  onPress={() => handleDeleteNote(note.id)}
                >
                  <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
                <Text style={styles.noteText}>{note.note}</Text>
                <Text style={styles.noteDate}>
                  {new Date(note.created_at).toLocaleString('he-IL')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Account Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סטטיסטיקות חשבון</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{workoutLogs.length}</Text>
              <Text style={styles.statLabel}>אימונים</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {attendance.filter((a) => a.status === 'confirmed').length}
              </Text>
              <Text style={styles.statLabel}>שיעורים</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{challenges.filter((c) => c.completed).length}</Text>
              <Text style={styles.statLabel}>אתגרים</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{client.late_cancellations || 0}/3</Text>
              <Text style={styles.statLabel}>ביטולים</Text>
            </View>
          </View>
        </View>

        {/* Member Since */}
        <View style={styles.memberSince}>
          <Text style={styles.memberSinceText}>
            חבר מאז: {new Date(client.created_at).toLocaleDateString('he-IL')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string) {
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
}

function getStatusText(status: string) {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#da4477',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  headerAvatar: {
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
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#da4477',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  blockedCard: {
    backgroundColor: '#f87171',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  blockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  blockedReason: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
  },
  unblockButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f87171',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDanger: {
    borderWidth: 2,
    borderColor: '#f87171',
    backgroundColor: '#fff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#181818',
  },
  actionButtonDangerText: {
    color: '#f87171',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  editForm: {
    gap: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#181818',
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#181818',
    marginTop: 8,
    textAlign: 'right',
  },
  levelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  levelButtonActive: {
    backgroundColor: '#da4477',
    borderColor: '#da4477',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  formButtonCancel: {
    backgroundColor: '#f1f5f9',
  },
  formButtonSave: {
    backgroundColor: '#da4477',
  },
  formButtonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  formButtonSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoItemFull: {
    flexDirection: 'column',
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#181818',
    textAlign: 'right',
  },
  plateBalanceDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  plateBalanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#da4477',
  },
  plateBalanceLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  challengeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  challengeContent: {
    flex: 1,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  challengeDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  challengeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
  },
  challengeStatusCompleted: {
    backgroundColor: '#d1fae5',
  },
  challengeStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#181818',
  },
  workoutCard: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: 4,
    textAlign: 'right',
  },
  workoutDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  attendanceCard: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  attendanceDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  attendanceClass: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: 4,
    textAlign: 'right',
  },
  attendanceStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  attendanceStatusConfirmed: {
    color: '#4ade80',
  },
  attendanceStatusCancelled: {
    color: '#f87171',
  },
  invoiceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  invoiceContent: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181818',
    textAlign: 'right',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#da4477',
    marginTop: 4,
    textAlign: 'right',
  },
  addNoteContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addNoteInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#181818',
    textAlign: 'right',
    minHeight: 60,
  },
  addNoteButton: {
    backgroundColor: '#da4477',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addNoteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteCard: {
    padding: 12,
    backgroundColor: '#fff5e6',
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
  },
  noteDeleteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#181818',
    marginBottom: 8,
    textAlign: 'right',
    paddingRight: 28,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#da4477',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  memberSince: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  memberSinceText: {
    fontSize: 14,
    color: '#666',
  },
});
