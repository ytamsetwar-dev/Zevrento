-- Fix Bookings Table (Add all missing columns that cause inserts to fail)
ALTER TABLE public.bookings ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_otp text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hub_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS host_payout numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utr_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_mode text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration numeric;

-- Fix Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
