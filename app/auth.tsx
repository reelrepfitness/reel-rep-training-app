import { View, Text, StyleSheet, TouchableOpacity, I18nManager, ActivityIndicator, Alert, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';
import { Input } from '@/components/ui/input';


I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type AuthMode = 'signin' | 'forgot' | 'otp' | 'verify';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signInWithPassword, signInWithOTP, verifyOTP, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showCard, setShowCard] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];



  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (showCard) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showCard, fadeAnim]);

  const emailError = email && !email.includes('@') ? 'נא להזין כתובת אימייל תקינה' : undefined;
  const passwordError = password && password.length < 6 ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : undefined;
  const otpError = otp && otp.length !== 6 ? 'הקוד חייב להכיל 6 ספרות' : undefined;

  const handleSignIn = async () => {
    if (emailError || passwordError) return;
    
    try {
      await signInWithPassword.mutateAsync({ email, password });
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      Alert.alert(hebrew.common.error, error instanceof Error ? error.message : hebrew.auth.invalidCredentials);
    }
  };

  const handleSendOTP = async () => {
    if (emailError) return;
    
    try {
      await signInWithOTP.mutateAsync(email);
      setMode('verify');
      Alert.alert(hebrew.common.success, hebrew.auth.otpSent);
    } catch (error: unknown) {
      console.error('OTP error:', error);
      Alert.alert(hebrew.common.error, error instanceof Error ? error.message : hebrew.auth.errorOccurred);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpError) return;
    
    try {
      await verifyOTP.mutateAsync({ email, token: otp });
    } catch (error: unknown) {
      console.error('Verify OTP error:', error);
      Alert.alert(hebrew.common.error, error instanceof Error ? error.message : hebrew.auth.errorOccurred);
    }
  };

  const handleResetPassword = async () => {
    if (emailError) return;
    
    try {
      await resetPassword.mutateAsync(email);
      Alert.alert(hebrew.common.success, hebrew.auth.emailSent);
      setMode('signin');
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      Alert.alert(hebrew.common.error, error instanceof Error ? error.message : hebrew.auth.errorOccurred);
    }
  };

  const isLoading = signInWithPassword.isPending || signInWithOTP.isPending || verifyOTP.isPending || resetPassword.isPending;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#da4477', '#ff6b9d', '#da4477']}
        style={[styles.gradient, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/diwe4xzro/image/upload/v1762770356/wwefwefgw_j7wn0i.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setShowCard(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.loginButtonText}>כניסה</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showCard && (
        <Animated.View 
          style={[styles.cardOverlay, { opacity: fadeAnim }]}
        >
          <TouchableOpacity 
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowCard(false)}
          />
          <Animated.View 
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {mode === 'signin' && (
            <>
              <Input
                label={hebrew.auth.email}
                placeholder={hebrew.auth.enterEmail}
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label={hebrew.auth.password}
                placeholder={hebrew.auth.enterPassword}
                icon={Lock}
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry
              />
              
              <TouchableOpacity 
                onPress={() => setMode('forgot')}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>{hebrew.auth.forgotPassword}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSignIn}
                disabled={isLoading || !!emailError || !!passwordError}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>{hebrew.auth.signIn}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>או</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setMode('otp')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>{hebrew.auth.signInWithOTP}</Text>
                <ArrowRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <Text style={styles.modeTitle}>{hebrew.auth.resetPassword}</Text>
              <Text style={styles.modeDescription}>נשלח לך קישור לאיפוס סיסמה לאימייל</Text>
              
              <Input
                label={hebrew.auth.email}
                placeholder={hebrew.auth.enterEmail}
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResetPassword}
                disabled={isLoading || !!emailError}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>{hebrew.auth.sendResetLink}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('signin')}
                style={styles.backButton}
              >
                <Text style={styles.backText}>{hebrew.auth.backToLogin}</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'otp' && (
            <>
              <Text style={styles.modeTitle}>{hebrew.auth.signInWithOTP}</Text>
              <Text style={styles.modeDescription}>נשלח לך קוד חד פעמי לאימייל</Text>
              
              <Input
                label={hebrew.auth.email}
                placeholder={hebrew.auth.enterEmail}
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendOTP}
                disabled={isLoading || !!emailError}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>{hebrew.auth.sendOTP}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('signin')}
                style={styles.backButton}
              >
                <Text style={styles.backText}>{hebrew.auth.backToLogin}</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'verify' && (
            <>
              <Text style={styles.modeTitle}>{hebrew.auth.verify}</Text>
              <Text style={styles.modeDescription}>הזן את הקוד שנשלח ל-{email}</Text>
              
              <Input
                label={hebrew.auth.enterOTP}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                error={otpError}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleVerifyOTP}
                disabled={isLoading || !!otpError}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>{hebrew.auth.verify}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('otp')}
                style={styles.backButton}
              >
                <Text style={styles.backText}>חזור</Text>
              </TouchableOpacity>
            </>
          )}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#da4477',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#da4477',
    writingDirection: 'rtl' as const,
    textAlign: 'center',
  },

  modeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  primaryButton: {
    backgroundColor: '#da4477',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse' as const,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    writingDirection: 'rtl' as const,
  },
  divider: {
    flexDirection: 'row-reverse' as const,
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  backText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});
