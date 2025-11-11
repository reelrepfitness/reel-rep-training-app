import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { supabase } from '@/constants/supabase';

interface TodayClassCardProps {
  classData: {
    id: string;
    name_hebrew: string;
    class_date: string;
    max_participants: number;
    current_participants: number;
    bookings: Array<{
      id: string;
      status: string;
      user: {
        id: string;
        name: string;
        full_name: string;
        phone_number: string;
      };
    }>;
  };
  onUpdate: () => void;
}

export function TodayClassCard({ classData, onUpdate }: TodayClassCardProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const fillPercentage =
    classData.max_participants > 0
      ? (classData.current_participants / classData.max_participants) * 100
      : 0;

  const getProgressColor = () => {
    if (fillPercentage >= 70) return '#4CAF50'; // ירוק - טוב!
    if (fillPercentage >= 40) return '#FF9800'; // כתום - סבבה
    return '#F44336'; // אדום - לא טוב!
  };

  const confirmedBookings = classData.bookings.filter((b) => b.status === 'confirmed');
  const waitingBookings = classData.bookings.filter((b) => b.status === 'waiting');

  const classTime = new Date(classData.class_date).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const sendWhatsAppToAll = async () => {
    const message = `שלום! תזכורת לשיעור ${classData.name_hebrew} היום בשעה ${classTime}. מחכים לכם! 💪`;

    Alert.alert(
      'שלח הודעה לכולם?',
      `שלח הודעת תזכורת ל-${confirmedBookings.length} משתתפים?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'שלח',
          onPress: () => {
            confirmedBookings.forEach((booking) => {
              if (booking.user.phone_number) {
                const phone = booking.user.phone_number.replace(/\D/g, '');
                const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                Linking.openURL(url).catch(() =>
                  console.log('Could not open WhatsApp for', booking.user.name)
                );
              }
            });
            Alert.alert('נשלח!', 'הודעות נשלחו לכל המשתתפים');
          },
        },
      ]
    );
  };

  const cancelClass = async () => {
    Alert.alert('ביטול שיעור', 'האם אתה בטוח שברצונך לבטל את השיעור?', [
      { text: 'לא', style: 'cancel' },
      {
        text: 'כן, בטל',
        style: 'destructive',
        onPress: async () => {
          try {
            // Update class status
            const { error } = await supabase
              .from('classes')
              .update({ is_active: false })
              .eq('id', classData.id);

            if (error) throw error;

            // Send cancellation message to all participants
            const cancelMessage = `שלום, השיעור ${classData.name_hebrew} היום בשעה ${classTime} בוטל. סליחה על אי הנוחות 🙏`;

            confirmedBookings.forEach((booking) => {
              if (booking.user.phone_number) {
                const phone = booking.user.phone_number.replace(/\D/g, '');
                const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(cancelMessage)}`;
                Linking.openURL(url).catch(() =>
                  console.log('Could not open WhatsApp for', booking.user.name)
                );
              }
            });

            Alert.alert('בוטל!', 'השיעור בוטל והודעות נשלחו למשתתפים');
            setShowBottomSheet(false);
            onUpdate();
          } catch (error) {
            console.error('Error cancelling class:', error);
            Alert.alert('שגיאה', 'לא ניתן לבטל את השיעור');
          }
        },
      },
    ]);
  };

  const removeParticipant = async (bookingId: string, userName: string) => {
    Alert.alert('הסר משתתף', `האם להסיר את ${userName} מהשיעור?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הסר',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('class_bookings')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', bookingId);

            if (error) throw error;

            // Update class participant count
            const { error: updateError } = await supabase
              .from('classes')
              .update({ current_participants: classData.current_participants - 1 })
              .eq('id', classData.id);

            if (updateError) throw updateError;

            Alert.alert('הוסר!', `${userName} הוסר מהשיעור`);
            onUpdate();
          } catch (error) {
            console.error('Error removing participant:', error);
            Alert.alert('שגיאה', 'לא ניתן להסיר את המשתתף');
          }
        },
      },
    ]);
  };

  const moveFromWaitingList = async (bookingId: string, userName: string) => {
    Alert.alert('העבר מרשימת המתנה', `האם להעביר את ${userName} לרשימת המשתתפים?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'העבר',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('class_bookings')
              .update({ status: 'confirmed' })
              .eq('id', bookingId);

            if (error) throw error;

            // Update class participant count
            const { error: updateError } = await supabase
              .from('classes')
              .update({ current_participants: classData.current_participants + 1 })
              .eq('id', classData.id);

            if (updateError) throw updateError;

            Alert.alert('הועבר!', `${userName} הועבר לרשימת המשתתפים`);
            onUpdate();
          } catch (error) {
            console.error('Error moving participant:', error);
            Alert.alert('שגיאה', 'לא ניתן להעביר את המשתתף');
          }
        },
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setShowBottomSheet(true)}>
        <View style={styles.cardContent}>
          <View style={styles.infoSection}>
            <Text style={styles.className}>{classData.name_hebrew}</Text>
            <Text style={styles.classTime}>{classTime}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                {classData.current_participants}/{classData.max_participants} רשומים
              </Text>
              {waitingBookings.length > 0 && (
                <Text style={styles.waitingText}>+{waitingBookings.length} ממתינים</Text>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    height: `${fillPercentage}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageText}>{Math.round(fillPercentage)}%</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowBottomSheet(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{classData.name_hebrew}</Text>
            </View>

            <ScrollView style={styles.sheetContent}>
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={sendWhatsAppToAll}>
                  <Text style={styles.actionButtonText}>📱 שלח הודעה לכולם</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={cancelClass}>
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>🚫 בטל שיעור</Text>
                </TouchableOpacity>
              </View>

              {/* Confirmed Participants */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ משתתפים ({confirmedBookings.length})</Text>
                {confirmedBookings.map((booking) => (
                  <View key={booking.id} style={styles.participantRow}>
                    <TouchableOpacity
                      onPress={() => removeParticipant(booking.id, booking.user.full_name || booking.user.name)}
                    >
                      <Text style={styles.removeButton}>🗑️</Text>
                    </TouchableOpacity>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{booking.user.full_name || booking.user.name}</Text>
                      {booking.user.phone_number && (
                        <TouchableOpacity
                          onPress={() => {
                            const phone = booking.user.phone_number.replace(/\D/g, '');
                            Linking.openURL(`whatsapp://send?phone=${phone}`);
                          }}
                        >
                          <Text style={styles.phoneText}>💬 {booking.user.phone_number}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Waiting List */}
              {waitingBookings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>⏳ רשימת המתנה ({waitingBookings.length})</Text>
                  {waitingBookings.map((booking) => (
                    <View key={booking.id} style={styles.participantRow}>
                      <TouchableOpacity
                        onPress={() => moveFromWaitingList(booking.id, booking.user.full_name || booking.user.name)}
                      >
                        <Text style={styles.addButton}>➕</Text>
                      </TouchableOpacity>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{booking.user.full_name || booking.user.name}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoSection: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: 4,
    textAlign: 'right',
  },
  classTime: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  statText: {
    fontSize: 14,
    color: '#181818',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#da4477',
    fontWeight: '600',
  },
  progressSection: {
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    width: 40,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressBar: {
    width: '100%',
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#181818',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181818',
    flex: 1,
    textAlign: 'center',
  },
  sheetContent: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#da4477',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  cancelButtonText: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: 12,
    textAlign: 'right',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  removeButton: {
    fontSize: 20,
  },
  addButton: {
    fontSize: 20,
  },
  participantInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#181818',
    textAlign: 'right',
  },
  phoneText: {
    fontSize: 14,
    color: '#25D366',
    marginTop: 4,
  },
});