# 🚀 Financial Dashboard & Plates Currency Setup Guide

## Overview

This guide will help you set up three major features for your Reel Rep Training App:

1. **💰 Financial Dashboard** - Complete financial management with Green Invoice integration
2. **👥 Client Management** - Comprehensive client and subscription management
3. **🏆 Plates Currency** - Gamification reward system with discount codes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Dependencies](#step-1-install-dependencies)
3. [Step 2: Database Setup](#step-2-database-setup)
4. [Step 3: Environment Variables](#step-3-environment-variables)
5. [Step 4: Testing](#step-4-testing)
6. [Features Overview](#features-overview)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Supabase project set up
- ✅ Green Invoice account (for financial features)
- ✅ Node.js and npm installed
- ✅ Expo CLI installed

---

## Step 1: Install Dependencies

All required dependencies have been installed:

```bash
npm install react-native-chart-kit --legacy-peer-deps
```

Dependencies installed:
- ✅ `react-native-chart-kit` - For charts in financial dashboard
- ✅ `react-native-svg` - Already installed (chart dependency)
- ✅ `@react-native-community/datetimepicker` - Already installed

---

## Step 2: Database Setup

### 2.1 Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Create a new query

### 2.2 Run the SQL Schema

1. Open `supabase-setup.sql` in your project root
2. Copy **ALL** the content
3. Paste it into the Supabase SQL Editor
4. Click **Run**

The script will create:
- ✅ `plates_transactions` table
- ✅ `plates_discounts` table
- ✅ `green_invoice_clients` table
- ✅ `green_invoice_documents` table
- ✅ Updates to `profiles` table
- ✅ Row Level Security (RLS) policies
- ✅ Sample discount codes

### 2.3 Verify Setup

After running the SQL, verify the tables exist:

1. Go to **Table Editor** in Supabase
2. You should see:
   - `plates_transactions`
   - `plates_discounts`
   - `green_invoice_clients`
   - `green_invoice_documents`

---

## Step 3: Environment Variables

### 3.1 Green Invoice Setup (Optional but Recommended)

If you want to use the financial dashboard with real invoices:

1. Sign up for Green Invoice: https://www.greeninvoice.co.il/
2. Get your API credentials:
   - API Key
   - Secret Key
3. Add to your `.env` file:

```env
EXPO_PUBLIC_GREEN_INVOICE_API_KEY=your_api_key_here
EXPO_PUBLIC_GREEN_INVOICE_SECRET=your_secret_here
EXPO_PUBLIC_GREEN_INVOICE_ENV=sandbox  # or 'production'
```

### 3.2 Supabase Environment Variables

Ensure these are already set in your `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Step 4: Testing

### 4.1 Start the Development Server

```bash
npx expo start
```

### 4.2 Test Financial Dashboard (Admin Only)

1. Log in as an admin user
2. Navigate to Admin Dashboard
3. Click "💰 לוח ניהול פיננסי"
4. You should see:
   - Main dashboard with stats
   - Daily documents view
   - Monthly comparison with charts
   - All invoices with filters

### 4.3 Test Client Management (Admin Only)

1. From Admin Dashboard
2. Click "👥 ניהול לקוחות"
3. You should see:
   - List of all clients
   - Search functionality
   - Edit client details
   - Block/unblock clients
   - Manage subscriptions

### 4.4 Test Plates Store (All Users)

1. Log in as any user
2. Go to Profile tab
3. Click on the Plates balance card (now clickable!)
4. You should see:
   - Current plate balance
   - Discount code input
   - How to earn plates
   - Transaction history

### 4.5 Test Discount Codes

Try these sample codes in the Plates Store:

- `WELCOME10` - Awards 100 plates
- `NEWYEAR25` - 25% discount on next purchase
- `VIP50` - ₪50 fixed discount

---

## Features Overview

### 💰 Financial Dashboard

**Location:** `/admin/financial`

**Screens:**
1. **Main Dashboard** - Overview of revenue and stats
2. **Daily Documents** - View income by day with date picker
3. **Monthly Comparison** - Charts comparing months
4. **All Invoices** - Complete invoice list with filters

**Features:**
- Real-time revenue tracking
- Beautiful charts using react-native-chart-kit
- Filter by status (paid, pending, cancelled)
- Filter by document type
- Search functionality
- Date range selection

**Data Sources:**
- Pulls from `green_invoice_documents` table
- Automatically syncs with Green Invoice API

---

### 👥 Client Management

**Location:** `/admin/clients`

**Features:**
- **Search Clients** - Find by name or email
- **View Details** - Full client information
- **Edit Subscriptions** - Change dates and limits
- **Manage Classes** - Track used/available classes
- **Block/Unblock** - Temporary client restrictions
- **Statistics** - View workouts and cancellations

**What You Can Do:**
- ✅ Change subscription start/end dates
- ✅ Adjust classes used count
- ✅ Block clients for 30 days
- ✅ View client statistics
- ✅ Track late cancellations

---

### 🏆 Plates Currency System

**Location:** `/plates/store`

**How It Works:**

1. **Earning Plates:**
   - Complete a workout: **+10 plates**
   - Attend a class: **+15 plates**
   - Unlock achievement: **Variable plates**
   - Use discount codes: **Bonus plates**

2. **Using Plates:**
   - 1 plate = ₪1 discount
   - Maximum 50% discount per purchase
   - Use in shop checkout
   - Never expire

3. **Discount Codes:**
   - Admin creates codes in Supabase
   - Users redeem in Plates Store
   - Types: percentage, fixed amount, or bonus plates
   - Can set expiry dates and usage limits

**Service Layer:** `lib/plates-manager.ts`

**Key Functions:**
```typescript
PlatesManager.getBalance(userId)           // Get user's balance
PlatesManager.addPlates(userId, amount)    // Award plates
PlatesManager.spendPlates(userId, amount)  // Use plates
PlatesManager.validateDiscountCode(code)   // Check code
PlatesManager.awardWorkoutPlates(userId)   // Auto-award after workout
```

---

## File Structure

```
app/
├── admin/
│   ├── financial/
│   │   ├── index.tsx              # Main financial dashboard
│   │   ├── daily-documents.tsx    # Daily income view
│   │   ├── monthly-comparison.tsx # Charts & comparisons
│   │   └── all-invoices.tsx       # All invoices with filters
│   └── clients/
│       └── index.tsx               # Client management
├── plates/
│   └── store.tsx                   # Plates currency store
└── (tabs)/
    └── profile.tsx                 # Updated with plates link

lib/
└── plates-manager.ts               # Plates service layer

Database:
└── supabase-setup.sql              # Complete SQL schema
```

---

## Navigation

### Admin Menu
The admin dashboard now includes:
- 💰 Financial Dashboard
- 👥 Client Management
- 🧾 Green Invoice Testing

### User Menu
The profile tab now has:
- Clickable plates balance card → Opens Plates Store

---

## Integration Points

### Automatic Plates Awards

To automatically award plates, integrate these calls:

**After Workout Completion:**
```typescript
import { PlatesManager } from '@/lib/plates-manager';

// In your workout completion handler
await PlatesManager.awardWorkoutPlates(userId, workoutId);
```

**After Class Attendance:**
```typescript
await PlatesManager.awardClassPlates(userId, classId);
```

**After Achievement Unlock:**
```typescript
await PlatesManager.awardAchievementPlates(userId, achievementName, points);
```

**In Shop Checkout (using plates discount):**
```typescript
const discount = PlatesManager.calculatePlatesDiscount(
  userBalance,
  purchaseAmount,
  platesUserWantsToUse
);

if (discount > 0) {
  await PlatesManager.usePlatesForDiscount(userId, discount, orderId);
}
```

---

## Database Schema

### plates_transactions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| amount | INTEGER | Plates amount (+ or -) |
| transaction_type | VARCHAR | 'earned', 'spent', 'bonus', 'refund' |
| source | VARCHAR | Source of transaction |
| description | TEXT | Transaction description |
| created_at | TIMESTAMP | Creation time |

### plates_discounts
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR | Discount code |
| discount_type | VARCHAR | 'percentage', 'fixed_amount', 'plates' |
| discount_value | DECIMAL | Value amount |
| min_purchase_amount | DECIMAL | Minimum purchase required |
| max_uses | INTEGER | Maximum redemptions |
| used_count | INTEGER | Times used |
| valid_from | TIMESTAMP | Start date |
| valid_until | TIMESTAMP | End date |
| is_active | BOOLEAN | Active status |

### green_invoice_clients
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| gi_client_id | VARCHAR | Green Invoice ID |
| name | VARCHAR | Client name |
| phone | VARCHAR | Phone number |
| email | VARCHAR | Email address |
| city | VARCHAR | City |
| synced_at | TIMESTAMP | Last sync time |

### green_invoice_documents
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| gi_document_id | VARCHAR | Green Invoice doc ID |
| document_type | VARCHAR | 'invoice', 'receipt', etc. |
| amount | DECIMAL | Amount in ILS |
| description | TEXT | Description |
| status | VARCHAR | 'paid', 'pending', 'cancelled' |
| payment_method | VARCHAR | Payment method |
| document_url | TEXT | PDF URL |
| created_at | TIMESTAMP | Creation time |

---

## Troubleshooting

### Issue: Charts not displaying

**Solution:**
```bash
npm install react-native-chart-kit --legacy-peer-deps
npx expo start --clear
```

### Issue: SQL script fails

**Possible causes:**
1. Tables already exist → Drop them first or modify the script
2. Missing profiles table → Create it first
3. RLS policy conflicts → Check existing policies

**Fix:**
```sql
-- Drop existing tables if needed
DROP TABLE IF EXISTS plates_transactions CASCADE;
DROP TABLE IF EXISTS plates_discounts CASCADE;
-- Then rerun the script
```

### Issue: Plates not updating

**Check:**
1. RLS policies are set correctly
2. User is authenticated
3. Service role permissions granted
4. PlatesManager functions called with correct parameters

### Issue: Green Invoice integration not working

**Check:**
1. Environment variables are set
2. Using correct environment (sandbox vs production)
3. API credentials are valid
4. useGreenInvoice hook is properly configured

---

## Next Steps

### 1. Health App Integration
Connect iOS HealthKit and Android Health Connect to award plates for external workouts.

### 2. Push Notifications
Set up notifications for:
- Plates earned
- Discount codes expiring
- Subscription renewals
- Class reminders

### 3. Auto Invoice Generation
Connect shop purchases to automatically create Green Invoice documents.

### 4. Analytics
Add more detailed analytics:
- Revenue forecasting
- Client lifetime value
- Popular class times
- Plates engagement metrics

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the SQL setup logs in Supabase
3. Check browser console for errors
4. Verify environment variables are loaded

---

## Summary

You now have:

✅ Complete financial dashboard with 4 screens
✅ Full client management system
✅ Working plates currency with rewards
✅ Green Invoice integration
✅ Discount code system
✅ Beautiful charts and analytics
✅ RTL Hebrew support
✅ Row Level Security enabled

**Ready to go!** 🚀

Start the app, test each feature, and enjoy your new powerful admin tools!
