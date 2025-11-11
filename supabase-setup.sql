-- ============================================
-- Reel Rep Training App - Database Setup
-- Complete SQL Schema for Financial Dashboard,
-- Client Management, and Plates Currency System
-- ============================================

-- ============================================
-- PLATES CURRENCY SYSTEM
-- ============================================

-- Plates Transactions Table
-- Records all plate currency transactions (earned, spent, bonus, refund)
CREATE TABLE IF NOT EXISTS plates_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for earned, negative for spent
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'refund')),
  source VARCHAR(100) NOT NULL, -- e.g., 'workout', 'achievement', 'purchase_discount'
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_plates_transactions_user_id ON plates_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plates_transactions_created_at ON plates_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plates_transactions_type ON plates_transactions(transaction_type);

-- Plates Discounts Table
-- Stores discount codes that can award plates or provide discounts
CREATE TABLE IF NOT EXISTS plates_discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'plates')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER DEFAULT 0, -- 0 means unlimited
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for discount code lookups
CREATE INDEX IF NOT EXISTS idx_plates_discounts_code ON plates_discounts(code);
CREATE INDEX IF NOT EXISTS idx_plates_discounts_active ON plates_discounts(is_active) WHERE is_active = true;

-- ============================================
-- PROFILES TABLE UPDATES
-- Add columns for plates and subscription management
-- ============================================

-- Add plate_balance column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'plate_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN plate_balance INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add subscription management columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_type VARCHAR(50) DEFAULT 'basic';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'cancelled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_start'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_start TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_end'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_end TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'classes_per_month'
  ) THEN
    ALTER TABLE profiles ADD COLUMN classes_per_month INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'classes_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN classes_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'block_end_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN block_end_date TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'late_cancellations'
  ) THEN
    ALTER TABLE profiles ADD COLUMN late_cancellations INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_workouts'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_workouts INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add index for blocked users
CREATE INDEX IF NOT EXISTS idx_profiles_block_end_date ON profiles(block_end_date) WHERE block_end_date IS NOT NULL;

-- ============================================
-- GREEN INVOICE INTEGRATION
-- (If not already created by useGreenInvoice hook)
-- ============================================

-- Green Invoice Clients Table
CREATE TABLE IF NOT EXISTS green_invoice_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gi_client_id VARCHAR(100) UNIQUE NOT NULL, -- Green Invoice client ID
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_gi_clients_user_id ON green_invoice_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_gi_clients_gi_id ON green_invoice_clients(gi_client_id);

-- Green Invoice Documents Table
CREATE TABLE IF NOT EXISTS green_invoice_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gi_document_id VARCHAR(100) UNIQUE NOT NULL, -- Green Invoice document ID
  document_type VARCHAR(50) NOT NULL, -- 'invoice', 'invoice_receipt', 'receipt'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  payment_method VARCHAR(50),
  document_url TEXT, -- URL to PDF
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS idx_gi_documents_user_id ON green_invoice_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_gi_documents_created_at ON green_invoice_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gi_documents_status ON green_invoice_documents(status);
CREATE INDEX IF NOT EXISTS idx_gi_documents_gi_id ON green_invoice_documents(gi_document_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE plates_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plates_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_invoice_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_invoice_documents ENABLE ROW LEVEL SECURITY;

-- Plates Transactions Policies
-- Users can view their own transactions
CREATE POLICY "Users can view their own plates transactions"
  ON plates_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system/admin can insert transactions (via service role or stored procedures)
CREATE POLICY "Service role can insert plates transactions"
  ON plates_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Plates Discounts Policies
-- Everyone can read active discounts (to validate codes)
CREATE POLICY "Anyone can view active discount codes"
  ON plates_discounts FOR SELECT
  USING (is_active = true);

-- Only admins can manage discount codes
CREATE POLICY "Admins can manage discount codes"
  ON plates_discounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Green Invoice Clients Policies
-- Users can view their own client record
CREATE POLICY "Users can view their own GI client record"
  ON green_invoice_clients FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all client records
CREATE POLICY "Admins can view all GI client records"
  ON green_invoice_clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert/update client records
CREATE POLICY "Service role can manage GI client records"
  ON green_invoice_clients FOR ALL
  USING (auth.role() = 'service_role');

-- Green Invoice Documents Policies
-- Users can view their own documents
CREATE POLICY "Users can view their own GI documents"
  ON green_invoice_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all GI documents"
  ON green_invoice_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can manage documents
CREATE POLICY "Service role can manage GI documents"
  ON green_invoice_documents FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- STORED PROCEDURES / FUNCTIONS
-- ============================================

-- Function to automatically award plates on achievement completion
CREATE OR REPLACE FUNCTION award_achievement_plates()
RETURNS TRIGGER AS $$
BEGIN
  -- Award plates when an achievement is completed
  IF NEW.completed = true AND OLD.completed = false THEN
    -- Get the achievement points
    DECLARE
      achievement_points INTEGER;
      achievement_name TEXT;
    BEGIN
      SELECT points, name_hebrew INTO achievement_points, achievement_name
      FROM achievements
      WHERE id = NEW.achievement_id;

      -- Add plates
      UPDATE profiles
      SET plate_balance = plate_balance + achievement_points
      WHERE id = NEW.user_id;

      -- Record transaction
      INSERT INTO plates_transactions (user_id, amount, transaction_type, source, description)
      VALUES (NEW.user_id, achievement_points, 'earned', 'achievement', 'הושג הישג: ' || achievement_name);
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for achievement plates (if user_achievements table exists)
-- DROP TRIGGER IF EXISTS trigger_award_achievement_plates ON user_achievements;
-- CREATE TRIGGER trigger_award_achievement_plates
--   AFTER UPDATE ON user_achievements
--   FOR EACH ROW
--   EXECUTE FUNCTION award_achievement_plates();

-- Function to reset monthly class usage
CREATE OR REPLACE FUNCTION reset_monthly_class_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET classes_used = 0
  WHERE subscription_status = 'active'
    AND DATE_PART('day', CURRENT_DATE) = 1; -- First day of month
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample discount codes
INSERT INTO plates_discounts (code, discount_type, discount_value, min_purchase_amount, max_uses, valid_from, valid_until)
VALUES
  ('WELCOME10', 'plates', 100, 0, 100, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW()) + INTERVAL '30 days'),
  ('NEWYEAR25', 'percentage', 25, 100, 500, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW()) + INTERVAL '60 days'),
  ('VIP50', 'fixed_amount', 50, 200, 0, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW()) + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- GRANTS (if needed)
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON plates_transactions TO authenticated;
GRANT SELECT ON plates_discounts TO authenticated;
GRANT SELECT ON green_invoice_clients TO authenticated;
GRANT SELECT ON green_invoice_documents TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON plates_transactions TO service_role;
GRANT ALL ON plates_discounts TO service_role;
GRANT ALL ON green_invoice_clients TO service_role;
GRANT ALL ON green_invoice_documents TO service_role;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '📊 Tables created: plates_transactions, plates_discounts, green_invoice_clients, green_invoice_documents';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '🎯 Sample discount codes inserted';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Verify the tables in your Supabase dashboard';
  RAISE NOTICE '2. Test the discount codes in the Plates Store';
  RAISE NOTICE '3. Configure Green Invoice API credentials in your environment variables';
END $$;
