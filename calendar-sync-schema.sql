-- ============================================
-- Calendar Sync Integration
-- Database Schema for Automatic Calendar Sync
-- ============================================

-- ============================================
-- USER CALENDAR SETTINGS TABLE
-- ============================================

-- Stores user preferences for calendar sync
CREATE TABLE IF NOT EXISTS user_calendar_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_sync BOOLEAN DEFAULT false,
  default_calendar_id VARCHAR(255), -- Platform-specific calendar ID
  reminder_minutes INTEGER[] DEFAULT ARRAY[60, 15], -- Minutes before event for reminders
  sync_past_events BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_calendar_settings_user_id ON user_calendar_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_settings_auto_sync ON user_calendar_settings(auto_sync) WHERE auto_sync = true;

-- ============================================
-- USER CALENDAR EVENTS TABLE
-- ============================================

-- Maps class bookings to calendar events
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id VARCHAR(255) NOT NULL, -- Reference to class booking
  calendar_event_id VARCHAR(255) NOT NULL, -- Platform-specific event ID
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, class_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_class_id ON user_calendar_events(class_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_calendar_event_id ON user_calendar_events(calendar_event_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE user_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Calendar Settings Policies
CREATE POLICY "Users can view their own calendar settings"
  ON user_calendar_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar settings"
  ON user_calendar_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Calendar Events Policies
CREATE POLICY "Users can view their own calendar events"
  ON user_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar events"
  ON user_calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_calendar_settings_updated_at ON user_calendar_settings;
CREATE TRIGGER update_user_calendar_settings_updated_at
  BEFORE UPDATE ON user_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_settings_updated_at();

-- ============================================
-- GRANTS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_calendar_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_calendar_events TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON user_calendar_settings TO service_role;
GRANT ALL ON user_calendar_events TO service_role;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Calendar Sync schema created successfully!';
  RAISE NOTICE '📅 Tables created:';
  RAISE NOTICE '   - user_calendar_settings (user preferences)';
  RAISE NOTICE '   - user_calendar_events (class → calendar event mapping)';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Enable calendar sync in app settings';
  RAISE NOTICE '2. Book a class to test automatic calendar creation';
  RAISE NOTICE '3. Check your device calendar for the event';
END $$;
