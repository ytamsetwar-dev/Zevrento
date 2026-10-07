-- =============================================
-- Zevrento — Supabase Schema (PostgreSQL)
-- Zero-cost architecture: Free tier compatible
-- Zero media storage: KYC via WhatsApp threads
-- =============================================

-- ============================
-- PROFILES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('CUSTOMER', 'RIDER', 'ADMIN')),
  kyc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- VEHICLES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model VARCHAR(100) NOT NULL,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  owner_type VARCHAR(12) NOT NULL CHECK (owner_type IN ('OWN', 'RIDER_HOST')),
  host_phone VARCHAR(15),
  battery_percent SMALLINT DEFAULT 100 CHECK (battery_percent >= 0 AND battery_percent <= 100),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'in_use', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- AVAILABILITY SLOTS TABLE
-- (Rider hosts publish idle windows)
-- ============================
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- ============================
-- BOOKINGS TABLE
-- Core rental transaction record
-- ============================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(10) NOT NULL UNIQUE,
  customer_phone VARCHAR(15) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  slot_id UUID REFERENCES availability_slots(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) DEFAULT 500.00,
  platform_fee DECIMAL(10,2) NOT NULL,
  host_payout DECIMAL(10,2) NOT NULL,
  utr_number VARCHAR(20),
  payment_mode VARCHAR(20) DEFAULT 'UPI',
  pickup_otp VARCHAR(4),
  status VARCHAR(20) DEFAULT 'PENDING_PAYMENT' CHECK (
    status IN ('PENDING_PAYMENT', 'PENDING_KYC', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED')
  ),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_availability_vehicle ON availability_slots(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_availability_time ON availability_slots(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can insert, read, and update (Simplified for Auth Flow)
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON profiles FOR UPDATE USING (true);

-- Vehicles: All authenticated users can view
CREATE POLICY "All users can view vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

-- Availability slots: All authenticated users can view
CREATE POLICY "All users can view slots"
  ON availability_slots FOR SELECT
  TO authenticated
  USING (true);

-- Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (customer_phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- ============================
-- SEED DATA
-- ============================
INSERT INTO profiles (phone, full_name, role) VALUES
  ('9876543210', 'Priya Sharma', 'CUSTOMER'),
  ('9123456789', 'Rahul Verma', 'RIDER')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO vehicles (model, plate_number, owner_type, battery_percent, status) VALUES
  ('Bounce Infinity E1', 'TS 09 EV 1234', 'OWN', 96, 'available'),
  ('Ather 450X', 'TS 09 EV 5678', 'RIDER_HOST', 88, 'available'),
  ('Ola S1 Pro', 'TS 09 EV 9012', 'OWN', 92, 'available'),
  ('TVS iQube', 'TS 09 EV 3456', 'RIDER_HOST', 85, 'available'),
  ('Bajaj Chetak', 'TS 09 EV 7890', 'OWN', 91, 'available'),
  ('Hero Vida V1', 'TS 09 EV 2345', 'OWN', 94, 'available')
ON CONFLICT (plate_number) DO NOTHING;
