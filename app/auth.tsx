import { View, Text, StyleSheet, TouchableOpacity, I18nManager, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react-native';
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

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const emailError = email && !email.includes('@') ? 'נא להזין כתובת אימייל תקינה' : '';
  const passwordError = password && password.length < 6 ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : '';
  const otpError = otp && otp.length !== 6 ? 'הקוד חייב להכיל 6 ספרות' : '';

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Dumbbell size={48} color={Colors.background} />
          </View>
          <Text style={styles.title}>{hebrew.app.name}</Text>
          <Text style={styles.tagline}>{hebrew.app.tagline}</Text>
        </View>

        <View style={styles.formContainer}>
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
        </View>
      </ScrollView>
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
    height: '100%' as const,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: Colors.background,
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl' as const,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background + 'E0',
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  formContainer: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: Colors.primary,
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
});
