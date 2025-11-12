# Database Setup for Client Management System

This document outlines the required database tables and columns for the client management system.

## Required Tables

### 1. `profiles` table (should already exist)

Ensure the following columns exist:

```sql
-- Core fields
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT
full_name TEXT
phone_number TEXT
avatar_url TEXT

-- Subscription fields
subscription_status TEXT DEFAULT 'inactive'
subscription_type TEXT
subscription_start TIMESTAMP
subscription_end TIMESTAMP

-- Blocking fields
is_blocked BOOLEAN DEFAULT false
block_reason TEXT
block_end_date TIMESTAMP
late_cancellations INTEGER DEFAULT 0

-- Personal information
address TEXT
city TEXT
birth_date DATE
emergency_contact_name TEXT
emergency_contact_phone TEXT
medical_notes TEXT
goals TEXT

-- Fitness tracking
fitness_level TEXT DEFAULT 'beginner'
plate_balance INTEGER DEFAULT 0

-- Metadata
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### 2. `admin_notes` table (NEW - needs to be created)

Admin notes for tracking client interactions and important information:

```sql
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_admin_notes_client_id ON admin_notes(client_id);
CREATE INDEX idx_admin_notes_created_at ON admin_notes(created_at DESC);

-- Enable RLS
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can view all notes" ON admin_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin can insert notes" ON admin_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin can delete notes" ON admin_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

### 3. `workout_logs` table (should already exist, verify columns)

```sql
-- Verify these columns exist:
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
exercise_type TEXT
weight NUMERIC
reps INTEGER
sets INTEGER
duration INTEGER  -- in minutes
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
```

### 4. `user_challenges` table (should already exist, verify columns)

```sql
-- Verify these columns exist:
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
challenge_id UUID REFERENCES challenges(id)
completed BOOLEAN DEFAULT false
progress NUMERIC DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
completed_at TIMESTAMP
```

### 5. `class_bookings` table (should already exist, verify columns)

```sql
-- Verify these columns exist:
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
class_id UUID REFERENCES classes(id) ON DELETE CASCADE
status TEXT DEFAULT 'confirmed'  -- 'confirmed', 'cancelled', 'waitlist'
created_at TIMESTAMP DEFAULT NOW()
cancelled_at TIMESTAMP
```

### 6. `green_invoice_documents` table (should already exist from Green Invoice integration)

```sql
-- Verify these columns exist:
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
gi_document_id TEXT
document_number TEXT
amount NUMERIC
document_type TEXT  -- 'invoice', 'receipt', 'invoice_receipt'
pdf_url TEXT
created_at TIMESTAMP DEFAULT NOW()
```

### 7. `green_invoice_clients` table (should already exist from Green Invoice integration)

```sql
-- Verify these columns exist:
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
gi_client_id TEXT UNIQUE
name TEXT
email TEXT
phone TEXT
created_at TIMESTAMP DEFAULT NOW()
synced_at TIMESTAMP
```

## Setup Instructions

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Create the `admin_notes` table using the SQL above
4. Verify all other tables have the required columns
5. Add missing columns to existing tables if needed
6. Test the RLS policies work correctly

## Verification Query

Run this query to verify all required tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles',
  'admin_notes',
  'workout_logs',
  'user_challenges',
  'class_bookings',
  'green_invoice_documents',
  'green_invoice_clients'
)
ORDER BY table_name;
```

## Adding Missing Columns to `profiles`

If any columns are missing from the profiles table, run:

```sql
-- Add blocking fields if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_end_date TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS late_cancellations INTEGER DEFAULT 0;

-- Add personal info fields if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT;

-- Add fitness tracking if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitness_level TEXT DEFAULT 'beginner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plate_balance INTEGER DEFAULT 0;

-- Add subscription fields if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;
```

## Testing

After setup, test the client management system:

1. Login as an admin user
2. Navigate to the Boss tab
3. Click on "ניהול לקוחות" section
4. Click on any client to open their dashboard
5. Test editing client info, subscription, plate balance
6. Test adding notes
7. Verify all data saves correctly
