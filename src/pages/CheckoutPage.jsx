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

  const [bookingResult, setBookingResult] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(600) // 10 min
  const [tncAccepted, setTncAccepted] = useState(false)
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [paymentMode, setPaymentMode] = useState('FULL') // FULL or FEE
  const [paymentProcessing, setPaymentProcessing] = useState(false)

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

  const handleInitiatePayment = (mode) => {
    setPaymentMode(mode)
    setShowRazorpay(true)
  }

  const handleRazorpaySuccess = () => {
    setPaymentProcessing(true)
    
    // Step 1: Create booking as PENDING_PAYMENT
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
      utr_number: 'rzp_mock_' + Date.now(),
      payment_mode: paymentMode === 'FEE' ? 'BOOKING_FEE_ONLY' : 'FULL_PAYMENT',
      duration,
      status: 'PENDING_PAYMENT'
    })

    // Step 2: Simulate Webhook changing status to CONFIRMED
    setTimeout(() => {
      setBookingResult({ ...booking, status: 'CONFIRMED' })
      setPaymentProcessing(false)
      setBooked(true)
      setShowRazorpay(false)
    }, 2000)
  }

  const whatsappMessage = bookingResult
    ? encodeURIComponent(
        `🛵 *Zevrento Booking Confirmed!*\n\nBooking Token: ${bookingResult.booking_code}\nVehicle: ${vehicle.model}\nPickup Location: ${hub.name}\nPickup Time: ${formatDateTime(pickupTime)}\nDuration: ${duration}h\nPayment: ${paymentMode === 'FEE' ? '₹1000 Booking Fee Paid' : `₹${fare.total} Fully Paid`}\n\nThank you for choosing Zevrento!`
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

            {/* Post-Booking Instructions */}
            <div className="animate-fade-in-up stagger-3" style={{ textAlign: 'center', background: 'var(--z-emerald-ultra-light)', padding: '16px', borderRadius: '12px', color: 'var(--z-emerald-dark)', marginTop: '16px' }}>
              <IconShield size={28} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Payment Successful!</div>
              <div style={{ fontSize: '0.8125rem', marginTop: '4px', opacity: 0.9 }}>
                Your ride slot is locked. The host has been notified. 
                <br/>Proceed to the pickup location at your scheduled time.
              </div>
            </div>

            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn animate-fade-in-up stagger-3"
              style={{ textDecoration: 'none', display: 'flex', marginTop: '16px', justifyContent: 'center' }}
            >
              <IconWhatsApp size={22} />
              Share Booking Details via WhatsApp
            </a>
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
              <div className="checkout-section-title">Payment Options</div>

              <div className="z-card" style={{ marginBottom: '16px', background: 'var(--z-emerald-ultra-light)' }}>
                <div className="z-card-body" style={{ fontSize: '0.75rem', color: 'var(--z-text-primary)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>Terms & Conditions:</div>
                  <ul style={{ paddingLeft: '16px', margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Battery percentage & scooter health must be verified by customer and EV owner. Zevrento is not responsible.</li>
                    <li>As there is unlimited km, for battery swapping Zevrento and EV owner are not responsible.</li>
                    <li>If any damage is caused, the full deposit is non-refundable. Verify before and after ride.</li>
                  </ul>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={tncAccepted} 
                      onChange={(e) => setTncAccepted(e.target.checked)} 
                      style={{ marginTop: '2px', accentColor: 'var(--z-emerald)' }} 
                    />
                    <span style={{ fontWeight: 600 }}>I agree to the Terms & Conditions</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="z-btn z-btn-outline z-btn-full z-btn-lg"
                  onClick={() => handleInitiatePayment('FEE')}
                  disabled={timerSeconds === 0 || !tncAccepted}
                  style={{ display: 'flex', flexDirection: 'column', padding: '12px', height: 'auto', gap: '4px', background: '#F8FAFC' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <IconShield size={18} /> Pay ₹1,000 Booking Fee Now
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)', fontWeight: 500 }}>
                    Reserve slot instantly. Pay remaining ₹{fare.total - 1000} at pickup. (Bypasses UPI limits)
                  </span>
                </button>

                <button
                  className="z-btn z-btn-primary z-btn-full z-btn-lg"
                  onClick={() => handleInitiatePayment('FULL')}
                  disabled={timerSeconds === 0 || !tncAccepted}
                  style={{ display: 'flex', flexDirection: 'column', padding: '12px', height: 'auto', gap: '4px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    Pay Full Amount (₹{fare.total})
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>
                    Complete payment now via Cards/NetBanking/UPI
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RAZORPAY MOCK MODAL */}
      {showRazorpay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '380px',
            overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ background: '#02042B', padding: '20px', color: '#fff', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <IconZap size={20} /> Razorpay Test
              </h3>
              <div style={{ opacity: 0.8, fontSize: '0.875rem', marginTop: '4px' }}>Zevrento Rentals</div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Amount Payable</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
                  ₹{paymentMode === 'FEE' ? '1,000.00' : `${fare.total}.00`}
                </div>
              </div>

              {paymentProcessing ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div className="spinner" style={{
                    width: '32px', height: '32px', margin: '0 auto 16px',
                    border: '3px solid #E2E8F0', borderTopColor: '#3B82F6',
                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                  }} />
                  <div style={{ fontWeight: 600, color: '#334155' }}>Processing Payment...</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Waiting for Webhook confirmation</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    className="z-btn" 
                    style={{ background: '#22C55E', color: 'white', width: '100%', padding: '12px', fontWeight: 700 }}
                    onClick={handleRazorpaySuccess}
                  >
                    Simulate Successful Payment
                  </button>
                  <button 
                    className="z-btn z-btn-outline" 
                    style={{ width: '100%', padding: '12px', fontWeight: 600 }}
                    onClick={() => setShowRazorpay(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
