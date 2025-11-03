import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/constants/types';
import { mockUser, mockCoach } from '@/constants/mockData';

const AUTH_STORAGE_KEY = '@reelrep_auth';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (user: User | null) => {
      if (user) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return user;
    },
  });

  const { mutate: syncUser } = syncMutation;

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setCurrentUser(authQuery.data);
    }
  }, [authQuery.data]);

  const signIn = useCallback((role: User['role']) => {
    const user = role === 'coach' || role === 'admin' ? mockCoach : mockUser;
    const updatedUser = { ...user, role };
    setCurrentUser(updatedUser);
    syncUser(updatedUser);
  }, [syncUser]);

  const signOut = useCallback(() => {
    setCurrentUser(null);
    syncUser(null);
  }, [syncUser]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      syncUser(updatedUser);
    }
  }, [currentUser, syncUser]);

  return useMemo(() => ({
    user: currentUser,
    isAuthenticated: currentUser !== null,
    isAdmin: currentUser?.role === 'admin',
    isCoach: currentUser?.role === 'coach' || currentUser?.role === 'admin',
    isLoading: authQuery.isLoading,
    signIn,
    signOut,
    updateUser,
  }), [currentUser, authQuery.isLoading, signIn, signOut, updateUser]);
});
