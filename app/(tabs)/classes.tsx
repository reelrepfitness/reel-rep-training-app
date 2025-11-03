import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Users, MapPin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassesContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { classes, bookClass, isClassBooked } = useClasses();

  const handleBookClass = (classId: string) => {
    try {
      bookClass(classId);
      Alert.alert(hebrew.common.success, 'נרשמת לשיעור בהצלחה!');
    } catch (error) {
      Alert.alert(hebrew.common.error, (error as Error).message);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return Colors.success;
      case 'intermediate': return Colors.accent;
      case 'advanced': return Colors.error;
      default: return Colors.primary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{hebrew.classes.allClasses}</Text>
        {user?.subscription && (
          <View style={styles.classesInfo}>
            <Text style={styles.classesText}>
              {user.subscription.classesUsed}/{user.subscription.classesPerMonth} {hebrew.classes.classesUsed}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {classes.map((classItem) => {
          const booked = isClassBooked(classItem.id);
          const isFull = classItem.enrolled >= classItem.capacity;
          
          return (
            <View key={classItem.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.title}</Text>
                  <Text style={styles.instructor}>
                    {hebrew.classes.instructor}: {classItem.instructor}
                  </Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(classItem.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(classItem.difficulty) }]}>
                    {hebrew.classes[classItem.difficulty as keyof typeof hebrew.classes]}
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>{classItem.description}</Text>

              <View style={styles.classDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{classItem.time} • {classItem.duration} {hebrew.classes.minutes}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MapPin size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{classItem.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>
                    {classItem.enrolled}/{classItem.capacity} {hebrew.classes.spots}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.bookButton,
                  (booked || isFull) && styles.bookButtonDisabled,
                  booked && styles.bookButtonBooked,
                ]}
                onPress={() => handleBookClass(classItem.id)}
                disabled={booked || isFull}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.bookButtonText,
                  (booked || isFull) && styles.bookButtonTextDisabled,
                ]}>
                  {booked ? hebrew.classes.booked : isFull ? hebrew.classes.full : hebrew.classes.book}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  classesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classesText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  classCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 4,
  },
  instructor: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700' as const,
    writingDirection: 'rtl' as const,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 16,
    lineHeight: 20,
  },
  classDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.border,
  },
  bookButtonBooked: {
    backgroundColor: Colors.success,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  bookButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});
