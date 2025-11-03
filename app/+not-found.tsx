import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.message}>הדף לא נמצא</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.replace('/')}
      >
        <Home size={20} color={Colors.background} />
        <Text style={styles.buttonText}>{hebrew.tabs.home}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 16,
  },
  message: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
});