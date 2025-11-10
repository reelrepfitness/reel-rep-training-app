import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Image, Alert } from "react-native";
import { Award, TrendingUp, Target, CircleDollarSign } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAchievements } from '@/contexts/AchievementsContext';
import Colors from '@/constants/colors';
import { useState } from 'react';
import { Achievement } from '@/constants/types';

const { width } = Dimensions.get('window');

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    activeAchievements, 
    completedAchievements, 
    availableAchievements,
    challengeAchievements,
    hasActiveChallenge,
    acceptChallenge,
    calculateProgress,
  } = useAchievements();

  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'available'>('active');

  const handleAcceptChallenge = (achievement: Achievement) => {
    if (hasActiveChallenge) {
      Alert.alert(
        'אתגר קיים',
        'יש לך כבר אתגר פעיל. האם תרצה להחליף את האתגר הנוכחי?',
        [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'החלף',
            style: 'destructive',
            onPress: () => {
              acceptChallenge(achievement.id);
              Alert.alert('אתגר התקבל', `התחלת את האתגר: ${achievement.name_hebrew}`);
            }
          }
        ]
      );
    } else {
      acceptChallenge(achievement.id);
      Alert.alert('אתגר התקבל', `התחלת את האתגר: ${achievement.name_hebrew}`);
    }
  };

  const renderAchievementCard = (userAchievement: any, completed = false) => {
    const isChallenge = userAchievement.isChallenge;
    const progressPercent = Math.min((userAchievement.progress / userAchievement.achievement.task_requirement) * 100, 100);
    
    return (
      <View 
        key={userAchievement.id} 
        style={[
          styles.achievementCard,
          isChallenge && styles.challengeCard,
          completed && styles.completedCard,
        ]}
      >
        <Text style={[
          styles.achievementCategory,
          isChallenge && styles.challengeText,
          completed && styles.completedText,
        ]} numberOfLines={1}>
          {userAchievement.achievement.description}
        </Text>
        <View style={styles.achievementIconContainer}>
          <View style={[
            styles.iconGlow,
            completed && styles.iconGlowCompleted,
            isChallenge && styles.iconGlowChallenge,
          ]} />
          <Image 
            source={{ uri: userAchievement.achievement.icon }} 
            style={[styles.achievementIcon, completed && styles.completedIcon]}
          />
          {completed && (
            <View style={styles.completedBadge}>
              <Award size={20} color={Colors.background} />
            </View>
          )}
        </View>
        <Text style={[
          styles.achievementTitle,
          isChallenge && styles.challengeText,
          completed && styles.completedText,
        ]} numberOfLines={2}>
          {userAchievement.achievement.name_hebrew}
        </Text>
        <Text style={[
          styles.achievementSubtitle,
          completed && styles.completedSubtitleText,
        ]}>
          {userAchievement.achievement.description_hebrew}
        </Text>
        {!completed && (
          <View style={styles.achievementProgress}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { 
                width: `${progressPercent}%`,
                backgroundColor: isChallenge ? '#ffffff' : Colors.primary,
              }]} />
            </View>
            <Text style={[
              styles.achievementProgressText,
              isChallenge && styles.challengeProgressText,
            ]}>
              {userAchievement.progress}/{userAchievement.achievement.task_requirement}
            </Text>
          </View>
        )}
        {completed && userAchievement.dateEarned && (
          <Text style={styles.completedDate}>
            הושג ב-{new Date(userAchievement.dateEarned).toLocaleDateString('he-IL')}
          </Text>
        )}
      </View>
    );
  };

  const renderAvailableAchievement = (achievement: Achievement) => {
    const isChallenge = achievement.task_type === 'challenge';
    const progress = calculateProgress(achievement);
    const progressPercent = Math.min((progress / achievement.task_requirement) * 100, 100);
    
    return (
      <View key={achievement.id} style={styles.availableCard}>
        <View style={styles.availableCardContent}>
          <View style={styles.availableIconContainer}>
            <Image 
              source={{ uri: achievement.icon }} 
              style={styles.availableIcon}
            />
          </View>
          <View style={styles.availableInfo}>
            <Text style={styles.availableCategory} numberOfLines={1}>
              {achievement.description}
            </Text>
            <Text style={styles.availableTitle} numberOfLines={2}>
              {achievement.name_hebrew}
            </Text>
            <Text style={styles.availableSubtitle}>
              {achievement.description_hebrew}
            </Text>
            {!isChallenge && (
              <View style={styles.availableProgressContainer}>
                <View style={styles.availableProgressBar}>
                  <View style={[styles.availableProgressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.availableProgressText}>
                  {progress}/{achievement.task_requirement}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.availableActions}>
            <View style={styles.pointsBadge}>
              <CircleDollarSign size={16} color={Colors.primary} style={{ marginBottom: 2 }} />
              <Text style={styles.pointsText}>{achievement.points}</Text>
            </View>
            {isChallenge && (
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleAcceptChallenge(achievement)}
              >
                <Text style={styles.acceptButtonText}>קבל אתגר</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'active':
        if (activeAchievements.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Target size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>אין הישגים פעילים</Text>
              <Text style={styles.emptySubtitle}>בחר אתגר או התחל אימון לפתיחת הישגים חדשים</Text>
            </View>
          );
        }
        return (
          <View style={styles.achievementsGrid}>
            {activeAchievements.map(ua => renderAchievementCard(ua))}
          </View>
        );
      
      case 'completed':
        if (completedAchievements.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Award size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>עדיין לא השגת הישגים</Text>
              <Text style={styles.emptySubtitle}>המשך להתאמן והישגים יבואו!</Text>
            </View>
          );
        }
        return (
          <View style={styles.achievementsGrid}>
            {completedAchievements.map(ua => renderAchievementCard(ua, true))}
          </View>
        );
      
      case 'available':
        if (availableAchievements.length === 0) {
          return (
            <View style={styles.emptyState}>
              <TrendingUp size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>אין הישגים זמינים</Text>
              <Text style={styles.emptySubtitle}>כל הכבוד! השגת את כל ההישגים!</Text>
            </View>
          );
        }
        return (
          <View style={styles.availableList}>
            {availableAchievements.map(achievement => renderAvailableAchievement(achievement))}
          </View>
        );
    }
  };

  const totalPoints = completedAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
  const totalAchievements = activeAchievements.length + completedAchievements.length + availableAchievements.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Award size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{completedAchievements.length}</Text>
            <Text style={styles.statLabel}>הושגו</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <TrendingUp size={24} color={Colors.accent} />
            <Text style={styles.statValue}>{activeAchievements.length}</Text>
            <Text style={styles.statLabel}>בתהליך</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <CircleDollarSign size={24} color={Colors.accent} />
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>פלטות</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            פעילים ({activeAchievements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
            הושגו ({completedAchievements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
          onPress={() => setSelectedTab('available')}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
            זמינים ({availableAchievements.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
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
  header: {
    backgroundColor: Colors.card,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  activeTabText: {
    color: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  challengeCard: {
    backgroundColor: '#171717',
  },
  completedCard: {
    borderWidth: 2,
    borderColor: Colors.success + '40',
  },
  achievementCategory: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  challengeText: {
    color: '#ffffff',
  },
  completedText: {
    color: Colors.success,
  },
  achievementIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative' as const,
  },
  iconGlow: {
    position: 'absolute' as const,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  iconGlowCompleted: {
    backgroundColor: Colors.success,
    opacity: 0.25,
  },
  iconGlowChallenge: {
    backgroundColor: '#ffffff',
    opacity: 0.1,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  completedIcon: {
    borderColor: Colors.success,
  },
  completedBadge: {
    position: 'absolute' as const,
    bottom: -4,
    right: width * 0.18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
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
  },
  completedSubtitleText: {
    color: Colors.success + '80',
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
  challengeProgressText: {
    color: '#ffffff80',
  },
  completedDate: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
    textAlign: 'center',
    marginTop: 8,
    writingDirection: 'rtl' as const,
  },
  availableList: {
    gap: 12,
  },
  availableCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  availableCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  availableIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  availableInfo: {
    flex: 1,
  },
  availableCategory: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  availableTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
    marginBottom: 2,
  },
  availableSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
    marginBottom: 8,
    lineHeight: 18,
  },
  availableProgressContainer: {
    width: '100%',
  },
  availableProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  availableProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  availableProgressText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  availableActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  pointsBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
});
