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
  { id: 'area1', name: 'Ameerpet', address: 'Ameerpet Metro Station, Hyderabad' },
  { id: 'area2', name: 'Begumpet', address: 'Begumpet, Hyderabad' },
  { id: 'area3', name: 'Yellareddygudda', address: 'Yellareddygudda, Hyderabad' },
  { id: 'area4', name: 'Hitech City', address: 'Hitech City Metro, Hyderabad' },
  { id: 'area5', name: 'Madhapur', address: 'Madhapur Junction, Hyderabad' },
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
// MULTI-TIER PRICING & SUBSCRIPTION ENGINE
// =============================================

// A. On-Demand Hourly & Daily Passes
export const HOURLY_TIERS = [
  {
    hours: 1,
    id: '1_HR',
    label: '1 Hr',
    name: 'Micro Slot',
    price: 99,
    hostPayout: 69,
    platformCut: 30,
    ratePerHour: 99,
    badge: null,
  },
  {
    hours: 3,
    id: '3_HR',
    label: '3 Hrs',
    name: 'Quick Pass',
    price: 219,
    hostPayout: 150,
    platformCut: 69,
    ratePerHour: 73,
    badge: null,
  },
  {
    hours: 6,
    id: '6_HR',
    label: '6 Hrs',
    name: 'Half-Day Pass',
    price: 299,
    hostPayout: 210,
    platformCut: 89,
    ratePerHour: 50,
    badge: 'Most Popular - ₹50/hr',
  },
  {
    hours: 12,
    id: '12_HR',
    label: '12 Hrs',
    name: 'Day-Shift Pass',
    price: 399,
    hostPayout: 279,
    platformCut: 120,
    ratePerHour: 33,
    badge: 'Best for Shifts - ₹33/hr',
  },
  {
    hours: 24,
    id: '24_HR',
    label: '24 Hrs',
    name: 'Full Day',
    price: 499,
    hostPayout: 349,
    platformCut: 150,
    ratePerHour: 21,
    badge: 'Best Value - ₹21/hr',
  },
]

// B. Weekly Recurring Subscription Passes
export const WEEKLY_SUBSCRIPTIONS = [
  {
    id: 'WEEKLY_6HR',
    name: 'Commuter Pass (6-Hr Daily)',
    shortName: 'Commuter Pass',
    code: '6-HR COMMUTER',
    dailyHoursText: '6 Hours / Day',
    hoursPerDay: 6,
    price: 1699,
    hostPayout: 1200,
    platformCut: 499,
    effectivePerDay: 243,
    deposit: 0, // Waived / credited for subscriptions
    description: 'Perfect for daily college or office commute (e.g. 9 AM - 3 PM or 1 PM - 7 PM).',
    badge: 'Popular for Daily Commute',
    whatsappText: 'Hello Zevrento, I want to subscribe to the Weekly Commuter Pass (6-Hr Daily @ ₹1,699/week).'
  },
  {
    id: 'WEEKLY_12HR',
    name: 'Gig/Delivery Shift Pass (12-Hr Daily)',
    shortName: 'Shift Pass',
    code: '12-HR SHIFT',
    dailyHoursText: '12 Hours / Day',
    hoursPerDay: 12,
    price: 2299,
    hostPayout: 1650,
    platformCut: 649,
    effectivePerDay: 328,
    deposit: 0,
    description: 'Ideal for Zomato, Swiggy, Zepto & Blinkit full delivery shifts.',
    badge: 'Best for Delivery Riders',
    whatsappText: 'Hello Zevrento, I want to subscribe to the Weekly Gig/Delivery Shift Pass (12-Hr Daily @ ₹2,299/week).'
  },
  {
    id: 'WEEKLY_24HR',
    name: '24/7 Dedicated Weekly Lease',
    shortName: 'Dedicated Lease',
    code: '24/7 LEASE',
    dailyHoursText: '24/7 Unlimited',
    hoursPerDay: 24,
    price: 2799,
    hostPayout: 2000,
    platformCut: 799,
    effectivePerDay: 400,
    deposit: 0,
    description: 'Keep the vehicle 24/7 for all 7 days with home & hub charging support.',
    badge: 'Maximum Freedom',
    whatsappText: 'Hello Zevrento, I want to subscribe to the 24/7 Dedicated Weekly Lease (@ ₹2,799/week).'
  },
]

export const PRICING = {
  baseRate: 99,
  hostPayout: 69,
  platformFee: 30,
  deposit: 500,
  tiers: HOURLY_TIERS,
  subscriptions: WEEKLY_SUBSCRIPTIONS,
}

// Calculates exact tiered rental fare with non-standard duration scaling
export function calculateTieredFare(durationHours) {
  const d = Math.max(1, Math.round(durationHours || 1))

  // 1. Exact tier match
  const exact = HOURLY_TIERS.find((t) => t.hours === d)
  if (exact) {
    return {
      planId: exact.id,
      planName: `${exact.name} (${exact.hours}h)`,
      planType: 'HOURLY',
      isSubscription: false,
      durationHours: d,
      rental: exact.price,
      hostPayoutTotal: exact.hostPayout,
      platformFeeTotal: exact.platformCut,
      deposit: PRICING.deposit,
      total: exact.price + PRICING.deposit,
      ratePerHour: exact.ratePerHour,
      badge: exact.badge,
    }
  }

  // 2. Non-standard duration: scale using the lower tier's effective rate
  const sorted = [...HOURLY_TIERS].sort((a, b) => b.hours - a.hours)
  const lowerTier = sorted.find((t) => t.hours < d) || HOURLY_TIERS[0]

  const unitRate = lowerTier.price / lowerTier.hours
  const unitHost = lowerTier.hostPayout / lowerTier.hours
  const unitPlat = lowerTier.platformCut / lowerTier.hours

  const rental = Math.round(unitRate * d)
  const hostPayoutTotal = Math.round(unitHost * d)
  const platformFeeTotal = rental - hostPayoutTotal

  return {
    planId: `${d}_HR_CUSTOM`,
    planName: `${d}-Hour Flex Pass`,
    planType: 'HOURLY',
    isSubscription: false,
    durationHours: d,
    rental,
    hostPayoutTotal,
    platformFeeTotal,
    deposit: PRICING.deposit,
    total: rental + PRICING.deposit,
    ratePerHour: Math.round(unitRate),
    badge: null,
  }
}

// Unified Fare Calculator supporting both Hourly Passes & Weekly Subscriptions
export function calculateFare(durationHours, planType = 'HOURLY', subscriptionId = null) {
  if (planType === 'SUBSCRIPTION' && subscriptionId) {
    const sub = WEEKLY_SUBSCRIPTIONS.find((s) => s.id === subscriptionId) || WEEKLY_SUBSCRIPTIONS[0]
    return {
      planId: sub.id,
      planName: sub.name,
      planType: 'SUBSCRIPTION',
      isSubscription: true,
      durationHours: sub.hoursPerDay * 7,
      rental: sub.price,
      platformFeeTotal: sub.platformCut,
      hostPayoutTotal: sub.hostPayout,
      deposit: sub.deposit, // 0 for weekly subscriptions per spec
      total: sub.price + sub.deposit,
      effectivePerDay: sub.effectivePerDay,
      dailyHoursText: sub.dailyHoursText,
      perHour: Math.round(sub.price / (sub.hoursPerDay * 7)),
      badge: sub.badge,
    }
  }

  return calculateTieredFare(durationHours)
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
