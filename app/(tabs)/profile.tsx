import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Settings, LogOut, Trophy, Dumbbell, TrendingUp, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkouts } from '@/contexts/WorkoutContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, isAdmin, isCoach } = useAuth();
  const { getTotalStats } = useWorkouts();
  
  const stats = getTotalStats();

  const profileStats = [
    { label: hebrew.profile.totalWorkouts, value: stats.workouts.toString(), icon: Dumbbell, color: Colors.primary },
    { label: hebrew.profile.totalMinutes, value: stats.duration.toString(), icon: TrendingUp, color: Colors.accent },
    { label: hebrew.home.achievements, value: user?.achievements?.length.toString() || '0', icon: Trophy, color: Colors.success },
  ];

  const handleSignOut = () => {
    signOut();
    router.replace('/auth');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={48} color={Colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.subscription && (
              <View style={[styles.subscriptionBadge, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.subscriptionText, { color: Colors.primary }]}>
                  {user.subscription.type.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{hebrew.profile.statistics}</Text>
        <View style={styles.statsGrid}>
          {profileStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {user?.subscription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{hebrew.profile.subscription}</Text>
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>סוג מנוי:</Text>
                <Text style={styles.subscriptionValue}>{user.subscription.type.toUpperCase()}</Text>
              </View>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>שיעורים שנותרו:</Text>
                <Text style={[styles.subscriptionValue, { color: Colors.primary }]}>
                  {user.subscription.classesPerMonth - user.subscription.classesUsed}/{user.subscription.classesPerMonth}
                </Text>
              </View>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>תוקף:</Text>
                <Text style={styles.subscriptionValue}>
                  {new Date(user.subscription.endDate).toLocaleDateString('he-IL')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{hebrew.profile.settings}</Text>

          {(isAdmin || isCoach) && (
            <TouchableOpacity 
              style={[styles.menuItem, { backgroundColor: Colors.primary + '10' }]} 
              onPress={() => router.push('/admin/' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Shield size={20} color={Colors.primary} />
                <Text style={[styles.menuItemText, { color: Colors.primary }]}>לוח ניהול</Text>
              </View>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Settings size={20} color={Colors.primary} />
              <Text style={styles.menuItemText}>{hebrew.profile.settings}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemDanger]} 
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color={Colors.error} />
              <Text style={[styles.menuItemText, { color: Colors.error }]}>{hebrew.profile.logout}</Text>
            </View>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  subscriptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 16,
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
  subscriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    writingDirection: 'rtl' as const,
  },
  subscriptionValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
  },
  menuItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemDanger: {
    backgroundColor: Colors.error + '10',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
});
