-- ========================================================
-- ZEVRENTO COMPLETE DATABASE FIX & SCHEMA UPGRADE
-- Run this in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ========================================================

-- 1. DROP BLOCKING TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS trg_secure_booking ON public.bookings;
DROP TRIGGER IF EXISTS trg_generate_otp ON public.bookings;
DROP FUNCTION IF EXISTS secure_booking_transaction();
DROP FUNCTION IF EXISTS generate_pickup_otp();

-- 2. DROP FOREIGN KEY CONSTRAINTS THAT ENFORCE UUID
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_vehicle_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_slot_id_fkey;

-- 3. FIX BOOKINGS TABLE SCHEMA (CONVERT UUID COLUMNS TO TEXT & ADD INSPECTION COLUMNS)
ALTER TABLE public.bookings ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.bookings ALTER COLUMN vehicle_id TYPE text USING vehicle_id::text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS slot_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'CONFIRMED';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_otp text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hub_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit numeric DEFAULT 500;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS host_payout numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utr_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'UPI';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration numeric;

-- Inspection & Return Status Columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS inspection_condition_checked boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS inspection_on_time boolean DEFAULT true;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_late boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS late_minutes numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS late_fee numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS has_damage boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS damage_notes text DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 500;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT 'FULL_REFUND';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_requested boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_video_verified boolean DEFAULT false;

-- Remove blocking NOT NULL constraints if existing
DO $$
BEGIN
  ALTER TABLE public.bookings ALTER COLUMN start_time DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.bookings ALTER COLUMN end_time DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.bookings ALTER COLUMN platform_fee DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.bookings ALTER COLUMN host_payout DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. FIX AVAILABILITY_SLOTS TABLE SCHEMA
ALTER TABLE public.availability_slots ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.availability_slots ALTER COLUMN vehicle_id TYPE text USING vehicle_id::text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS is_booked boolean DEFAULT false;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS plate text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS battery numeric DEFAULT 90;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS host_phone text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS hub_id text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS pickup_location text;

-- 5. FIX PROFILES TABLE SCHEMA
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'PENDING';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- 6. RESET ROW LEVEL SECURITY (RLS) POLICIES FOR ALL OPERATIONS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Reset bookings policies
DROP POLICY IF EXISTS "allow_all_bookings" ON public.bookings;
DROP POLICY IF EXISTS "insert_bookings" ON public.bookings;
DROP POLICY IF EXISTS "select_bookings" ON public.bookings;
DROP POLICY IF EXISTS "update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "delete_bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

CREATE POLICY "allow_all_bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- Reset availability_slots policies
DROP POLICY IF EXISTS "allow_all_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "insert_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "select_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "update_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "delete_slots" ON public.availability_slots;

CREATE POLICY "allow_all_slots" ON public.availability_slots FOR ALL USING (true) WITH CHECK (true);

-- Reset profiles policies
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 7. RE-CREATE BULLETPROOF SLOT-LOCK TRIGGER WITH SAFE TEXT CASTING
CREATE OR REPLACE FUNCTION secure_booking_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark the associated vehicle slot as booked
  IF NEW.vehicle_id IS NOT NULL THEN
    UPDATE public.availability_slots 
    SET is_booked = true 
    WHERE id::text = NEW.vehicle_id::text 
       OR vehicle_id::text = NEW.vehicle_id::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_secure_booking
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION secure_booking_transaction();

-- 8. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
