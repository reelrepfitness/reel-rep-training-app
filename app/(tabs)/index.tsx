import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Image, Animated } from "react-native";
import { Flame, Trophy, Calendar, Dumbbell, Target, TrendingUp, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkouts } from '@/contexts/WorkoutContext';
import { useClasses } from '@/contexts/ClassesContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';
import { mockAchievements } from '@/constants/mockData';
import { useEffect, useRef } from 'react';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getWeekStats } = useWorkouts();
  const { getUpcomingClasses } = useClasses();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const weekStats = getWeekStats();
  const upcomingClasses = getUpcomingClasses().slice(0, 2);

  const getSubscriptionProgress = (subscription: any) => {
    const start = new Date(subscription.startDate).getTime();
    const end = new Date(subscription.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return progress;
  };

  const getProgressColor = (subscription: any) => {
    const progress = getSubscriptionProgress(subscription);
    if (progress < 50) return Colors.success;
    if (progress < 80) return Colors.accent;
    return Colors.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>{hebrew.home.greeting}</Text>
              <Text style={styles.userName}>{user?.name} 💪</Text>
            </View>
            <TouchableOpacity style={styles.profileImage}>
              <Image 
                source={{ uri: user?.profileImage }} 
                style={styles.profileImageInner}
              />
              {user?.currentStreak && user.currentStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Flame size={12} color={Colors.background} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          {user?.subscription && (
            <View style={styles.subscriptionProgressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${getSubscriptionProgress(user.subscription)}%`,
                      backgroundColor: getProgressColor(user.subscription),
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <Animated.View 
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>השבוע שלך</Text>
            <TrendingUp size={20} color={Colors.primary} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '15' }]}>
                <Dumbbell size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{weekStats.workouts}</Text>
              <Text style={styles.statLabel}>{hebrew.home.workouts}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.accent + '15' }]}>
                <Flame size={24} color={Colors.accent} />
              </View>
              <Text style={styles.statValue}>{weekStats.calories}</Text>
              <Text style={styles.statLabel}>{hebrew.home.calories}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.success + '15' }]}>
                <Target size={24} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>ימי רצף</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעולות מהירות</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, styles.primaryAction]}
              onPress={() => router.push('/workout-log' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Dumbbell size={28} color={Colors.background} />
                </View>
                <Text style={styles.quickActionTitle}>רשום אימון</Text>
                <Text style={styles.quickActionSubtitle}>תיעוד מהיר של האימון</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionCard, styles.secondaryAction]}
              onPress={() => router.push('/classes' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionHeader}>
                  <Calendar size={28} color={Colors.primary} />
                </View>
                <Text style={[styles.quickActionTitle, { color: Colors.text }]}>הזמן שיעור</Text>
                <Text style={styles.quickActionSubtitle}>צפה בשיעורים הקרובים</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {upcomingClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>השיעורים הבאים שלך</Text>
              <TouchableOpacity onPress={() => router.push('/classes' as any)}>
                <Text style={styles.seeAllLink}>ראה הכל</Text>
              </TouchableOpacity>
            </View>
            {upcomingClasses.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={styles.classCard}
                activeOpacity={0.7}
                onPress={() => router.push('/classes' as any)}
              >
                <View style={styles.classCardHeader}>
                  <View style={styles.classInfo}>
                    <Text style={styles.classTitle}>{classItem.title}</Text>
                    <View style={styles.classMetaRow}>
                      <View style={styles.classMeta}>
                        <Clock size={14} color={Colors.textSecondary} />
                        <Text style={styles.classMetaText}>{classItem.time}</Text>
                      </View>
                      <View style={styles.classMeta}>
                        <Target size={14} color={Colors.textSecondary} />
                        <Text style={styles.classMetaText}>{classItem.duration} {hebrew.classes.minutes}</Text>
                      </View>
                    </View>
                  </View>
                  <Image 
                    source={{ uri: classItem.instructorImage }} 
                    style={styles.instructorImage}
                  />
                </View>
                <View style={styles.classFooter}>
                  <Text style={styles.instructorName}>{classItem.instructor}</Text>
                  <View style={styles.classLocationBadge}>
                    <Text style={styles.classLocationText}>{classItem.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>הישגים אחרונים</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>ראה הכל</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {mockAchievements.slice(0, 4).map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={[styles.achievementIconContainer, { 
                  backgroundColor: achievement.completed ? Colors.success + '15' : Colors.border 
                }]}>
                  <Trophy size={28} color={achievement.completed ? Colors.success : Colors.textLight} />
                </View>
                <Text style={styles.achievementTitle} numberOfLines={2}>{achievement.title}</Text>
                <View style={styles.achievementProgress}>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { 
                      width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                      backgroundColor: achievement.completed ? Colors.success : Colors.primary,
                    }]} />
                  </View>
                  <Text style={styles.achievementProgressText}>
                    {achievement.progress}/{achievement.target}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundPattern: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: Colors.primary + '08',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginTop: 4,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  subscriptionProgressContainer: {
    marginTop: 16,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.border + '40',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    position: 'relative' as const,
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  streakBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  secondaryAction: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  quickActionContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  quickActionHeader: {
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.background,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  classCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
    marginRight: 12,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  classMetaRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classMetaText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  instructorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructorName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  classLocationBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classLocationText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  achievementsScroll: {
    gap: 12,
    paddingRight: 4,
  },
  achievementCard: {
    width: width * 0.35,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    writingDirection: 'rtl' as const,
    minHeight: 36,
  },
  achievementProgress: {
    width: '100%',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
