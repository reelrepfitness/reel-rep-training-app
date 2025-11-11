import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { Achievement, UserAchievement } from '@/constants/types';
import { useAuth } from './AuthContext';
import { useClasses } from './ClassesContext';
import { useWorkouts } from './WorkoutContext';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const [AchievementsProvider, useAchievements] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { getClassAttendanceCount } = useClasses();
  const { getTotalWeight } = useWorkouts();

  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/achievements?is_active=eq.true&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch achievements');
      return response.json() as Promise<Achievement[]>;
    },
    enabled: !!SUPABASE_URL && !!SUPABASE_ANON_KEY,
  });

  const userAchievementsQuery = useQuery({
    queryKey: ['userAchievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_achievements?user_id=eq.${user.id}&select=*,achievements(*)`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch user achievements');
      const data = await response.json();
      return data.map((ua: any) => ({
        id: ua.id,
        achievement: ua.achievements,
        progress: ua.progress || 0,
        completed: ua.completed || false,
        dateEarned: ua.date_earned,
        isChallenge: ua.is_challenge,
        acceptedAt: ua.accepted_at,
      })) as UserAchievement[];
    },
    enabled: !!user?.id && !!SUPABASE_URL && !!SUPABASE_ANON_KEY,
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error('User not found');

      const existingChallenge = userAchievementsQuery.data?.find(
        ua => ua.isChallenge && !ua.completed
      );

      if (existingChallenge && existingChallenge.achievement.id !== achievementId) {
        await fetch(`${SUPABASE_URL}/rest/v1/user_achievements?id=eq.${existingChallenge.id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_achievements`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: achievementId,
          progress: 0,
          completed: false,
          is_challenge: true,
          accepted_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to accept challenge');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements', user?.id] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ userAchievementId, progress }: { userAchievementId: string; progress: number }) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_achievements?id=eq.${userAchievementId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements', user?.id] });
    },
  });

  const calculateProgress = useCallback((achievement: Achievement): number => {
    if (!user) return 0;

    switch (achievement.task_type) {
      case 'classes_attended':
        return getClassAttendanceCount();
      case 'total_weight':
        return getTotalWeight();
      case 'disapline':
        return 0;
      case 'challenge':
        return 0;
      default:
        return 0;
    }
  }, [user, getClassAttendanceCount, getTotalWeight]);

  const getActiveAchievements = useCallback((): UserAchievement[] => {
    if (!userAchievementsQuery.data || !achievementsQuery.data) return [];
    
    const classAttendance = getClassAttendanceCount();
    const attendanceAchievements = achievementsQuery.data
      .filter(a => a.task_type === 'classes_attended')
      .sort((a, b) => a.task_requirement - b.task_requirement);
    
    const userAttendanceIds = new Set(
      userAchievementsQuery.data
        .filter(ua => ua.achievement.task_type === 'classes_attended')
        .map(ua => ua.achievement.id)
    );
    
    const visibleAttendanceAchievements: UserAchievement[] = [];
    let lastUnlockedIndex = -1;
    
    for (let i = 0; i < attendanceAchievements.length; i++) {
      const achievement = attendanceAchievements[i];
      
      if (classAttendance >= achievement.task_requirement) {
        lastUnlockedIndex = i;
        
        if (!userAttendanceIds.has(achievement.id)) {
          const newUserAchievement: UserAchievement = {
            id: achievement.id + '-temp',
            achievement,
            progress: classAttendance,
            completed: true,
            dateEarned: new Date().toISOString(),
            isChallenge: false,
          };
          visibleAttendanceAchievements.push(newUserAchievement);
        } else {
          const existing = userAchievementsQuery.data.find(ua => ua.achievement.id === achievement.id);
          if (existing) {
            visibleAttendanceAchievements.push({
              ...existing,
              progress: classAttendance,
            });
          }
        }
      }
    }
    
    if (lastUnlockedIndex < attendanceAchievements.length - 1) {
      const nextAchievement = attendanceAchievements[lastUnlockedIndex + 1];
      if (!userAttendanceIds.has(nextAchievement.id)) {
        const newUserAchievement: UserAchievement = {
          id: nextAchievement.id + '-temp',
          achievement: nextAchievement,
          progress: classAttendance,
          completed: false,
          isChallenge: false,
        };
        visibleAttendanceAchievements.push(newUserAchievement);
      } else {
        const existing = userAchievementsQuery.data.find(ua => ua.achievement.id === nextAchievement.id);
        if (existing) {
          visibleAttendanceAchievements.push({
            ...existing,
            progress: classAttendance,
          });
        }
      }
    }
    
    const nonAttendanceAchievements = userAchievementsQuery.data
      .filter(ua => !ua.completed && ua.achievement.task_type !== 'classes_attended')
      .map(ua => ({
        ...ua,
        progress: calculateProgress(ua.achievement),
      }));
    
    const active = [...visibleAttendanceAchievements, ...nonAttendanceAchievements]
      .sort((a, b) => {
        if (a.isChallenge && !b.isChallenge) return -1;
        if (!a.isChallenge && b.isChallenge) return 1;
        return 0;
      });

    return active;
  }, [userAchievementsQuery.data, achievementsQuery.data, calculateProgress, getClassAttendanceCount]);

  const getCompletedAchievements = useCallback((): UserAchievement[] => {
    if (!userAchievementsQuery.data) return [];
    return userAchievementsQuery.data.filter(ua => ua.completed);
  }, [userAchievementsQuery.data]);

  const getAvailableAchievements = useCallback((): Achievement[] => {
    if (!achievementsQuery.data) return [];
    const userAchievementIds = userAchievementsQuery.data?.map(ua => ua.achievement.id) || [];
    return achievementsQuery.data.filter(a => !userAchievementIds.includes(a.id));
  }, [achievementsQuery.data, userAchievementsQuery.data]);

  const getChallengeAchievements = useCallback((): Achievement[] => {
    if (!achievementsQuery.data) return [];
    return achievementsQuery.data.filter(a => a.task_type === 'challenge');
  }, [achievementsQuery.data]);

  const acceptChallenge = useCallback((achievementId: string) => {
    acceptChallengeMutation.mutate(achievementId);
  }, [acceptChallengeMutation]);

  const hasActiveChallenge = useCallback((): boolean => {
    return userAchievementsQuery.data?.some(ua => ua.isChallenge && !ua.completed) || false;
  }, [userAchievementsQuery.data]);

  const getActiveChallenge = useCallback((): UserAchievement | null => {
    const challenge = userAchievementsQuery.data?.find(ua => ua.isChallenge && !ua.completed);
    if (!challenge) return null;
    return {
      ...challenge,
      progress: calculateProgress(challenge.achievement),
    };
  }, [userAchievementsQuery.data, calculateProgress]);

  const getTotalPlates = useCallback((): number => {
    if (!userAchievementsQuery.data) return 0;
    return userAchievementsQuery.data
      .filter(ua => ua.completed)
      .reduce((total, ua) => total + ua.achievement.points, 0);
  }, [userAchievementsQuery.data]);

  return {
    achievements: achievementsQuery.data || [],
    userAchievements: userAchievementsQuery.data || [],
    activeAchievements: getActiveAchievements(),
    completedAchievements: getCompletedAchievements(),
    availableAchievements: getAvailableAchievements(),
    challengeAchievements: getChallengeAchievements(),
    activeChallenge: getActiveChallenge(),
    hasActiveChallenge: hasActiveChallenge(),
    totalPlates: getTotalPlates(),
    isLoading: achievementsQuery.isLoading || userAchievementsQuery.isLoading,
    acceptChallenge,
    calculateProgress,
  };
});
