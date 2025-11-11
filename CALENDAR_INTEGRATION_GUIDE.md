# 📅 Calendar Integration Guide

Automatic calendar synchronization for class bookings with Apple Calendar (iOS) and Google Calendar (Android).

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [How It Works](#how-it-works)
4. [Usage](#usage)
5. [Integration Guide](#integration-guide)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What It Does

When a user books a class in the app, the system automatically:

✅ **Creates calendar event** in their device calendar (Apple Calendar or Google Calendar)
✅ **Adds reminders** at customizable times before the class
✅ **Updates events** if class details change
✅ **Deletes events** if class is cancelled
✅ **Syncs past bookings** on first setup (optional)

### Platforms Supported

| Platform | Calendar App | Status |
|----------|-------------|--------|
| iOS | Apple Calendar | ✅ Fully Supported |
| Android | Google Calendar | ✅ Fully Supported |
| Web | N/A | ❌ Not Applicable |

---

## Setup

### 1. Install Dependencies ✅

Already installed:
```bash
npm install expo-calendar --legacy-peer-deps
```

### 2. Run Database Migration

Open **Supabase → SQL Editor** and run `calendar-sync-schema.sql`:

```sql
-- Creates 2 tables:
-- 1. user_calendar_settings - User preferences
-- 2. user_calendar_events - Event mappings
```

This creates:
- ✅ `user_calendar_settings` - User calendar sync preferences
- ✅ `user_calendar_events` - Maps class bookings to calendar events
- ✅ RLS policies for security
- ✅ Indexes for performance

### 3. Permissions in app.json ✅

Already configured:

**iOS (Apple Calendar):**
```json
"NSCalendarsUsageDescription": "We need access to your calendar to automatically add your booked classes as events.",
"NSRemindersUsageDescription": "We need access to set reminders for your upcoming classes."
```

**Android (Google Calendar):**
```json
"android.permission.READ_CALENDAR",
"android.permission.WRITE_CALENDAR"
```

---

## How It Works

### User Flow

```
1. User opens app
   ↓
2. Goes to Settings → Calendar Sync
   ↓
3. Enables "Auto Sync"
   ↓
4. Grants calendar permissions
   ↓
5. Books a class
   ↓
6. Class automatically added to their calendar 🎉
```

### Technical Flow

```typescript
// When user books a class:
1. Check if auto-sync is enabled for user
2. Check calendar permissions
3. Get/create default calendar
4. Create calendar event with:
   - Title: "🏋️ [Class Name]"
   - Time: Class date + time
   - Duration: Class duration
   - Location: Studio location
   - Notes: Instructor name + description
   - Reminders: User's preferred times
5. Save event ID → class ID mapping to database
6. Done! Event appears in user's calendar
```

### Event Updates

- **Class rescheduled**: Calendar event updated automatically
- **Class cancelled**: Calendar event deleted automatically
- **User cancels booking**: Calendar event removed

---

## Usage

### For Users

#### Enable Calendar Sync

1. Open **Settings**
2. Tap **📅 Calendar Sync**
3. Tap **"Connect to Calendar"** button
4. Grant permissions when prompted
5. Enable **"Auto Sync"** toggle
6. Optionally sync past bookings

#### Configure Reminders

Choose when to receive reminders:
- ✅ 1 day before
- ✅ 2 hours before
- ✅ 1 hour before (default)
- ✅ 30 minutes before
- ✅ 15 minutes before (default)
- ✅ 5 minutes before

Multiple reminders can be selected!

---

## Integration Guide

### Add Calendar Event When Booking Class

In your class booking handler:

```typescript
import { CalendarIntegrationService } from '@/lib/services/calendar-integration';

// After successfully booking a class
const handleBookClass = async (classData) => {
  try {
    // 1. Save booking to database
    const bookingId = await saveBookingToDatabase(classData);

    // 2. Automatically create calendar event
    const eventId = await CalendarIntegrationService.createClassEvent(
      {
        id: classData.id,
        title: classData.title,
        date: classData.date,
        time: classData.time,
        duration: classData.duration,
        location: classData.location,
        instructor: classData.instructor,
        description: classData.description,
      },
      userId
    );

    if (eventId) {
      console.log('Calendar event created:', eventId);
      // Optionally show success message
    }

    return bookingId;
  } catch (error) {
    console.error('Error booking class:', error);
  }
};
```

### Delete Calendar Event When Cancelling

In your cancel booking handler:

```typescript
import { CalendarIntegrationService } from '@/lib/services/calendar-integration';

const handleCancelClass = async (classId: string) => {
  try {
    // 1. Cancel booking in database
    await cancelBookingInDatabase(classId);

    // 2. Remove calendar event
    const deleted = await CalendarIntegrationService.deleteClassEvent(
      classId,
      userId
    );

    if (deleted) {
      console.log('Calendar event removed');
    }
  } catch (error) {
    console.error('Error cancelling class:', error);
  }
};
```

### Using the React Hook

```typescript
import { useCalendarSync } from '@/lib/hooks/useCalendarSync';

function MyComponent() {
  const {
    hasPermission,
    settings,
    calendarAppName, // "Apple Calendar" or "Google Calendar"
    enableAutoSync,
    disableAutoSync,
    syncAllClasses,
  } = useCalendarSync();

  const handleEnable = async () => {
    const success = await enableAutoSync([60, 15]); // 1 hour + 15 min reminders
    if (success) {
      alert('Calendar sync enabled!');
    }
  };

  return (
    <View>
      <Text>Calendar: {calendarAppName}</Text>
      <Text>Auto Sync: {settings?.autoSync ? 'ON' : 'OFF'}</Text>
      {!hasPermission && (
        <Button onPress={handleEnable} title="Enable Calendar Sync" />
      )}
    </View>
  );
}
```

---

## API Reference

### CalendarIntegrationService

#### `requestPermissions()`
Requests calendar permissions from the user.

```typescript
const granted = await CalendarIntegrationService.requestPermissions();
// Returns: boolean
```

#### `checkPermissions()`
Checks if calendar permissions are already granted.

```typescript
const hasPermission = await CalendarIntegrationService.checkPermissions();
// Returns: boolean
```

#### `createClassEvent(classData, userId)`
Creates a calendar event for a booked class.

```typescript
const eventId = await CalendarIntegrationService.createClassEvent(
  {
    id: 'class-123',
    title: 'Yoga Advanced',
    date: '2025-11-15',
    time: '18:00',
    duration: 60,
    location: 'Studio A',
    instructor: 'Jane Doe',
    description: 'Advanced yoga class'
  },
  userId
);
// Returns: string | null (calendar event ID)
```

#### `updateClassEvent(classId, userId, updatedData)`
Updates an existing calendar event.

```typescript
const success = await CalendarIntegrationService.updateClassEvent(
  'class-123',
  userId,
  {
    title: 'Yoga Advanced (Updated)',
    date: '2025-11-16', // Changed date
    time: '19:00', // Changed time
    duration: 90, // Changed duration
    location: 'Studio B',
    instructor: 'Jane Doe',
  }
);
// Returns: boolean
```

#### `deleteClassEvent(classId, userId)`
Deletes a calendar event.

```typescript
const success = await CalendarIntegrationService.deleteClassEvent(
  'class-123',
  userId
);
// Returns: boolean
```

#### `enableAutoSync(userId, reminderMinutes)`
Enables automatic calendar sync for a user.

```typescript
const success = await CalendarIntegrationService.enableAutoSync(
  userId,
  [60, 15] // Reminders at 1 hour and 15 minutes before
);
// Returns: boolean
```

#### `disableAutoSync(userId)`
Disables automatic calendar sync.

```typescript
const success = await CalendarIntegrationService.disableAutoSync(userId);
// Returns: boolean
```

#### `syncAllUpcomingClasses(userId)`
Syncs all upcoming booked classes to calendar.

```typescript
const count = await CalendarIntegrationService.syncAllUpcomingClasses(userId);
// Returns: number (number of events synced)
```

#### `getUserCalendarSettings(userId)`
Gets user's calendar sync settings.

```typescript
const settings = await CalendarIntegrationService.getUserCalendarSettings(userId);
// Returns: {
//   autoSync: boolean,
//   defaultCalendarId?: string,
//   reminderMinutes: number[],
//   syncPastEvents: boolean
// } | null
```

#### `updateReminderTimes(userId, reminderMinutes)`
Updates reminder times for future events.

```typescript
const success = await CalendarIntegrationService.updateReminderTimes(
  userId,
  [1440, 120, 30] // 1 day, 2 hours, 30 minutes before
);
// Returns: boolean
```

---

## Database Schema

### user_calendar_settings

Stores user preferences for calendar sync.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference (unique) |
| auto_sync | BOOLEAN | Auto-sync enabled |
| default_calendar_id | VARCHAR | Platform calendar ID |
| reminder_minutes | INTEGER[] | Reminder times in minutes |
| sync_past_events | BOOLEAN | Sync past events |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### user_calendar_events

Maps class bookings to calendar events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| class_id | VARCHAR | Class booking ID |
| calendar_event_id | VARCHAR | Platform event ID |
| synced_at | TIMESTAMP | Sync time |
| created_at | TIMESTAMP | Creation time |

**Unique constraint:** (user_id, class_id)

---

## Troubleshooting

### Events Not Creating

**Issue:** Calendar events not being created when booking classes

**Solutions:**

1. **Check permissions:**
   ```typescript
   const hasPermission = await CalendarIntegrationService.checkPermissions();
   console.log('Permission granted:', hasPermission);
   ```

2. **Check auto-sync enabled:**
   ```sql
   SELECT auto_sync FROM user_calendar_settings WHERE user_id = 'your-user-id';
   ```

3. **Verify calendar integration is called:**
   ```typescript
   // In your booking handler, add logging:
   console.log('Creating calendar event...');
   const eventId = await CalendarIntegrationService.createClassEvent(...);
   console.log('Event ID:', eventId);
   ```

4. **Check device calendar app:**
   - iOS: Open Calendar app → Check for "Reel Rep Training" events
   - Android: Open Google Calendar → Check for events

### Permission Denied

**Issue:** User denies calendar permission

**Solution:**
User must manually enable in device settings:

**iOS:**
1. Settings → Privacy & Security → Calendars
2. Find "Reel Rep Training"
3. Toggle ON

**Android:**
1. Settings → Apps → Reel Rep Training
2. Permissions → Calendar
3. Allow

### Events Not Syncing

**Issue:** Past bookings not appearing in calendar

**Solution:**
```typescript
// Manually trigger sync
const count = await CalendarIntegrationService.syncAllUpcomingClasses(userId);
console.log(`Synced ${count} events`);
```

### Multiple Calendars (iOS)

**Issue:** Events going to wrong calendar on iOS

**Solution:**
The app uses the default iOS calendar. User can change which calendar is default in iOS Settings → Calendar → Default Calendar.

### Calendar Not Found (Android)

**Issue:** "No calendar available" error on Android

**Solution:**
The app creates a "Reel Rep Training" calendar automatically. If it fails:
1. Ensure Google Calendar app is installed
2. Ensure user has a Google account signed in
3. Check calendar permissions are granted

---

## Best Practices

### When to Create Events

✅ **DO** create calendar events:
- When user books a class
- When user confirms attendance
- When auto-sync is enabled

❌ **DON'T** create calendar events:
- When auto-sync is disabled
- When permissions are not granted
- For past events (unless explicitly requested)

### Error Handling

Always handle calendar operations gracefully:

```typescript
try {
  const eventId = await CalendarIntegrationService.createClassEvent(...);

  if (eventId) {
    // Success!
    console.log('Event created');
  } else {
    // Failed silently (permissions or auto-sync off)
    console.log('Event not created (expected)');
  }
} catch (error) {
  // Unexpected error
  console.error('Calendar error:', error);
  // Don't fail the booking - calendar is optional
}
```

**Important:** Never let calendar failures prevent booking completion!

### User Experience

1. **Inform users:** Show a message when calendar sync is enabled
2. **Confirm sync:** Ask before syncing many past events
3. **Respect preferences:** Always check auto-sync setting before creating events
4. **Handle denials gracefully:** If permission denied, don't keep asking

---

## Testing

### Manual Testing Checklist

#### iOS Testing:
- [ ] Enable calendar sync in settings
- [ ] Grant calendar permission
- [ ] Book a class
- [ ] Open iOS Calendar app
- [ ] Verify event appears with:
  - [ ] Correct title
  - [ ] Correct date/time
  - [ ] Correct location
  - [ ] Reminders set
- [ ] Cancel booking
- [ ] Verify event removed from calendar

#### Android Testing:
- [ ] Enable calendar sync in settings
- [ ] Grant calendar permission
- [ ] Book a class
- [ ] Open Google Calendar app
- [ ] Verify event appears in "Reel Rep Training" calendar
- [ ] Check event details
- [ ] Cancel booking
- [ ] Verify event removed

#### Edge Cases:
- [ ] Test with no permission granted
- [ ] Test with auto-sync disabled
- [ ] Test booking multiple classes
- [ ] Test updating class time
- [ ] Test user with no calendars (Android)

### Automated Testing

```typescript
// Example test
describe('Calendar Integration', () => {
  it('creates calendar event when booking class', async () => {
    const userId = 'test-user-id';

    // Enable auto-sync
    await CalendarIntegrationService.enableAutoSync(userId);

    // Book class
    const eventId = await CalendarIntegrationService.createClassEvent({
      id: 'test-class',
      title: 'Test Class',
      date: '2025-11-15',
      time: '10:00',
      duration: 60,
      location: 'Studio A',
      instructor: 'Test Instructor',
    }, userId);

    expect(eventId).toBeTruthy();

    // Cleanup
    await CalendarIntegrationService.deleteClassEvent('test-class', userId);
  });
});
```

---

## Production Checklist

Before going live:

- [ ] Run `calendar-sync-schema.sql` in production Supabase
- [ ] Test on physical iOS device (calendar doesn't work in simulator)
- [ ] Test on physical Android device
- [ ] Verify permissions prompts are clear
- [ ] Test with users who deny permissions
- [ ] Test with users who revoke permissions later
- [ ] Monitor Supabase logs for errors
- [ ] Set up analytics for calendar sync usage
- [ ] Create help documentation for users
- [ ] Test calendar event updates
- [ ] Test calendar event deletions
- [ ] Verify RLS policies are working

---

## FAQs

### Q: Do users need to enable this feature?
**A:** Yes, it's opt-in. Users must enable "Auto Sync" in settings and grant calendar permissions.

### Q: Can users choose which calendar to use?
**A:** On Android, events go to the app's dedicated calendar. On iOS, events go to the default calendar (user can change default in iOS Settings).

### Q: What happens if user deletes event from calendar?
**A:** Deleting from calendar doesn't cancel the class booking. Only cancelling in the app removes the booking.

### Q: Can users sync past bookings?
**A:** Yes! Use the "Sync All Upcoming Classes" button in Calendar Sync settings.

### Q: What if class time changes?
**A:** When you update class details in your backend, call `updateClassEvent()` to update the calendar event.

### Q: Does this work offline?
**A:** Yes! Calendar events are created on-device. They'll appear in the user's calendar even offline.

---

## Summary

You now have:

✅ **Automatic calendar sync** for iOS & Android
✅ **Customizable reminders** (6 time options)
✅ **Beautiful settings UI** with status indicators
✅ **Complete service layer** for all calendar operations
✅ **React hook** for easy integration
✅ **Database schema** with RLS security
✅ **Permission handling** for both platforms

**Next Step:** Integrate `createClassEvent()` into your class booking flow!

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or review the [API Reference](#api-reference).
