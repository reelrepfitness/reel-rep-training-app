import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Calendar, TrendingUp, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkouts } from '@/contexts/WorkoutContext';
import { useClasses } from '@/contexts/ClassesContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';
import { mockUsers } from '@/constants/mockData';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { workouts } = useWorkouts();
  const { classes } = useClasses();

  const handleSignOut = () => {
    signOut();
    router.replace('/auth');
  };

  const stats = [
    { label: hebrew.admin.totalUsers, value: mockUsers.length.toString(), icon: Users, color: Colors.primary },
    { label: hebrew.admin.todayClasses, value: classes.length.toString(), icon: Calendar, color: Colors.accent },
    { label: 'סך אימונים', value: workouts.length.toString(), icon: TrendingUp, color: Colors.success },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <LogOut size={20} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{hebrew.admin.dashboard}</Text>
          <Text style={styles.subtitle}>{user?.name}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{hebrew.admin.users}</Text>
          {mockUsers.map((userItem) => (
            <View key={userItem.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userItem.name}</Text>
                <Text style={styles.userEmail}>{userItem.email}</Text>
                <Text style={styles.userStats}>
                  {userItem.totalWorkouts} {hebrew.home.workouts} • {userItem.currentStreak} {hebrew.home.days} {hebrew.home.streak}
                </Text>
              </View>
              {userItem.subscription && (
                <View style={[styles.badge, { backgroundColor: Colors.primary + '20' }]}>
                  <Text style={[styles.badgeText, { color: Colors.primary }]}>
                    {userItem.subscription.type.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoutButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 4,
  },
  userStats: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textLight,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
