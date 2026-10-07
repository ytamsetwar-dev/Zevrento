// =============================================
// Zevrento — Universal Login Screen
// Single-door auth: zero admin footprint.
// Hidden admin routing via hardcoded credentials.
// =============================================
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { checkAdminCredentials, checkDemoProfile, supabase } from '../lib/supabase.js'
import { IconPhone, IconLock, IconZap } from '../components/Icons.jsx'
import { Footer } from '../components/Layout.jsx'

export default function LoginPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!userId.trim() || !password.trim()) {
      setError('Please enter your Email ID and password.')
      return
    }

    // Prevent users from trying to log in with mobile number if they created an account with email
    if (/^\d{10}$/.test(userId.trim()) && !checkAdminCredentials(userId.trim(), password.trim()) && !checkDemoProfile(userId.trim(), password.trim())) {
      setError('Please use your Email ID to log in, not your mobile number.')
      return
    }

    setLoading(true)

    // Simulate brief network delay
    await new Promise((r) => setTimeout(r, 600))

    // 1. HIDDEN ADMIN CHECK — zero UI footprint
    if (checkAdminCredentials(userId.trim(), password.trim())) {
      login({ id: 'admin', name: 'Hub Operator', phone: '', role: 'ADMIN' })
      navigate('/admin/hub-panel', { replace: true })
      return
    }

    // 2. DEMO / SUPABASE AUTH CHECK
    let profile = checkDemoProfile(userId.trim(), password.trim())

    if (!profile) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userId.trim(),
        password: password.trim(),
      })
      
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      const userPhone = authData?.user?.user_metadata?.phone

      if (userPhone) {
        const { data } = await supabase.from('profiles').select('*').eq('phone', userPhone).single()
        if (data) profile = data
      }
    }
    if (profile) {
      login({
        id: profile.phone,
        name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
      })

      if (profile.role === 'RIDER') {
        navigate('/rider/dashboard', { replace: true })
      } else {
        navigate('/customer/home', { replace: true })
      }
      return
    }

    // 3. Fallback: Invalid credentials
    setError('Invalid credentials. Please check and try again.')
    setLoading(false)
  }

  return (
    <div className="login-wrapper">
      {/* ---- HERO BRANDING ---- */}
      <div className="login-hero">
        <div className="login-logo">
          <div className="login-logo-icon">
            <IconZap size={22} />
          </div>
          <span className="login-logo-text">Zevrento</span>
        </div>
        <p className="login-tagline">Rent EV scooters by the hour • Zero emissions</p>
      </div>

      {/* ---- LOGIN CARD ---- */}
      <div className="login-card">
        <h3>Welcome Back</h3>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="z-input-group">
            <label className="z-input-label" htmlFor="login-userid">
              Email ID
            </label>
            <div className="z-input-icon">
              <span className="icon"><IconPhone size={18} /></span>
              <input
                id="login-userid"
                className="z-input"
                type="text"
                placeholder="e.g. your@email.com"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="z-input-group">
            <label className="z-input-label" htmlFor="login-password">
              Password or PIN
            </label>
            <div className="z-input-icon">
              <span className="icon"><IconLock size={18} /></span>
              <input
                id="login-password"
                className="z-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="z-btn z-btn-primary z-btn-full z-btn-lg"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                  display: 'inline-block',
                }} />
                Signing in…
              </span>
            ) : (
              'Sign In / Continue'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--z-emerald)', fontWeight: 600 }}>Create Account</Link>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
