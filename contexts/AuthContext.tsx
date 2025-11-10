import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/constants/types';
import { supabase } from '@/constants/supabase';
import { Session } from '@supabase/supabase-js';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

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
      if (authQuery.data?.user) {
        const user: User = {
          id: authQuery.data.user.id,
          name: authQuery.data.user.user_metadata?.name || authQuery.data.user.email?.split('@')[0] || 'User',
          email: authQuery.data.user.email || '',
          role: authQuery.data.user.user_metadata?.role || 'user',
          profileImage: authQuery.data.user.user_metadata?.avatar_url || '',
          subscription: {
            plan: authQuery.data.user.user_metadata?.subscription_plan || 'premium',
            classesRemaining: authQuery.data.user.user_metadata?.classes_remaining || 12,
            renewalDate: authQuery.data.user.user_metadata?.renewal_date || '2024-02-01',
          },
          stats: {
            totalWorkouts: authQuery.data.user.user_metadata?.total_workouts || 0,
            totalMinutes: authQuery.data.user.user_metadata?.total_minutes || 0,
            currentStreak: authQuery.data.user.user_metadata?.current_streak || 0,
          },
        };
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    }
  }, [authQuery.data]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] State change:', _event, session?.user?.email);
      setSession(session);
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
          profileImage: session.user.user_metadata?.avatar_url || '',
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
      } else {
        setCurrentUser(null);
      }
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
    isLoading: authQuery.isLoading,
    signInWithPassword,
    signInWithOTP,
    verifyOTP,
    resetPassword,
    signOut,
    updateUser,
  }), [currentUser, session, authQuery.isLoading, signInWithPassword, signInWithOTP, verifyOTP, resetPassword, signOut, updateUser]);
});
