import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkouts } from '@/contexts/WorkoutContext';
import { WorkoutType } from '@/constants/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutLogScreen() {
  const router = useRouter();
  const { addWorkout } = useWorkouts();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState<WorkoutType | null>(null);
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');

  const workoutTypes: { label: string; value: WorkoutType }[] = [
    { label: 'כושר', value: 'strength' },
    { label: 'קרדיו', value: 'cardio' },
    { label: 'יוגה', value: 'yoga' },
    { label: 'HIIT', value: 'hiit' },
    { label: 'פילאטיס', value: 'pilates' },
    { label: 'אגרוף', value: 'boxing' },
    { label: 'ריקוד', value: 'dance' },
    { label: 'אחר', value: 'other' },
  ];

  const handleSave = () => {
    if (!type || !duration) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addWorkout({
      date: date.toISOString().split('T')[0],
      type: type,
      duration: parseInt(duration),
      calories: calories ? parseInt(calories) : undefined,
      distance: distance ? parseFloat(distance) : undefined,
      notes: notes || undefined,
      userId: '',
      title: workoutTypes.find(w => w.value === type)?.label || type,
      exercises: [],
    });

    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.section}>
          <Text style={styles.label}>תאריך</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#2563EB" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('he-IL')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>סוג אימון</Text>
          <View style={styles.typeGrid}>
            {workoutTypes.map((workoutType) => (
              <TouchableOpacity
                key={workoutType.value}
                style={[
                  styles.typeButton,
                  type === workoutType.value && styles.typeButtonActive,
                ]}
                onPress={() => {
                  setType(workoutType.value);
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === workoutType.value && styles.typeButtonTextActive,
                  ]}
                >
                  {workoutType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>משך (דקות)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>קלוריות (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{'מרחק בק"מ (אופציונלי)'}</Text>
          <TextInput
            style={styles.input}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>הערות</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="הוסף הערות..."
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!type || !duration) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!type || !duration}
        >
          <Text style={styles.saveButtonText}>שמור אימון</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'right',
  },
  dateButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  typeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    textAlign: 'right',
  },
  notesInput: {
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
