-- ============================================
-- Push Notifications & Health Integration
-- Database Schema for Supabase
-- ============================================

-- ============================================
-- PUSH NOTIFICATIONS TABLES
-- ============================================

-- User Push Tokens Table
-- Stores device push tokens for sending notifications
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, platform)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = true;

-- User Notification Preferences Table
-- Stores user preferences for different notification types
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plates_earned BOOLEAN DEFAULT true,
  achievements BOOLEAN DEFAULT true,
  class_reminders BOOLEAN DEFAULT true,
  subscription_alerts BOOLEAN DEFAULT true,
  workout_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_user_id ON user_notification_preferences(user_id);

-- Notification History Table
-- Stores sent notifications for tracking and analytics
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  opened_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);

-- ============================================
-- HEALTH INTEGRATION TABLES
-- ============================================

-- User Health Data Table
-- Stores daily health metrics synced from device
CREATE TABLE IF NOT EXISTS user_health_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  distance DECIMAL(10, 2) DEFAULT 0, -- in meters
  active_minutes INTEGER DEFAULT 0,
  calories INTEGER DEFAULT 0,
  resting_heart_rate INTEGER,
  sleep_minutes INTEGER,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  source VARCHAR(50) DEFAULT 'manual', -- 'apple_health', 'google_fit', 'manual'
  UNIQUE(user_id, date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_health_data_user_id ON user_health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_data_date ON user_health_data(date DESC);

-- User Health Workouts Table
-- Stores individual workouts synced from health apps
CREATE TABLE IF NOT EXISTS user_health_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id VARCHAR(255) UNIQUE NOT NULL, -- ID from health app
  workout_type VARCHAR(100) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  calories INTEGER,
  distance DECIMAL(10, 2), -- in meters
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  source VARCHAR(50) NOT NULL, -- 'apple_health', 'google_fit'
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  plates_awarded BOOLEAN DEFAULT false
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_health_workouts_user_id ON user_health_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_workouts_start_time ON user_health_workouts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_health_workouts_external_id ON user_health_workouts(external_id);

-- User Health Sync Settings Table
-- Stores user preferences for health data syncing
CREATE TABLE IF NOT EXISTS user_health_sync_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'manual'
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_steps BOOLEAN DEFAULT true,
  sync_workouts BOOLEAN DEFAULT true,
  sync_calories BOOLEAN DEFAULT true,
  sync_heart_rate BOOLEAN DEFAULT false,
  sync_sleep BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_user_health_sync_settings_user_id ON user_health_sync_settings(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_sync_settings ENABLE ROW LEVEL SECURITY;

-- Push Tokens Policies
CREATE POLICY "Users can view their own push tokens"
  ON user_push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON user_push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON user_push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON user_push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can view their own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification History Policies
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notification_history FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Health Data Policies
CREATE POLICY "Users can view their own health data"
  ON user_health_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own health data"
  ON user_health_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Health Workouts Policies
CREATE POLICY "Users can view their own health workouts"
  ON user_health_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own health workouts"
  ON user_health_workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Health Sync Settings Policies
CREATE POLICY "Users can view their own health sync settings"
  ON user_health_sync_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own health sync settings"
  ON user_health_sync_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_user_push_tokens_updated_at ON user_push_tokens;
CREATE TRIGGER update_user_push_tokens_updated_at
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notification_prefs_updated_at ON user_notification_preferences;
CREATE TRIGGER update_user_notification_prefs_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_health_sync_settings_updated_at ON user_health_sync_settings;
CREATE TRIGGER update_user_health_sync_settings_updated_at
  BEFORE UPDATE ON user_health_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Note: This would normally be done through the application
-- But here are examples of what the data looks like

-- Example notification preferences (inserted automatically on first use)
-- INSERT INTO user_notification_preferences (user_id, plates_earned, achievements, class_reminders, subscription_alerts)
-- VALUES ('user-uuid-here', true, true, true, true);

-- Example health sync settings (inserted automatically on first sync)
-- INSERT INTO user_health_sync_settings (user_id, auto_sync_enabled, sync_frequency)
-- VALUES ('user-uuid-here', true, 'daily');

-- ============================================
-- GRANTS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_notification_preferences TO authenticated;
GRANT SELECT ON notification_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_health_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_health_workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_health_sync_settings TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON user_push_tokens TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON notification_history TO service_role;
GRANT ALL ON user_health_data TO service_role;
GRANT ALL ON user_health_workouts TO service_role;
GRANT ALL ON user_health_sync_settings TO service_role;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Push Notifications & Health Integration schema created successfully!';
  RAISE NOTICE '📱 Tables created:';
  RAISE NOTICE '   - user_push_tokens';
  RAISE NOTICE '   - user_notification_preferences';
  RAISE NOTICE '   - notification_history';
  RAISE NOTICE '   - user_health_data';
  RAISE NOTICE '   - user_health_workouts';
  RAISE NOTICE '   - user_health_sync_settings';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Update app.json with notification configuration';
  RAISE NOTICE '2. Test notifications in the app';
  RAISE NOTICE '3. Connect health apps (iOS HealthKit / Android Health Connect)';
  RAISE NOTICE '4. Test health data syncing';
END $$;
