-- ============================================
-- FIX: Add missing role column to profiles
-- Run this FIRST before the main setup
-- ============================================

-- Add role column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
  END IF;
END $$;

-- Add index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing users to have 'user' role if null
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Now you can run the main supabase-setup.sql file
