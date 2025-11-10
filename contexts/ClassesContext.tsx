import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Class, ClassBooking } from '@/constants/types';
import { mockClasses } from '@/constants/mockData';
import { useAuth } from './AuthContext';

const BOOKINGS_STORAGE_KEY = '@reelrep_bookings';

export const [ClassesProvider, useClasses] = createContextHook(() => {
  const { user } = useAuth();
  const [classes] = useState<Class[]>(mockClasses);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);

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
    isLoading: bookingsQuery.isLoading,
    bookClass,
    cancelBooking,
    getMyClasses,
    getUpcomingClasses,
    isClassBooked,
    getClassBooking,
    getClassAttendanceCount,
  }), [classes, bookings, bookingsQuery.isLoading, bookClass, cancelBooking, getMyClasses, getUpcomingClasses, isClassBooked, getClassBooking, getClassAttendanceCount]);
});
