import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Workout, HealthMetrics } from '@/constants/types';
import { mockWorkouts, mockHealthMetrics } from '@/constants/mockData';
import { useAuth } from './AuthContext';

const WORKOUTS_STORAGE_KEY = '@reelrep_workouts';

export const [WorkoutProvider, useWorkouts] = createContextHook(() => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [healthMetrics] = useState<HealthMetrics[]>(mockHealthMetrics);

  const workoutsQuery = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(`${WORKOUTS_STORAGE_KEY}_${user?.id}`);
      return stored ? JSON.parse(stored) : mockWorkouts;
    },
    enabled: !!user,
  });

  const syncMutation = useMutation({
    mutationFn: async (workouts: Workout[]) => {
      if (user) {
        await AsyncStorage.setItem(`${WORKOUTS_STORAGE_KEY}_${user.id}`, JSON.stringify(workouts));
      }
      return workouts;
    },
  });

  const { mutate: syncWorkouts } = syncMutation;

  useEffect(() => {
    if (workoutsQuery.data) {
      setWorkouts(workoutsQuery.data);
    }
  }, [workoutsQuery.data]);

  const addWorkout = useCallback((workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workout,
      id: Date.now().toString(),
      userId: user?.id || '',
    };
    const updated = [newWorkout, ...workouts];
    setWorkouts(updated);
    syncWorkouts(updated);
    return newWorkout;
  }, [workouts, user?.id, syncWorkouts]);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    const updated = workouts.map(w => w.id === id ? { ...w, ...updates } : w);
    setWorkouts(updated);
    syncWorkouts(updated);
  }, [workouts, syncWorkouts]);

  const deleteWorkout = useCallback((id: string) => {
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    syncWorkouts(updated);
  }, [workouts, syncWorkouts]);

  const getWorkoutsByDateRange = useCallback((startDate: string, endDate: string) => {
    return workouts.filter(w => w.date >= startDate && w.date <= endDate);
  }, [workouts]);

  const getTotalStats = useCallback(() => {
    const total = workouts.reduce((acc, workout) => ({
      workouts: acc.workouts + 1,
      duration: acc.duration + workout.duration,
      calories: acc.calories + (workout.calories || 0),
      distance: acc.distance + (workout.distance || 0),
    }), { workouts: 0, duration: 0, calories: 0, distance: 0 });

    return total;
  }, [workouts]);

  const getWeekStats = useCallback(() => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    
    return weekWorkouts.reduce((acc, workout) => ({
      workouts: acc.workouts + 1,
      duration: acc.duration + workout.duration,
      calories: acc.calories + (workout.calories || 0),
    }), { workouts: 0, duration: 0, calories: 0 });
  }, [workouts]);

  const getTotalWeight = useCallback(() => {
    return workouts.reduce((total, workout) => {
      const workoutWeight = workout.exercises.reduce((sum, exercise) => {
        return sum + (exercise.weight || 0) * exercise.sets * exercise.reps;
      }, 0);
      return total + workoutWeight;
    }, 0);
  }, [workouts]);

  const syncHealthData = useCallback(async () => {
    console.log('Syncing health data from device...');
  }, []);

  return useMemo(() => ({
    workouts,
    healthMetrics,
    isLoading: workoutsQuery.isLoading,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkoutsByDateRange,
    getTotalStats,
    getWeekStats,
    getTotalWeight,
    syncHealthData,
  }), [workouts, healthMetrics, workoutsQuery.isLoading, addWorkout, updateWorkout, deleteWorkout, getWorkoutsByDateRange, getTotalStats, getWeekStats, getTotalWeight, syncHealthData]);
});
