import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Image, Animated, Alert, Modal } from "react-native";
import { Flame, Calendar, Target, TrendingUp, Clock, X, RefreshCw, Users, Lock, Trophy } from 'lucide-react-native';
import WorkoutIcon from '@/components/WorkoutIcon';
import FireIcon from '@/components/FireIcon';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkouts } from '@/contexts/WorkoutContext';
import { useClasses } from '@/contexts/ClassesContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';
import { useEffect, useRef } from 'react';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAdmin, updateUser } = useAuth();
  const { getWeekStats } = useWorkouts();
  const { getUpcomingClasses, getMyClasses, cancelBooking, getClassBooking, classes } = useClasses();
  const { activeAchievements, activeChallenge, challengeAchievements, hasActiveChallenge, acceptChallenge, calculateProgress, getClassAttendanceCount = () => 0 } = useAchievements();
  
  const lateCancellations = user?.lateCancellations || 0;
  const blockEndDate = user?.blockEndDate || null;
  
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
  const weeklyGoal = 4;
  const upcomingClasses = getUpcomingClasses().slice(0, 2);
  const myBookedClasses = getMyClasses();

  const canCancelClass = (classItem: any) => {
    const classDateTime = new Date(classItem.date + ' ' + classItem.time).getTime();
    const now = Date.now();
    const hoursUntilClass = (classDateTime - now) / (1000 * 60 * 60);
    return hoursUntilClass >= 6;
  };

  const handleCancelClass = (classItem: any) => {
    const booking = getClassBooking(classItem.id);
    if (!booking) return;

    if (blockEndDate && new Date(blockEndDate) > new Date()) {
      Alert.alert('חשבון חסום', 'לא ניתן לבטל שיעורים כרגע. החשבון שלך חסום עד ' + new Date(blockEndDate).toLocaleDateString('he-IL'));
      return;
    }

    if (!isAdmin && !canCancelClass(classItem)) {
      Alert.alert(
        'ביטול מאוחר',
        'לא ניתן לבטל שיעור פחות מ-6 שעות לפני תחילתו. ביטול יגרור חיוב. ביטולים מאוחרים: ' + lateCancellations + '/3',
        [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'אשר ביטול + חיוב',
            style: 'destructive',
            onPress: () => {
              cancelBooking(booking.id);
              const newLateCancellations = lateCancellations + 1;
              
              if (newLateCancellations >= 3) {
                const blockEnd = new Date();
                blockEnd.setDate(blockEnd.getDate() + 3);
                updateUser({ 
                  lateCancellations: newLateCancellations,
                  blockEndDate: blockEnd.toISOString()
                });
                Alert.alert('חשבון חסום', 'ביטלת 3 שיעורים באיחור. החשבון שלך חסום ל-3 ימים. חשבונך יחויב.');
              } else {
                updateUser({ lateCancellations: newLateCancellations });
                Alert.alert('בוטל', `השיעור בוטל. חשבונך יחויב בגין ביטול מאוחר. ביטולים מאוחרים: ${newLateCancellations}/3`);
              }
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      'ביטול שיעור',
      `האם אתה בטוח שברצונך לבטל את ${classItem.title}?`,
      [
        { text: 'לא', style: 'cancel' },
        {
          text: 'כן, בטל',
          style: 'destructive',
          onPress: () => {
            cancelBooking(booking.id);
            Alert.alert('בוטל', 'השיעור בוטל בהצלחה.');
          }
        }
      ]
    );
  };

  const canSwitchClass = (classItem: any) => {
    const classDateTime = new Date(classItem.date + ' ' + classItem.time).getTime();
    const now = Date.now();
    const hoursUntilClass = (classDateTime - now) / (1000 * 60 * 60);
    return hoursUntilClass >= 1;
  };

  const handleSwitchClass = (classItem: any) => {
    if (blockEndDate && new Date(blockEndDate) > new Date()) {
      Alert.alert('חשבון חסום', 'לא ניתן להחליף שיעורים כרגע. החשבון שלך חסום עד ' + new Date(blockEndDate).toLocaleDateString('he-IL'));
      return;
    }

    if (!canSwitchClass(classItem)) {
      Alert.alert('זמן החלפה עבר', 'לא ניתן להחליף שיעור פחות משעה לפני תחילתו.');
      return;
    }

    const availableClasses = classes.filter(c => 
      c.id !== classItem.id && 
      c.date === classItem.date && 
      c.enrolled < c.capacity &&
      c.requiredSubscription.includes(user?.subscription?.type || 'basic')
    );

    if (availableClasses.length === 0) {
      Alert.alert('אין שיעורים זמינים', 'אין שיעורים זמינים להחלפה באותו יום.');
      return;
    }

    const message = 'שיעורים זמינים להחלפה:\n' + 
      availableClasses.map(c => `• ${c.time} - ${c.title}`).join('\n');

    Alert.alert('החלף שיעור', message, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'עבור לשיעורים', onPress: () => router.push('/classes' as any) }
    ]);
  };

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
            <View style={styles.plateBalanceHeader}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qmix9kvsaxeiodcudbn96' }}
                style={styles.plateIconSmall}
              />
              <Text style={styles.plateBalanceText}>{user?.plateBalance || 0}</Text>
            </View>
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
                <WorkoutIcon size={48} progress={weekStats.workouts} weeklyGoal={weeklyGoal} />
              </View>
              <Text style={styles.statValue}>{weekStats.workouts}/{weeklyGoal}</Text>
              <Text style={styles.statLabel}>{hebrew.home.workouts}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.accent + '15' }]}>
                <FireIcon size={24} />
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

        {myBookedClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>השיעורים הרשומים שלך</Text>
              <TouchableOpacity onPress={() => router.push('/classes' as any)}>
                <Text style={styles.seeAllLink}>ראה הכל</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bookedClassesScroll}
            >
              {myBookedClasses.map((classItem) => {
                const canCancel = isAdmin || canCancelClass(classItem);
                return (
                  <View key={classItem.id} style={styles.bookedClassCard}>
                    <View style={styles.bookedClassHeader}>
                      <Text style={styles.bookedClassTitle} numberOfLines={1}>{classItem.title}</Text>
                      {!canCancel && (
                        <View style={styles.lateCancelBadge}>
                          <Text style={styles.lateCancelText}>ביטול מאוחר</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.bookedClassInfo}>
                      <View style={styles.bookedClassMeta}>
                        <Clock size={16} color={Colors.textSecondary} />
                        <Text style={styles.bookedClassMetaText}>{classItem.time}</Text>
                      </View>
                      <Text style={styles.bookedClassDate}>{classItem.date}</Text>
                    </View>
                    <View style={styles.bookedClassInstructor}>
                      <Image 
                        source={{ uri: classItem.instructorImage }} 
                        style={styles.bookedInstructorImage}
                      />
                      <Text style={styles.bookedInstructorName}>{classItem.instructor}</Text>
                    </View>
                    <View style={styles.bookedClassActions}>
                      <TouchableOpacity 
                        style={[styles.bookedClassButton, styles.switchButton]}
                        onPress={() => handleSwitchClass(classItem)}
                        activeOpacity={0.7}
                      >
                        <RefreshCw size={16} color={Colors.primary} />
                        <Text style={styles.switchButtonText}>החלף</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.bookedClassButton, styles.cancelButton]}
                        onPress={() => handleCancelClass(classItem)}
                        activeOpacity={0.7}
                      >
                        <X size={16} color={Colors.primary} />
                        <Text style={styles.cancelButtonText}>ביטול</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

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
                  <WorkoutIcon size={32} progress={weekStats.workouts} weeklyGoal={weeklyGoal} />
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
              <Text style={styles.sectionTitle}>השיעורים הבאים</Text>
              <TouchableOpacity onPress={() => router.push('/classes' as any)}>
                <Text style={styles.seeAllLink}>ראה הכל</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingClassesScroll}
            >
              {upcomingClasses.map((classItem) => {
                const capacityPercent = (classItem.enrolled / classItem.capacity) * 100;
                return (
                  <View
                    key={classItem.id}
                    style={styles.upcomingClassCard}
                  >
                    <View style={styles.upcomingClassHeader}>
                      <Text style={styles.upcomingClassTitle} numberOfLines={1}>{classItem.title}</Text>
                      <View style={styles.timeCard}>
                        <Clock size={14} color={Colors.background} />
                        <Text style={styles.timeText}>{classItem.time}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.upcomingClassInstructor}>
                      <Image 
                        source={{ uri: classItem.instructorImage }} 
                        style={styles.upcomingInstructorImage}
                      />
                      <Text style={styles.upcomingInstructorName}>{classItem.instructor}</Text>
                    </View>

                    <View style={styles.capacitySection}>
                      <View style={styles.capacityHeader}>
                        <Text style={styles.capacityText}>{classItem.enrolled}/{classItem.capacity}</Text>
                      </View>
                      <View style={styles.capacityProgressBar}>
                        <View 
                          style={[styles.capacityProgressFill, { width: `${capacityPercent}%` }]} 
                        />
                      </View>
                    </View>

                    <View style={styles.upcomingClassActions}>
                      <TouchableOpacity 
                        style={[styles.upcomingActionButton, styles.switchBtn]}
                        onPress={() => handleSwitchClass(classItem)}
                        activeOpacity={0.7}
                      >
                        <RefreshCw size={14} color={Colors.primary} />
                        <Text style={styles.switchBtnText}>החלף</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.upcomingActionButton, styles.cancelBtn]}
                        onPress={() => handleCancelClass(classItem)}
                        activeOpacity={0.7}
                      >
                        <X size={14} color={Colors.primary} />
                        <Text style={styles.cancelBtnText}>בטל</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Challenge Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>אתגר פעיל</Text>
            <TouchableOpacity onPress={() => router.push('/achievements' as any)}>
              <Text style={styles.seeAllLink}>ראה הכל</Text>
            </TouchableOpacity>
          </View>
          
          {activeChallenge ? (
            <View style={styles.activeChallengeCard}>
              <View style={styles.challengeBadge}>
                <Trophy size={16} color="#ffffff" />
                <Text style={styles.challengeBadgeText}>אתגר</Text>
              </View>
              <View style={styles.challengeIconContainer}>
                <Image 
                  source={{ uri: activeChallenge.achievement.icon }} 
                  style={styles.challengeIcon}
                />
              </View>
              <Text style={styles.challengeTitle} numberOfLines={2}>
                {activeChallenge.achievement.name_hebrew}
              </Text>
              <Text style={styles.challengeDescription} numberOfLines={3}>
                {activeChallenge.achievement.description_hebrew}
              </Text>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBarContainer}>
                  <View style={[styles.challengeProgressBarFill, { 
                    width: `${Math.min((activeChallenge.progress / activeChallenge.achievement.task_requirement) * 100, 100)}%`,
                  }]} />
                </View>
                <Text style={styles.challengeProgressText}>
                  {activeChallenge.progress}/{activeChallenge.achievement.task_requirement}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChallengeCard}>
              <Lock size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyChallengeTitle}>אין אתגר פעיל</Text>
              <Text style={styles.emptyChallengeSubtitle}>בחר אתגר חדש מרשימת ההישגים</Text>
              <TouchableOpacity 
                style={styles.selectChallengeButton}
                onPress={() => router.push('/achievements' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectChallengeButtonText}>בחר אתגר</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* All Non-Challenge Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ההישגים שלך</Text>
            <TouchableOpacity onPress={() => router.push('/achievements' as any)}>
              <Text style={styles.seeAllLink}>ראה הכל</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {activeAchievements
              .filter(ua => !ua.isChallenge)
              .map((userAchievement) => {
                const progressPercent = Math.min((userAchievement.progress / userAchievement.achievement.task_requirement) * 100, 100);
                const isLocked = userAchievement.achievement.task_type === 'classes_attended' && 
                                userAchievement.progress < userAchievement.achievement.task_requirement;
                
                return (
                  <View 
                    key={userAchievement.id} 
                    style={[
                      styles.achievementCard,
                      isLocked && styles.lockedAchievementCard,
                    ]}
                  >
                    <View style={styles.achievementHeader}>
                      <Text style={styles.achievementCategoryText} numberOfLines={1}>
                        {userAchievement.achievement.catagory || 'הישג'}
                      </Text>
                      {isLocked && (
                        <View style={styles.lockBadge}>
                          <Lock size={12} color={Colors.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View style={styles.achievementIconContainer}>
                      <Image 
                        source={{ uri: userAchievement.achievement.icon }} 
                        style={[
                          styles.achievementIcon,
                          isLocked && styles.lockedAchievementIcon,
                        ]}
                      />
                    </View>
                    <Text style={[
                      styles.achievementTitle,
                      isLocked && styles.lockedText,
                    ]} numberOfLines={2}>
                      {userAchievement.achievement.name_hebrew}
                    </Text>
                    <Text style={[
                      styles.achievementSubtitle,
                      isLocked && styles.lockedText,
                    ]} numberOfLines={2}>
                      {userAchievement.achievement.description_hebrew}
                    </Text>
                    <View style={styles.achievementProgress}>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { 
                          width: `${progressPercent}%`,
                          backgroundColor: isLocked ? Colors.textSecondary : Colors.primary,
                        }]} />
                      </View>
                      <Text style={[
                        styles.achievementProgressText,
                        isLocked && styles.lockedText,
                      ]}>
                        {userAchievement.progress}/{userAchievement.achievement.task_requirement}
                      </Text>
                    </View>
                  </View>
                );
              })}
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
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#ffffff80',
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#ffffff',
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
    backgroundColor: '#ffffff20',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff20',
    position: 'relative' as const,
    borderWidth: 2,
    borderColor: '#ffffff30',
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
    borderColor: '#171717',
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
    width: width * 0.42,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementCategory: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  achievementIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl' as const,
    minHeight: 32,
  },
  achievementSubtitle: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    writingDirection: 'rtl' as const,
    minHeight: 26,
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
  bookedClassesScroll: {
    gap: 12,
    paddingRight: 4,
  },
  bookedClassCard: {
    width: width * 0.72,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  bookedClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookedClassTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    flex: 1,
    marginRight: 8,
  },
  lateCancelBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lateCancelText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  bookedClassInfo: {
    marginBottom: 12,
  },
  bookedClassMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  bookedClassMetaText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
  },
  bookedClassDate: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  bookedClassInstructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  bookedInstructorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bookedInstructorName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  bookedClassActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookedClassButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  switchButton: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },

  upcomingClassesScroll: {
    gap: 12,
    paddingRight: 4,
  },
  upcomingClassCard: {
    width: width * 0.75,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#333333',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  upcomingClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upcomingClassTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    flex: 1,
    marginRight: 8,
  },
  timeCard: {
    backgroundColor: '#171717',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  upcomingClassInstructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  upcomingInstructorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  upcomingInstructorName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  capacitySection: {
    marginBottom: 16,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
  },
  capacityProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  upcomingClassActions: {
    flexDirection: 'row',
    gap: 8,
  },
  upcomingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  switchBtn: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  switchBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  cancelBtn: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  activeChallengeCard: {
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  challengeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
    writingDirection: 'rtl' as const,
  },
  challengeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  challengeTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl' as const,
  },
  challengeDescription: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#ffffff80',
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl' as const,
  },
  challengeProgress: {
    width: '100%',
  },
  challengeProgressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  challengeProgressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  challengeProgressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center',
  },
  emptyChallengeCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  emptyChallengeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    writingDirection: 'rtl' as const,
  },
  emptyChallengeSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl' as const,
  },
  selectChallengeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectChallengeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  achievementCategoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    writingDirection: 'rtl' as const,
  },
  lockBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedAchievementCard: {
    opacity: 0.6,
  },
  lockedAchievementIcon: {
    opacity: 0.4,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  plateBalanceHeader: {
    position: 'absolute' as const,
    left: 16,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  plateIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  plateBalanceText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
});
