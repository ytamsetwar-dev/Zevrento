// =============================================
// Zevrento — Mock Data Store
// Vehicle fleet, bookings, and slot management
// =============================================

// =============================================
// EV FLEET CATALOG
// =============================================
export const VEHICLES = [
  {
    id: 'v1',
    model: 'Bounce Infinity E1',
    plate: 'TS 09 EV 1234',
    owner_type: 'OWN',
    battery: 96,
    status: 'available',
    rate: 99,
    image: null,
    color: '#4F46E5',
    tags: ['100% Battery Included', '₹0 Onboarding Fee', 'Instant Refundable Deposit: ₹500'],
  },
  {
    id: 'v2',
    model: 'Ather 450X',
    plate: 'TS 09 EV 5678',
    owner_type: 'RIDER_HOST',
    host_phone: '9123456789',
    battery: 88,
    status: 'available',
    rate: 99,
    image: null,
    color: '#059669',
    tags: ['Fast Charging', 'Smart Dashboard', '₹0 Onboarding Fee'],
  },
  {
    id: 'v3',
    model: 'Ola S1 Pro',
    plate: 'TS 09 EV 9012',
    owner_type: 'OWN',
    battery: 92,
    status: 'available',
    rate: 99,
    image: null,
    color: '#0891B2',
    tags: ['Hyper Mode', 'Full Charge Range: 135 km', 'Instant Refundable Deposit: ₹500'],
  },
  {
    id: 'v4',
    model: 'TVS iQube',
    plate: 'TS 09 EV 3456',
    owner_type: 'RIDER_HOST',
    host_phone: '9123456789',
    battery: 85,
    status: 'available',
    rate: 99,
    image: null,
    color: '#7C3AED',
    tags: ['SmartXonnect', 'Navigation Ready', '₹0 Onboarding Fee'],
  },
  {
    id: 'v5',
    model: 'Bajaj Chetak',
    plate: 'TS 09 EV 7890',
    owner_type: 'OWN',
    battery: 91,
    status: 'available',
    rate: 99,
    image: null,
    color: '#DC2626',
    tags: ['Premium Build', 'IP67 Battery', 'Instant Refundable Deposit: ₹500'],
  },
  {
    id: 'v6',
    model: 'Hero Vida V1',
    plate: 'TS 09 EV 2345',
    owner_type: 'OWN',
    battery: 94,
    status: 'available',
    rate: 99,
    image: null,
    color: '#EA580C',
    tags: ['Removable Battery', 'Connected Features', '₹0 Onboarding Fee'],
  },
]

// =============================================
// HUBS
// =============================================
export const HUBS = [
  { id: 'hub1', name: 'Central Hub — Ameerpet', address: 'Zevrento Station, Ameerpet Metro Exit 2, Hyderabad' },
  { id: 'hub2', name: 'Tech Hub — Gachibowli', address: 'Zevrento Point, DLF Cyber City, Gachibowli' },
  { id: 'hub3', name: 'City Hub — Secunderabad', address: 'Zevrento Dock, Clock Tower Junction, Secunderabad' },
]

// =============================================
// BOOKING STATUS ENUM
// =============================================
export const BOOKING_STATUS = {
  PENDING_KYC: 'PENDING_KYC',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
}

// =============================================
// GENERATE BOOKING TOKEN
// =============================================
export function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `#BK-${code}`
}

// =============================================
// GENERATE OTP
// =============================================
export function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// =============================================
// PRICING ENGINE
// =============================================
export const PRICING = {
  baseRate: 99,        // ₹/hr
  platformFee: 29,     // ₹/hr (included in base)
  hostPayout: 70,      // ₹/hr
  deposit: 500,        // Refundable
}

export function calculateFare(durationHours) {
  const rental = PRICING.baseRate * durationHours
  const platformFeeTotal = PRICING.platformFee * durationHours
  const hostPayoutTotal = PRICING.hostPayout * durationHours
  const total = rental + PRICING.deposit

  return {
    rental,
    platformFeeTotal,
    hostPayoutTotal,
    deposit: PRICING.deposit,
    total,
    durationHours,
    perHour: PRICING.baseRate,
  }
}

// =============================================
// TIME HELPERS
// =============================================
export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function getHoursDiff(start, end) {
  if (!start || !end) return 0
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60)
  return Math.max(1, Math.ceil(diff))
}

export function roundToNextHour(date) {
  const d = new Date(date)
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}

export function addHours(date, hours) {
  const d = new Date(date)
  d.setHours(d.getHours() + hours)
  return d
}

export function toInputDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
