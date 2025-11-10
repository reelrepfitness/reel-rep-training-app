import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, ClockAlert, Calendar } from 'lucide-react-native';
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

const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getDayOfWeek(date: string): number {
  return new Date(date).getDay();
}

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { classes, bookClass, isClassBooked } = useClasses();
  const [countdown, setCountdown] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
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

  const groupedClasses = classes.reduce((groups, classItem) => {
    const dayOfWeek = getDayOfWeek(classItem.date);
    const isNextWeekClass = isNextWeek(classItem.date);
    
    if (isNextWeekClass) {
      if (!groups['nextWeek']) {
        groups['nextWeek'] = [];
      }
      groups['nextWeek'].push(classItem);
    } else {
      if (!groups[dayOfWeek]) {
        groups[dayOfWeek] = [];
      }
      groups[dayOfWeek].push(classItem);
    }
    return groups;
  }, {} as Record<string | number, typeof classes>);

  const generateCalendarDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay();
    const now = new Date();
    const currentHour = now.getHours();
    const days = [];
    
    const isThursdayAfterNoon = currentDay === 4 && currentHour >= 12;
    
    let endDate: Date;
    if (isThursdayAfterNoon) {
      endDate = new Date(today);
      endDate.setDate(today.getDate() + (7 + (5 - currentDay)));
    } else {
      endDate = new Date(today);
      const daysToFriday = (5 - currentDay + 7) % 7;
      endDate.setDate(today.getDate() + (daysToFriday === 0 ? 7 : daysToFriday));
    }
    
    console.log('[Calendar] Today:', today.toISOString());
    console.log('[Calendar] Current day:', currentDay, '- Current hour:', currentHour);
    console.log('[Calendar] Is Thursday after noon:', isThursdayAfterNoon);
    console.log('[Calendar] End date:', endDate.toISOString());
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek !== 6) {
        const isAvailable = date <= endDate;
        
        days.push({
          dayOfWeek,
          date: date.toISOString(),
          dayNumber: date.getDate(),
          isAvailable,
        });
      }
    }
    
    console.log('[Calendar] Generated', days.length, 'days, available:', days.filter(d => d.isAvailable).length);
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const availableDays = Object.keys(groupedClasses)
    .filter(key => key !== 'nextWeek')
    .map(Number)
    .sort((a, b) => a - b);

  const getUserClassForDay = (dayOfWeek: number) => {
    const dayClasses = groupedClasses[dayOfWeek] || [];
    return dayClasses.find((c) => isClassBooked(c.id));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDayOfWeek = today.getDay();

  useEffect(() => {
    if (selectedDay === null) {
      setSelectedDay(todayDayOfWeek);
    }
  }, []);

  const filteredClasses = selectedDay !== null 
    ? (groupedClasses[selectedDay] || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

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

      <View style={styles.calendarStripWrapper}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStrip}
          style={styles.calendarStripContainer}
          directionalLockEnabled
          inverted={Platform.OS !== 'web'}
        >
          {calendarDays.map((day, index) => {
            const bookedClass = getUserClassForDay(day.dayOfWeek);
            const isFirstBlockedDay = !day.isAvailable && (index === 0 || calendarDays[index - 1]?.isAvailable);
            const isToday = day.dayOfWeek === todayDayOfWeek && new Date(day.date).toDateString() === today.toDateString();
            
            return (
              <TouchableOpacity
                key={`${day.dayOfWeek}-${index}`}
                style={[
                  styles.calendarDayCard,
                  selectedDay === day.dayOfWeek && styles.calendarDayCardActive,
                  !day.isAvailable && styles.calendarDayCardDisabled,
                  isToday && styles.calendarDayCardToday,
                ]}
                onPress={() => {
                  if (day.isAvailable) {
                    setSelectedDay(selectedDay === day.dayOfWeek ? null : day.dayOfWeek);
                  }
                }}
                activeOpacity={0.7}
                disabled={!day.isAvailable}
              >
                {isFirstBlockedDay && countdown ? (
                  <View style={styles.countdownOverlay}>
                    <Lock size={20} color={Colors.accent} />
                    <Text style={styles.countdownOverlayTitle}>{hebrew.classes.registrationOpensIn}</Text>
                    <Text style={styles.countdownOverlayText}>{countdown}</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[
                      styles.calendarDayNumber,
                      selectedDay === day.dayOfWeek && styles.calendarDayNumberActive,
                      !day.isAvailable && styles.calendarDayNumberDisabled,
                    ]}>{day.dayNumber}</Text>
                    <Text style={[
                      styles.calendarDayName,
                      selectedDay === day.dayOfWeek && styles.calendarDayNameActive,
                      !day.isAvailable && styles.calendarDayNameDisabled,
                    ]}>{DAYS_OF_WEEK[day.dayOfWeek]}</Text>
                    {bookedClass && day.isAvailable && (
                      <Text style={styles.bookedClassTime}>רשום ל{bookedClass.time}</Text>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedDay === null ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>בחר יום כדי לראות שיעורים זמינים</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>אין שיעורים זמינים ביום זה</Text>
          </View>
        ) : filteredClasses.map((classItem) => {
          const booked = isClassBooked(classItem.id);
          const isFull = classItem.enrolled >= classItem.capacity;
          
          return (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              booked={booked}
              isFull={isFull}
              onBook={handleBookClass}
              getDifficultyColor={getDifficultyColor}
              getCapacityColor={getCapacityColor}
              getCapacityPercentage={getCapacityPercentage}
            />
          );
        })}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

interface ClassCardProps {
  classItem: any;
  booked: boolean;
  isFull: boolean;
  onBook: (id: string) => void;
  getDifficultyColor: (difficulty: string) => string;
  getCapacityColor: (percentage: number) => string;
  getCapacityPercentage: (enrolled: number, capacity: number) => number;
}

function ClassCard({ 
  classItem, 
  booked, 
  isFull, 
  onBook,
  getDifficultyColor,
  getCapacityColor,
  getCapacityPercentage,
}: ClassCardProps) {
  return (
    <View style={styles.classCard}>
      <View style={styles.classCardInner}>
        <View style={styles.dateCard}>
          <Text style={styles.dateCardTime}>{classItem.time}</Text>
        </View>
        
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classItem.title}</Text>
            <Text style={styles.instructor}>
              מאמן: {classItem.instructor}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{classItem.description}</Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.capacityText}>
          {classItem.enrolled}/{classItem.capacity}
        </Text>
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
      </View>

      <TouchableOpacity
        style={[
          styles.bookButton,
          isFull && styles.bookButtonWaitlist,
          booked && styles.bookButtonBooked,
          booked && styles.bookButtonDisabled,
        ]}
        onPress={() => onBook(classItem.id)}
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
    borderWidth: 1,
    borderColor: Colors.border,
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
  classCardInner: {
    flexDirection: 'row',
    gap: 12,
  },
  classHeader: {
    flex: 1,
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
  dateCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    alignSelf: 'flex-start',
  },
  dateCardNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.background,
  },
  dateCardDay: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
    marginTop: 2,
  },
  dateCardTime: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.background,
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
    position: 'relative' as const,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    position: 'absolute' as const,
    right: 0,
    top: -18,
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
  calendarStripWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  calendarStripContainer: {
    maxHeight: 110,
  },
  calendarStrip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  calendarDayCard: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative' as const,
  },
  calendarDayCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarDayCardDisabled: {
    opacity: 0.4,
  },
  calendarDayCardToday: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  calendarDayNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  calendarDayNumberActive: {
    color: Colors.background,
  },
  calendarDayNumberDisabled: {
    color: Colors.textSecondary,
  },
  calendarDayName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  calendarDayNameActive: {
    color: Colors.background,
  },
  calendarDayNameDisabled: {
    color: Colors.textSecondary,
  },
  bookedClassTime: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#10B981',
    writingDirection: 'rtl' as const,
    marginTop: 4,
    textAlign: 'center',
  },
  countdownOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.accent + '20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 4,
    minWidth: 120,
  },
  countdownOverlayTitle: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.accent,
    writingDirection: 'rtl' as const,
    textAlign: 'center',
  },
  countdownOverlayText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
    writingDirection: 'rtl' as const,
    textAlign: 'center',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  dayButtonTextActive: {
    color: Colors.background,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  dayDotActive: {
    backgroundColor: Colors.background,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  daySectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
  },
  daySectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  nextWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 16,
  },
  nextWeekTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.accent,
    writingDirection: 'rtl' as const,
  },
  nextWeekCountdown: {
    backgroundColor: Colors.accent + '15',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.accent + '30',
    alignItems: 'center',
  },
  nextWeekCountdownTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
    marginBottom: 12,
  },
  nextWeekCountdownText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.accent,
    writingDirection: 'rtl' as const,
  },
  nextWeekPreview: {
    backgroundColor: Colors.card + '80',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextWeekPreviewTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  nextWeekClassCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextWeekClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextWeekClassName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
    marginBottom: 4,
  },
  nextWeekClassDay: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  nextWeekClassTime: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
    textAlign: 'center',
  },
});
