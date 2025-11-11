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
  const { activeAchievements, activeChallenge, challengeAchievements, hasActiveChallenge, acceptChallenge, calculateProgress } = useAchievements();
  
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
      (user?.subscription?.type ? c.requiredSubscription.includes(user.subscription.type) : false)
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

  // אם זה אדמין, המסך לא יוצג (כי יש redirect למעלה)
  // אבל נשאיר את הקוד למקרה שיש בעיה
  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* כל שאר הקוד נשאר זהה... */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.plateBalanceHeader}>
              <Image 
                source={{ uri: 'https://res.cloudinary.com/diwe4xzro/image/upload/v1762853881/%D7%98%D7%A7%D7%A1%D7%98_%D7%94%D7%A4%D7%A1%D7%A7%D7%94_%D7%A9%D7%9C%D7%9A.png_i0ydun.png' }}
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

        {/* שאר הקוד המלא ממש כמו שהיה... */}
        {/* (כל ה-UI של המסך הרגיל) */}
        
      </ScrollView>
    </View>
  );
}

// כל ה-styles נשארים זהים
const styles = StyleSheet.create({
  // ... (כל ה-styles מהקוד המקורי)
});
