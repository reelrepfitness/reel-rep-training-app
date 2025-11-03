import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleGetStarted = () => {
    signIn('user');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Dumbbell size={48} color={Colors.background} />
          </View>
          <Text style={styles.title}>{hebrew.app.name}</Text>
          <Text style={styles.tagline}>{hebrew.app.tagline}</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>בוא נתחיל!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    height: 500,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.background,
    textAlign: 'center',
    marginBottom: 12,
    writingDirection: 'rtl' as const,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.background + 'E0',
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  actionContainer: {
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
});
