// =============================================
// Zevrento — Shared Layout Components
// Header, BottomNav, Footer, PageShell
// =============================================
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { IconHome, IconList, IconUser, IconLogOut, IconScooter, IconShield, IconSettings } from './Icons.jsx'

// ---- HEADER ----
export function Header({ title, showBack, onBack }) {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="z-header">
      <div className="z-header-inner">
        {showBack ? (
          <button
            className="z-btn-ghost"
            onClick={onBack || (() => navigate(-1))}
            style={{ padding: '8px', borderRadius: '8px' }}
            aria-label="Go back"
          >
            ←
          </button>
        ) : (
          <div className="z-logo">
            <div className="z-logo-icon">Z</div>
            <span>{title || 'Zevrento'}</span>
          </div>
        )}

        {showBack && (
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</span>
        )}

        <div className="z-header-actions">
          {user && (
            <button
              className="z-btn-ghost"
              onClick={handleLogout}
              style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
              aria-label="Logout"
            >
              <IconLogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// ---- CUSTOMER BOTTOM NAV ----
export function CustomerBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { path: '/customer/home', icon: IconHome, label: 'Home' },
    { path: '/customer/bookings', icon: IconList, label: 'Bookings' },
    { path: '/customer/profile', icon: IconUser, label: 'Profile' },
  ]

  return (
    <nav className="z-bottom-nav">
      <div className="z-bottom-nav-inner">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              className={`z-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <span className="z-nav-item-icon">
                <item.icon size={20} />
              </span>
              <span className="z-nav-item-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ---- RIDER BOTTOM NAV ----
export function RiderBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { path: '/rider/dashboard', icon: IconHome, label: 'Dashboard' },
    { path: '/rider/list-ev', icon: IconScooter, label: 'List EV' },
    { path: '/rider/profile', icon: IconUser, label: 'Profile' },
  ]

  return (
    <nav className="z-bottom-nav">
      <div className="z-bottom-nav-inner">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              className={`z-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <span className="z-nav-item-icon">
                <item.icon size={20} />
              </span>
              <span className="z-nav-item-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ---- FOOTER ----
export function Footer() {
  return (
    <footer className="z-footer">
      Zevrento • Powered by Coderware Technologies
    </footer>
  )
}

// ---- PAGE SHELL ----
export function PageShell({ children, nav, title, showBack, onBack }) {
  return (
    <div className="z-page">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main className="z-page-content">{children}</main>
      {nav}
      <Footer />
    </div>
  )
}
