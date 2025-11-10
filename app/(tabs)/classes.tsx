import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Users, MapPin, Lock, ClockAlert } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassesContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';
import { useState, useEffect } from 'react';

function getNextThursdayNoon(): Date {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  
  let daysUntilThursday = (4 - currentDay + 7) % 7;
  
  if (currentDay === 4 && currentHour >= 12) {
    daysUntilThursday = 7;
  } else if (currentDay === 4 && currentHour < 12) {
    daysUntilThursday = 0;
  }
  
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(12, 0, 0, 0);
  
  return nextThursday;
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const dayOfWeek = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  
  const friday = new Date(sunday);
  friday.setDate(sunday.getDate() + 5);
  friday.setHours(23, 59, 59, 999);
  
  return { start: sunday, end: friday };
}

function isNextWeek(classDate: string): boolean {
  const now = new Date();
  
  const thisWeekRange = getWeekRange(now);
  const nextWeekStart = new Date(thisWeekRange.end);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  nextWeekStart.setHours(0, 0, 0, 0);
  
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 5);
  nextWeekEnd.setHours(23, 59, 59, 999);
  
  const classDateTime = new Date(classDate);
  
  return classDateTime >= nextWeekStart && classDateTime <= nextWeekEnd;
}

function isRegistrationOpen(): boolean {
  const now = new Date();
  const nextThursday = getNextThursdayNoon();
  return now >= nextThursday;
}

function formatCountdown(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} ${hebrew.classes.countdownDays}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hebrew.classes.countdownHours}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${hebrew.classes.countdownMinutes}`);
  }
  
  if (parts.length === 1) {
    return parts[0];
  } else if (parts.length === 2) {
    return `${parts[0]} ${hebrew.classes.and}${parts[1]}`;
  } else {
    return `${parts[0]}, ${parts[1]} ${hebrew.classes.and}${parts[2]}`;
  }
}

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { classes, bookClass, isClassBooked } = useClasses();
  const [countdown, setCountdown] = useState<string>('');
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextThursday = getNextThursdayNoon();
      const diff = nextThursday.getTime() - now.getTime();
      
      if (diff > 0) {
        setCountdown(formatCountdown(diff));
      } else {
        setCountdown('');
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    
    return () => clearInterval(interval);
  }, []);

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

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#F97316';
    if (percentage >= 50) return '#F59E0B';
    return '#10B981';
  };

  const getCapacityPercentage = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100);
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
        {classes
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((classItem) => {
          const booked = isClassBooked(classItem.id);
          const isFull = classItem.enrolled >= classItem.capacity;
          const isNextWeekClass = isNextWeek(classItem.date);
          const isRegOpen = isRegistrationOpen();
          const isLocked = isNextWeekClass && !isRegOpen;
          
          return (
            <View key={classItem.id} style={[styles.classCard, isLocked && styles.classCardLocked]}>
              {isLocked && (
                <View style={styles.lockedBanner}>
                  <Lock size={16} color={Colors.background} />
                  <Text style={styles.lockedBannerText}>{hebrew.classes.nextWeek}</Text>
                </View>
              )}
              
              <View style={[styles.classHeader, isLocked && styles.classHeaderWithBanner]}>
                <View style={styles.classInfo}>
                  <Text style={[styles.className, isLocked && styles.textLocked]}>{classItem.title}</Text>
                  <Text style={[styles.instructor, isLocked && styles.textLocked]}>
                    {hebrew.classes.instructor}: {classItem.instructor}
                  </Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(classItem.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(classItem.difficulty) }]}>
                    {hebrew.classes[classItem.difficulty as keyof typeof hebrew.classes]}
                  </Text>
                </View>
              </View>

              <Text style={[styles.description, isLocked && styles.textLocked]}>{classItem.description}</Text>
              
              {isLocked && countdown && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownTitle}>{hebrew.classes.registrationOpensIn}</Text>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}

              {!isLocked && (
                <View style={styles.classDetails}>
                  <View style={styles.detailItem}>
                    <Clock size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{classItem.time} • {classItem.duration} {hebrew.classes.durationMinutes}</Text>
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
              )}

              {!isLocked && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${getCapacityPercentage(classItem.enrolled, classItem.capacity)}%`,
                          backgroundColor: getCapacityColor(getCapacityPercentage(classItem.enrolled, classItem.capacity))
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {classItem.capacity - classItem.enrolled} {hebrew.classes.spotsLeft}
                  </Text>
                </View>
              )}

              {!isLocked && (
                <TouchableOpacity
                  style={[
                    styles.bookButton,
                    isFull && styles.bookButtonWaitlist,
                    booked && styles.bookButtonBooked,
                    booked && styles.bookButtonDisabled,
                  ]}
                  onPress={() => handleBookClass(classItem.id)}
                  disabled={booked}
                  activeOpacity={0.7}
                >
                  {isFull ? (
                    <View style={styles.waitlistButtonContent}>
                      <ClockAlert size={18} color={Colors.background} />
                      <Text style={styles.bookButtonText}>
                        {hebrew.classes.waitlist}
                      </Text>
                      <View style={styles.waitlistBadge}>
                        <Text style={styles.waitlistBadgeText}>0</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[
                      styles.bookButtonText,
                      booked && styles.bookButtonTextDisabled,
                    ]}>
                      {booked ? hebrew.classes.booked : hebrew.classes.book}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
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
    overflow: 'hidden' as const,
  },
  classCardLocked: {
    opacity: 0.7,
  },
  lockedBanner: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  lockedBannerText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classHeaderWithBanner: {
    marginTop: 32,
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
  textLocked: {
    color: Colors.textSecondary,
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
  countdownContainer: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
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
  bookButtonWaitlist: {
    backgroundColor: Colors.accent,
  },
  waitlistButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitlistBadge: {
    backgroundColor: Colors.background + '40',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  waitlistBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  progressContainer: {
    marginBottom: 16,
    gap: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
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
