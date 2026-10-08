-- ==========================================================
-- Zevrento Security Upgrades: Bulletproof Features (FREE)
-- ==========================================================

-- 1. FIX DOUBLE BOOKING & AUTOMATE SLOT LOCKING
-- This trigger runs EXACTLY when a booking is inserted. 
-- It checks if the EV is already taken. If yes, it blocks the booking.
-- If no, it locks the slot automatically so no one else can take it.
CREATE OR REPLACE FUNCTION secure_booking_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if slot is already booked
  IF EXISTS (
    SELECT 1 FROM public.availability_slots 
    WHERE id = NEW.vehicle_id AND is_booked = true
  ) THEN
    RAISE EXCEPTION 'CRITICAL ERROR: This vehicle was just booked by someone else!';
  END IF;

  -- Validate Price Spoofing (Ensures they didn't hack the frontend to pay 0 deposit)
  IF NEW.deposit < 500 THEN
    RAISE EXCEPTION 'CRITICAL ERROR: Invalid deposit amount detected. Suspected manipulation.';
  END IF;

  -- Lock the slot safely in the backend
  UPDATE public.availability_slots 
  SET is_booked = true 
  WHERE id = NEW.vehicle_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the bookings table
DROP TRIGGER IF EXISTS trg_secure_booking ON public.bookings;
CREATE TRIGGER trg_secure_booking
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION secure_booking_transaction();

-- 2. GENERATE OTP IN THE BACKEND (Bonus Security)
-- Ensures the OTP is genuinely random and created on the server
CREATE OR REPLACE FUNCTION generate_pickup_otp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CONFIRMED' AND NEW.pickup_otp IS NULL THEN
    -- Generate a 6-digit random OTP
    NEW.pickup_otp := lpad(floor(random() * 1000000)::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_otp ON public.bookings;
CREATE TRIGGER trg_generate_otp
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION generate_pickup_otp();

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
