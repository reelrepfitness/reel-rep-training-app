import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/constants/types';
import { supabase } from '@/constants/supabase';
import { Session } from '@supabase/supabase-js';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Auth] Initial session check:', session?.user?.email);
      return session;
    },
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setSession(authQuery.data);
      setSessionId(authQuery.data?.user?.id || null);
    }
  }, [authQuery.data]);

  const profileQuery = useQuery({
    queryKey: ['profile', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, is_admin, is_coach')
          .eq('id', sessionId)
          .single();
        if (error) {
          if (error.code === '42P17') {
            console.warn('[Auth] RLS policy has infinite recursion. Fix Supabase policies. Using fallback.');
            return null;
          }
          console.error('[Auth] Profile fetch error:', error.message);
          return null;
        }
        console.log('[Auth] Profile data:', data);
        return data;
      } catch (err) {
        console.error('[Auth] Profile fetch exception:', err);
        return null;
      }
    },
    enabled: !!sessionId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (session?.user && profileQuery.data !== undefined) {
      const profile = profileQuery.data;
      const user: User = {
        id: session.user.id,
        name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: profile?.is_admin ? 'admin' : (profile?.is_coach ? 'coach' : 'user'),
        profileImage: profile?.avatar_url || session.user.user_metadata?.avatar_url || '',
        subscription: {
          plan: session.user.user_metadata?.subscription_plan || 'premium',
          classesRemaining: session.user.user_metadata?.classes_remaining || 12,
          renewalDate: session.user.user_metadata?.renewal_date || '2024-02-01',
        },
        stats: {
          totalWorkouts: session.user.user_metadata?.total_workouts || 0,
          totalMinutes: session.user.user_metadata?.total_minutes || 0,
          currentStreak: session.user.user_metadata?.current_streak || 0,
        },
      };
      setCurrentUser(user);
    } else if (!session?.user) {
      setCurrentUser(null);
    }
  }, [session, profileQuery.data]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('[Auth] State change:', _event, newSession?.user?.email);
      setSession(newSession);
      setSessionId(newSession?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('[Auth] Signing in with password:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('[Auth] Sign in error:', error);
        throw error;
      }
      console.log('[Auth] Sign in success:', data.user?.email);
      return data;
    },
  });

  const signInWithOTP = useMutation({
    mutationFn: async (email: string) => {
      console.log('[Auth] Sending OTP to:', email);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
      });
      if (error) {
        console.error('[Auth] OTP error:', error);
        throw error;
      }
      console.log('[Auth] OTP sent successfully');
      return data;
    },
  });

  const verifyOTP = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      console.log('[Auth] Verifying OTP for:', email);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) {
        console.error('[Auth] OTP verification error:', error);
        throw error;
      }
      console.log('[Auth] OTP verified successfully');
      return data;
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      console.log('[Auth] Sending password reset to:', email);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('[Auth] Password reset error:', error);
        throw error;
      }
      console.log('[Auth] Password reset email sent');
      return data;
    },
  });

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out');
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    setSessionId(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  return useMemo(() => ({
    user: currentUser,
    session,
    isAuthenticated: currentUser !== null && session !== null,
    isAdmin: currentUser?.role === 'admin',
    isCoach: currentUser?.role === 'coach' || currentUser?.role === 'admin',
    isLoading: authQuery.isLoading || profileQuery.isLoading,
    signInWithPassword,
    signInWithOTP,
    verifyOTP,
    resetPassword,
    signOut,
    updateUser,
  }), [currentUser, session, authQuery.isLoading, profileQuery.isLoading, signInWithPassword, signInWithOTP, verifyOTP, resetPassword, signOut, updateUser]);
});
