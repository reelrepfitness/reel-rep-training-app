import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Class, ClassBooking } from '@/constants/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/constants/supabase';

const BOOKINGS_STORAGE_KEY = '@reelrep_bookings';

interface ClassSchedule {
  id: string;
  name: string;
  description: string | null;
  coach_id: string | null;
  coach_name: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  required_subscription_level: number;
  location: string | null;
  class_type: string;
  is_active: boolean;
}

function generateWeeklyClasses(schedules: ClassSchedule[], weeksAhead: number = 2): Class[] {
  const classes: Class[] = [];
  const now = new Date();
  
  for (let week = 0; week < weeksAhead; week++) {
    for (const schedule of schedules) {
      const dayOffset = schedule.day_of_week - now.getDay() + (week * 7);
      const classDate = new Date(now);
      classDate.setDate(now.getDate() + dayOffset);
      classDate.setHours(0, 0, 0, 0);
      
      const [hours, minutes] = schedule.start_time.split(':');
      const timeString = `${hours}:${minutes}`;
      
      const difficultyMap: Record<string, string> = {
        'crossfit': 'advanced',
        'strength': 'intermediate',
        'cardio': 'beginner',
      };
      
      classes.push({
        id: `${schedule.id}-${classDate.toISOString().split('T')[0]}`,
        title: schedule.name,
        instructor: schedule.coach_name,
        date: classDate.toISOString().split('T')[0],
        time: timeString,
        duration: schedule.duration_minutes,
        capacity: schedule.max_participants,
        enrolled: 0,
        location: schedule.location || 'Main Gym',
        difficulty: difficultyMap[schedule.class_type.toLowerCase()] || 'intermediate',
        description: schedule.description || '',
        requiredSubscription: schedule.required_subscription_level === 1 
          ? ['unlimited', 'premium'] 
          : ['unlimited'],
      });
    }
  }
  
  return classes.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
}

export const [ClassesProvider, useClasses] = createContextHook(() => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);

  const schedulesQuery = useQuery({
    queryKey: ['class-schedules'],
    queryFn: async () => {
      console.log('Fetching class schedules from Supabase...');
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
      
      if (error) {
        console.error('Error fetching class schedules:', error);
        throw error;
      }
      
      console.log('Fetched schedules:', data);
      return data as ClassSchedule[];
    },
  });

  useEffect(() => {
    if (schedulesQuery.data) {
      const generated = generateWeeklyClasses(schedulesQuery.data);
      console.log('Generated classes:', generated);
      setClasses(generated);
    }
  }, [schedulesQuery.data]);

  const bookingsQuery = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(`${BOOKINGS_STORAGE_KEY}_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!user,
  });

  const syncMutation = useMutation({
    mutationFn: async (bookings: ClassBooking[]) => {
      if (user) {
        await AsyncStorage.setItem(`${BOOKINGS_STORAGE_KEY}_${user.id}`, JSON.stringify(bookings));
      }
      return bookings;
    },
  });

  const { mutate: syncBookings } = syncMutation;

  useEffect(() => {
    if (bookingsQuery.data !== undefined) {
      setBookings(bookingsQuery.data);
    }
  }, [bookingsQuery.data]);

  const bookClass = useCallback((classId: string) => {
    if (!user?.subscription) {
      throw new Error('נדרש מנוי פעיל');
    }

    const classItem = classes.find(c => c.id === classId);
    if (!classItem) {
      throw new Error('השיעור לא נמצא');
    }

    if (classItem.enrolled >= classItem.capacity) {
      throw new Error('השיעור מלא');
    }

    if (!classItem.requiredSubscription.includes(user.subscription.type)) {
      throw new Error('המנוי שלך אינו כולל שיעור זה');
    }

    if (user.subscription.classesUsed >= user.subscription.classesPerMonth) {
      throw new Error('מיצית את מכסת השיעורים החודשית');
    }

    const existingBooking = bookings.find(
      b => b.classId === classId && b.status === 'confirmed'
    );

    if (existingBooking) {
      throw new Error('כבר נרשמת לשיעור זה');
    }

    const newBooking: ClassBooking = {
      id: Date.now().toString(),
      userId: user.id,
      classId,
      bookingDate: new Date().toISOString(),
      status: 'confirmed',
    };

    const updated = [...bookings, newBooking];
    setBookings(updated);
    syncBookings(updated);

    return newBooking;
  }, [user, classes, bookings, syncBookings]);

  const cancelBooking = useCallback((bookingId: string) => {
    const updated = bookings.map(b =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    setBookings(updated);
    syncBookings(updated);
  }, [bookings, syncBookings]);

  const getMyClasses = useCallback(() => {
    const myBookingIds = bookings
      .filter(b => b.status === 'confirmed')
      .map(b => b.classId);
    
    return classes.filter(c => myBookingIds.includes(c.id));
  }, [bookings, classes]);

  const getUpcomingClasses = useCallback(() => {
    const now = new Date();
    return classes.filter(c => new Date(c.date + ' ' + c.time) > now);
  }, [classes]);

  const isClassBooked = useCallback((classId: string) => {
    return bookings.some(b => b.classId === classId && b.status === 'confirmed');
  }, [bookings]);

  const getClassBooking = useCallback((classId: string) => {
    return bookings.find(b => b.classId === classId && b.status === 'confirmed');
  }, [bookings]);

  const getClassAttendanceCount = useCallback(() => {
    return bookings.filter(b => b.status === 'completed').length;
  }, [bookings]);

  return useMemo(() => ({
    classes,
    bookings,
    isLoading: bookingsQuery.isLoading || schedulesQuery.isLoading,
    bookClass,
    cancelBooking,
    getMyClasses,
    getUpcomingClasses,
    isClassBooked,
    getClassBooking,
    getClassAttendanceCount,
  }), [classes, bookings, bookingsQuery.isLoading, schedulesQuery.isLoading, bookClass, cancelBooking, getMyClasses, getUpcomingClasses, isClassBooked, getClassBooking, getClassAttendanceCount]);
});
