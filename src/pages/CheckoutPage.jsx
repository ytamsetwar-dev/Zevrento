// =============================================
// Zevrento — Checkout & Fare Breakdown
// Transparent pricing, UPI payment, WhatsApp KYC
// =============================================
import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { formatDateTime, PRICING } from '../lib/data.js'
import { PageShell } from '../components/Layout.jsx'
import { IconMapPin, IconClock, IconCheck, IconWhatsApp, IconShield, IconZap } from '../components/Icons.jsx'

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { createBooking, user } = useApp()
  const state = location.state

  const [utr, setUtr] = useState('')
  const [selectedUPI, setSelectedUPI] = useState(null)
  const [booked, setBooked] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(600) // 10 min

  // Redirect if no state
  useEffect(() => {
    if (!state) navigate('/customer/home', { replace: true })
  }, [state, navigate])

  // Anti-collision timer
  useEffect(() => {
    if (booked) return
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [booked])

  const formatTimer = useCallback((s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }, [])

  if (!state) return null

  const { vehicle, hub, pickupTime, dropoffTime, duration, fare } = state

  const handleConfirmBooking = () => {
    if (!utr.trim() || utr.trim().length < 10) return

    const booking = createBooking({
      customer_phone: user?.phone || '',
      vehicle_id: vehicle.id,
      vehicle_model: vehicle.model,
      hub_name: hub.name,
      start_time: pickupTime,
      end_time: dropoffTime,
      total_amount: fare.total,
      deposit: fare.deposit,
      platform_fee: fare.platformFeeTotal,
      host_payout: fare.hostPayoutTotal,
      utr_number: utr.trim(),
      duration,
    })

    setBookingResult(booking)
    setBooked(true)
  }

  const whatsappMessage = bookingResult
    ? encodeURIComponent(
        `🛵 *Zevrento KYC Verification*\n\nBooking Token: ${bookingResult.booking_code}\nVehicle: ${vehicle.model}\nHub: ${hub.name}\nPickup: ${formatDateTime(pickupTime)}\nDuration: ${duration}h\nUTR: ${utr}\n\nPlease share or Attached in this message below :\n1️⃣ Driving License (both sides)\n2️⃣ Aadhaar Card\n3️⃣ Selfie photo`
      )
    : ''

  if (booked && bookingResult) {
    return (
      <PageShell title="Booking Confirmed" showBack onBack={() => navigate('/customer/home')}>
        <div className="checkout-page" style={{ padding: '24px 16px' }}>
          <div className="z-container">
            <div style={{ textAlign: 'center', marginBottom: '32px' }} className="animate-fade-in-up">
              <div style={{
                width: '64px', height: '64px',
                background: 'var(--z-emerald-light)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <IconCheck size={32} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <h2>Slot Locked!</h2>
              <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
                Complete KYC on WhatsApp to confirm your ride
              </p>
            </div>

            {/* Booking Token */}
            <div className="z-card animate-fade-in-up stagger-1" style={{ marginBottom: '16px' }}>
              <div className="z-card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Booking Token
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  fontFamily: "'Courier New', monospace",
                  color: 'var(--z-emerald)',
                  marginTop: '4px',
                  letterSpacing: '0.05em',
                }}>
                  {bookingResult.booking_code}
                </div>
                <div className="z-badge z-badge-warning" style={{ marginTop: '8px' }}>
                  Status: PENDING KYC
                </div>
              </div>
            </div>

            {/* Trip details */}
            <div className="z-card animate-fade-in-up stagger-2" style={{ marginBottom: '16px' }}>
              <div className="z-card-body">
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Trip Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Vehicle</span>
                    <span style={{ fontWeight: 600 }}>{vehicle.model}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Hub</span>
                    <span style={{ fontWeight: 600 }}>{hub.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Pickup</span>
                    <span style={{ fontWeight: 600 }}>{formatDateTime(pickupTime)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Drop-off</span>
                    <span style={{ fontWeight: 600 }}>{formatDateTime(dropoffTime)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Total Paid</span>
                    <span style={{ fontWeight: 800, color: 'var(--z-emerald)', fontSize: '1rem' }}>₹{fare.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA or Verified State */}
            {!user?.kyc_verified ? (
              <>
                <a
                  href={`https://wa.me/917020905724?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn animate-fade-in-up stagger-3"
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  <IconWhatsApp size={22} />
                  Submit KYC & Lock Ride on WhatsApp
                </a>
                <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--z-text-light)', marginTop: '12px' }}>
                  Share your DL, Aadhaar, and selfie on WhatsApp to verify identity. No media is stored on our servers.
                </p>
              </>
            ) : (
              <div className="animate-fade-in-up stagger-3" style={{ textAlign: 'center', background: 'var(--z-emerald-ultra-light)', padding: '16px', borderRadius: '12px', color: 'var(--z-emerald-dark)', marginTop: '16px' }}>
                <IconShield size={28} style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>KYC Already Verified</div>
                <div style={{ fontSize: '0.8125rem', marginTop: '4px', opacity: 0.9 }}>
                  Your ride slot is locked. The hub operator will verify your UTR and assign your vehicle.
                </div>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Checkout" showBack>
      <div className="checkout-page" style={{ padding: '16px' }}>
        <div className="z-container">

          {/* Anti-Collision Timer */}
          {timerSeconds > 0 ? (
            <div className="timer-bar animate-fade-in" style={{ marginBottom: '16px' }}>
              <IconClock size={16} />
              <span>Slot held for</span>
              <span className="time">{formatTimer(timerSeconds)}</span>
            </div>
          ) : (
            <div className="timer-bar" style={{ marginBottom: '16px', background: '#FEE2E2', borderColor: '#FECACA', color: '#991B1B' }}>
              <span>⏰ Slot reservation expired. Please restart.</span>
            </div>
          )}

          {/* Trip Details */}
          <div className="checkout-section animate-fade-in-up">
            <div className="checkout-section-title">Trip Details</div>
            <div className="z-card">
              <div className="z-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <IconMapPin size={16} style={{ color: 'var(--z-emerald)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{hub.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
                  <div>
                    <div className="text-muted text-xs">Pickup</div>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{formatDateTime(pickupTime)}</div>
                  </div>
                  <div>
                    <div className="text-muted text-xs">Drop-off</div>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{formatDateTime(dropoffTime)}</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginTop: '12px', padding: '8px 12px',
                  background: 'var(--z-emerald-ultra-light)',
                  borderRadius: 'var(--z-radius-sm)',
                  fontSize: '0.8125rem', fontWeight: 600, color: 'var(--z-emerald-dark)',
                }}>
                  <IconClock size={14} />
                  {duration} hour{duration !== 1 ? 's' : ''} • {vehicle.model}
                </div>
              </div>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="checkout-section animate-fade-in-up stagger-1">
            <div className="checkout-section-title">Fare Breakdown</div>
            <div className="z-card">
              <div className="z-card-body">
                <div className="fare-row">
                  <span className="label">Base Rental Fee ({duration}h × ₹{PRICING.baseRate}/hr)</span>
                  <span className="value">₹{fare.rental}</span>
                </div>
                <div className="fare-note">
                  Platform & Maintenance Fee: ₹{PRICING.platformFee}/hr — Included in base rate
                </div>

                <div className="z-divider-dashed" style={{ margin: '8px 0' }} />

                <div className="fare-row">
                  <span className="label">Refundable Security Deposit</span>
                  <span className="value">₹{fare.deposit}</span>
                </div>
                <div className="fare-note">
                  100% refundable instantly via UPI upon vehicle return
                </div>

                <div className="fare-row total">
                  <span className="label" style={{ fontWeight: 700 }}>Total Amount Payable</span>
                  <span className="value">₹{fare.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KYC Check & Payment Section */}
          {!user?.kyc_verified ? (
            <div className="checkout-section animate-fade-in-up stagger-2">
              <div className="checkout-section-title">Identity Verification Required</div>
              <div className="z-card" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                <div className="z-card-body" style={{ textAlign: 'center' }}>
                  <IconShield size={32} style={{ color: '#DC2626', marginBottom: '12px' }} />
                  <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '1rem' }}>KYC Pending</div>
                  <div style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: '6px', marginBottom: '20px', lineHeight: 1.5 }}>
                    You must complete your KYC verification to unlock payments and lock this slot.
                  </div>
                  <button 
                    className="z-btn z-btn-primary z-btn-full" 
                    onClick={() => navigate('/customer/profile')}
                    style={{ background: '#DC2626' }}
                  >
                    Go to Profile & Verify
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="checkout-section animate-fade-in-up stagger-2">
              <div className="checkout-section-title">Payment via UPI</div>

              <div className="upi-buttons">
                {['GPay', 'PhonePe', 'Paytm'].map((app) => {
                  const upiId = 'ytamsetwar-2@okaxis'
                  const payeeName = 'YASH TAMSETWAR'
                  const transactionNote = encodeURIComponent(`Zevrento Booking ${vehicle?.model || ''}`)
                  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${fare.total}&cu=INR&tn=${transactionNote}`

                  return (
                    <a
                      key={app}
                      href={upiUrl}
                      className={`upi-btn ${selectedUPI === app ? 'selected' : ''}`}
                      onClick={() => setSelectedUPI(app)}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {app}
                    </a>
                  )
                })}
              </div>

              <div className="z-input-group" style={{ marginBottom: '16px' }}>
                <label className="z-input-label">12-Digit UTR / Transaction Reference</label>
                <input
                  className="z-input"
                  type="text"
                  placeholder="Enter UTR number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                  maxLength={12}
                  inputMode="numeric"
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)' }}>
                  Find this in your UPI app's transaction history
                </span>
              </div>

              <button
                className="z-btn z-btn-primary z-btn-full z-btn-lg"
                onClick={handleConfirmBooking}
                disabled={utr.trim().length < 10 || timerSeconds === 0}
              >
                <IconShield size={18} />
                Confirm & Lock Slot
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
