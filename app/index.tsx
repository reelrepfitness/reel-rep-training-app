import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !showContent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#da4477', '#ff6b9d', '#da4477']}
          style={[styles.gradient, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/diwe4xzro/image/upload/v1762770356/wwefwefgw_j7wn0i.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#da4477',
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    alignSelf: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
