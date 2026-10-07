CREATE TABLE IF NOT EXISTS public.bookings (
    id text PRIMARY KEY,
    booking_code text,
    status text,
    pickup_otp text,
    created_at timestamp with time zone,
    expires_at timestamp with time zone,
    customer_phone text,
    vehicle_id text,
    vehicle_model text,
    hub_name text,
    start_time text,
    end_time text,
    total_amount numeric,
    deposit numeric,
    platform_fee numeric,
    host_payout numeric,
    utr_number text,
    payment_mode text DEFAULT 'UPI',
    duration numeric
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
    id text PRIMARY KEY,
    is_booked boolean DEFAULT false,
    created_at timestamp with time zone,
    vehicle_id text,
    model text,
    plate text,
    battery numeric,
    host_phone text,
    start_time text,
    end_time text,
    hub_id text,
    pickup_location text
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_bookings" ON public.bookings;
DROP POLICY IF EXISTS "select_bookings" ON public.bookings;
DROP POLICY IF EXISTS "update_bookings" ON public.bookings;

CREATE POLICY "insert_bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "select_bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "update_bookings" ON public.bookings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "insert_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "select_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "update_slots" ON public.availability_slots;

CREATE POLICY "insert_slots" ON public.availability_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "select_slots" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "update_slots" ON public.availability_slots FOR UPDATE USING (true);
CREATE POLICY "delete_slots" ON public.availability_slots FOR DELETE USING (true);
    
-- Fix Profiles Login Bug
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.profiles;

CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.profiles FOR DELETE USING (true);

-- Fix Availability Slots Bug (missing columns)
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS hub_id text;
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS pickup_location text;

-- Phase 1 Schema Updates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'PENDING';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'UPI';
