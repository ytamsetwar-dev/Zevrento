// =============================================
// Zevrento — Supabase Client & Auth Config
// =============================================
import { createClient } from '@supabase/supabase-js'

// Supabase configuration (replace with your project credentials)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eadilmpxzwhtushksgtw.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iRaCFFAdu_vopIgejFqByQ_r5VNWe-o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// =============================================
// HIDDEN ADMIN CREDENTIALS (Config-Driven)
// =============================================
export const ADMIN_CREDENTIALS = {
  id: 'admin@zevrento',
  password: 'Yash@150603',
}

// =============================================
// Demo Profiles (fallback when Supabase is not configured)
// =============================================
export const DEMO_PROFILES = [
  { phone: '9876543210', password: '1234', full_name: 'Priya Sharma', role: 'CUSTOMER' },
  { phone: '9123456789', password: '5678', full_name: 'Rahul Verma', role: 'RIDER' },
]

// =============================================
// Auth helpers
// =============================================
export function checkAdminCredentials(userId, password) {
  return userId === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password
}

export function checkDemoProfile(userId, password) {
  return DEMO_PROFILES.find(
    (p) => (p.phone === userId) && p.password === password
  )
}
