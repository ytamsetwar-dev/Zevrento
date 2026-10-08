// =============================================
// Zevrento — Create Account Page
// =============================================
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { supabase } from '../lib/supabase.js'
import { IconUser, IconPhone, IconLock, IconZap, IconScooter } from '../components/Icons.jsx'
import { Footer } from '../components/Layout.jsx'

export default function SignupPage() {
  const [role, setRole] = useState(null) // 'CUSTOMER' or 'RIDER'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!firstName || !lastName || !mobile || !email || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)

    // 1. Supabase Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          phone: mobile,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Insert into Supabase profiles
    const { error: dbError } = await supabase.from('profiles').insert([
      {
        phone: mobile,
        full_name: `${firstName} ${lastName}`,
        role: role,
      }
    ])

    if (dbError && dbError.code !== '23505') { 
      console.error(dbError)
    }

    // Login locally
    login({
      id: mobile,
      name: `${firstName} ${lastName}`,
      phone: mobile,
      role: role,
      address: '',
    })

    if (role === 'RIDER') {
      navigate('/rider/dashboard', { replace: true })
    } else {
      navigate('/customer/home', { replace: true })
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-hero" style={{ marginBottom: '24px' }}>
        <div className="login-logo">
          <div className="login-logo-icon">
            <IconZap size={22} />
          </div>
          <span className="login-logo-text">Zevrento</span>
        </div>
      </div>

      <div className="login-card" style={{ maxWidth: '440px' }}>
        <h3 style={{ marginBottom: '8px' }}>Create Account</h3>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--z-text-muted)', marginBottom: '24px' }}>
          Join Zevrento today.
        </p>

        {!role ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', textAlign: 'center', marginBottom: '8px' }}>
              How would you like to use Zevrento?
            </p>
            <button 
              className="z-btn z-btn-outline" 
              style={{ height: '80px', justifyContent: 'flex-start', padding: '0 20px' }}
              onClick={() => setRole('CUSTOMER')}
            >
              <div style={{ background: 'var(--z-emerald-ultra-light)', padding: '10px', borderRadius: '50%', marginRight: '12px' }}>
                <IconZap size={24} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--z-text-primary)' }}>Rent EV</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>I want to rent and ride EVs</div>
              </div>
            </button>
            <button 
              className="z-btn z-btn-outline" 
              style={{ height: '80px', justifyContent: 'flex-start', padding: '0 20px' }}
              onClick={() => setRole('RIDER')}
            >
              <div style={{ background: 'var(--z-emerald-ultra-light)', padding: '10px', borderRadius: '50%', marginRight: '12px' }}>
                <IconScooter size={24} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--z-text-primary)' }}>Host EV</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>I want to list my idle EV and earn</div>
              </div>
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem' }}>
              Already have an account? <Link to="/" style={{ color: 'var(--z-emerald)', fontWeight: 600 }}>Login</Link>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--z-border)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--z-emerald)' }}>
                {role === 'RIDER' ? 'Host EV Account' : 'Rent EV Account'}
              </span>
              <button 
                type="button" 
                onClick={() => setRole(null)}
                style={{ fontSize: '0.75rem', color: 'var(--z-text-light)', textDecoration: 'underline' }}
              >
                Change
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="z-input-group">
                <label className="z-input-label">First Name</label>
                <input
                  className="z-input"
                  type="text"
                  placeholder="First"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="z-input-group">
                <label className="z-input-label">Last Name</label>
                <input
                  className="z-input"
                  type="text"
                  placeholder="Last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="z-input-group">
              <label className="z-input-label">Mobile Number</label>
              <div className="z-input-icon">
                <span className="icon"><IconPhone size={18} /></span>
                <input
                  className="z-input"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </div>

            <div className="z-input-group">
              <label className="z-input-label">Email ID</label>
              <div className="z-input-icon">
                <span className="icon"><IconUser size={18} /></span>
                <input
                  className="z-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="z-input-group">
              <label className="z-input-label">Create Password</label>
              <div className="z-input-icon">
                <span className="icon"><IconLock size={18} /></span>
                <input
                  className="z-input"
                  type="password"
                  placeholder="Enter a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="z-btn z-btn-primary z-btn-full z-btn-lg"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem' }}>
              Already have an account? <Link to="/" style={{ color: 'var(--z-emerald)', fontWeight: 600 }}>Login</Link>
            </div>
          </form>
        )}
      </div>
      
      <Footer />
    </div>
  )
}
