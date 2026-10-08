-- Fix Bookings Table (Add missing columns that cause inserts to fail)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utr_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS host_payout numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_mode text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration numeric;

-- Fix Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
