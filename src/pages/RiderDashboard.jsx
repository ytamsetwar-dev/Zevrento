import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { PRICING, formatDateTime, calculateTieredFare } from '../lib/data.js'
import { PageShell, RiderBottomNav } from '../components/Layout.jsx'
import { 
  IconScooter, IconDollar, IconZap, IconPlus, IconClock, 
  IconBell, IconRefresh, IconCheck, IconShield, IconX, IconPhone, IconWhatsApp 
} from '../components/Icons.jsx'
import { requestNotificationPermission, playChime } from '../lib/notifications.js'

export default function RiderDashboard() {
  const { 
    availabilitySlots, 
    bookings, 
    user, 
    deleteSlot, 
    updateBookingStatus, 
    completeRideWithInspection,
    refreshData 
  } = useApp()

  const navigate = useNavigate()
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  })

  // Controlled OTP inputs per booking
  const [hostOtpInputs, setHostOtpInputs] = useState({})

  // Return Inspection Modal State
  const [inspectingBooking, setInspectingBooking] = useState(null)
  const [conditionChecked, setConditionChecked] = useState(true)
  const [damageStatus, setDamageStatus] = useState('NO_DAMAGE') // 'NO_DAMAGE' | 'DAMAGE_DETECTED'
  const [damageNotes, setDamageNotes] = useState('')

  // Filter listings belonging to this host (or all if demo)
  const userSlots = useMemo(() => {
    if (!user?.phone) return availabilitySlots
    return availabilitySlots.filter(s => !s.host_phone || s.host_phone === user.phone)
  }, [availabilitySlots, user?.phone])

  // Bookings specifically associated with this host's vehicles
  const hostBookings = useMemo(() => {
    return bookings.filter(b => {
      const isMatchingSlot = userSlots.some(s => 
        s.id === b.vehicle_id || s.vehicle_id === b.vehicle_id || 
        (s.model === b.vehicle_model && s.start_time === b.start_time)
      )
      const isMatchingPhone = user?.phone && (b.host_phone === user.phone || b.vehicle_host_phone === user.phone)
      return isMatchingSlot || isMatchingPhone
    })
  }, [bookings, userSlots, user?.phone])

  // Accurate Host Stats: Payouts reflect ONLY the actual booked hours!
  const stats = useMemo(() => {
    const activeSlots = userSlots.filter((s) => !s.is_booked).length
    const totalSlots = userSlots.length
    
    // Total hours host made vehicles available
    const totalListedHours = userSlots.reduce((sum, s) => {
      const diff = (new Date(s.end_time) - new Date(s.start_time)) / (1000 * 60 * 60)
      return sum + Math.max(1, Math.ceil(diff) || 0)
    }, 0)

    // Actual booked hours rented by customers
    const actualBookedHours = hostBookings.reduce((sum, b) => {
      if (['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)) {
        return sum + (Number(b.duration) || 0)
      }
      return sum
    }, 0)

    // Accurate Host Profit: Only for customer booked time period (e.g. 2h out of 6h = 2 * ₹70 = ₹140)
    const totalPayouts = hostBookings.reduce((sum, b) => {
      if (['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)) {
        const payout = Number(b.host_payout) || ((Number(b.duration) || 1) * PRICING.hostPayout)
        return sum + payout
      }
      return sum
    }, 0)

    return { activeSlots, totalSlots, totalPayouts, totalListedHours, actualBookedHours }
  }, [userSlots, hostBookings])

  const bookedSlots = useMemo(() => {
    return userSlots.filter(s => s.is_booked)
  }, [userSlots])

  const handleEnableAlerts = async () => {
    const res = await requestNotificationPermission()
    if (res === 'granted') {
      setAlertsEnabled(true)
      playChime('booking')
      alert("✅ Notifications enabled! You will be alerted when a customer books your EV.")
    } else {
      alert("Please allow notification permissions in your browser settings.")
    }
  }

  // Strict OTP verification
  const handleVerifyOtp = (activeBooking) => {
    const enteredOtp = (hostOtpInputs[activeBooking.id] || '').trim()

    if (!enteredOtp || enteredOtp.length < 4) {
      alert("⚠️ Please enter the 4-digit OTP provided by the customer.")
      return
    }

    if (!activeBooking.pickup_otp || String(enteredOtp) !== String(activeBooking.pickup_otp).trim()) {
      alert(`❌ Invalid OTP! You entered: "${enteredOtp}". This does NOT match the booking OTP. Please verify with the customer.`)
      return
    }

    updateBookingStatus(activeBooking.id, 'ACTIVE')
    playChime('booking')
    alert("✅ OTP Verified! Handover complete. Ride is now ACTIVE.")
  }

  // Open Return Inspection Modal
  const handleOpenInspection = (booking) => {
    setInspectingBooking(booking)
    setConditionChecked(true)
    setDamageStatus('NO_DAMAGE')
    setDamageNotes('')
  }

  // Calculate late fee and settlement
  const getSettlementCalculation = (booking) => {
    if (!booking) return { isLate: false, lateMinutes: 0, lateFee: 0, depositRefund: 500 }
    
    const now = new Date()
    const scheduledEnd = new Date(booking.end_time)
    const diffMs = now.getTime() - scheduledEnd.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    // Rule: If customer late by > 15 minutes, charge full 1 hour extra (₹99 late fee deducted from deposit)
    const isLate = diffMinutes > 15
    const lateFee = isLate ? 99 : 0
    const hasDamage = damageStatus === 'DAMAGE_DETECTED'

    let depositRefund = 500
    if (hasDamage) {
      depositRefund = 0 // Withheld for video inspection
    } else if (isLate) {
      depositRefund = Math.max(0, 500 - lateFee) // 500 - 99 = 401
    }

    return {
      diffMinutes: Math.max(0, diffMinutes),
      isLate,
      lateFee,
      hasDamage,
      depositRefund,
      hostPayout: booking.host_payout || (booking.duration * PRICING.hostPayout)
    }
  }

  // Submit Return Inspection
  const handleConfirmInspection = () => {
    if (!conditionChecked) {
      alert("Please confirm that you have checked the vehicle condition.")
      return
    }

    const settlement = getSettlementCalculation(inspectingBooking)

    completeRideWithInspection(inspectingBooking.id, {
      conditionChecked: true,
      onTime: !settlement.isLate,
      isLate: settlement.isLate,
      lateMinutes: settlement.diffMinutes,
      lateFee: settlement.lateFee,
      hasDamage: settlement.hasDamage,
      damageNotes: damageNotes.trim(),
      depositRefund: settlement.depositRefund
    })

    alert(
      settlement.hasDamage 
        ? "⚠️ Vehicle condition reported with damage. Deposit of ₹500 is withheld for video inspection by Admin. Ride marked as COMPLETED."
        : (settlement.isLate 
          ? `✅ Ride completed! Customer returned ${settlement.diffMinutes}m late. ₹99 late fee deducted. ₹${settlement.depositRefund} deposit refunded.`
          : `✅ Ride completed on-time with no damage! Full deposit ₹500 refunded to customer. Your payout of ₹${settlement.hostPayout} is credited.`)
    )

    setInspectingBooking(null)
  }

  return (
    <PageShell nav={<RiderBottomNav />}>
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          {/* Welcome & Controls */}
          <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Welcome, {user?.name || user?.full_name || 'Host'} 👋</h2>
              <p className="text-sm text-muted">Manage your idle EV listings and track earnings</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleEnableAlerts}
                style={{
                  background: alertsEnabled ? '#DCFCE7' : '#F3F4F6',
                  border: alertsEnabled ? '1px solid #86EFAC' : '1px solid #E5E7EB',
                  color: alertsEnabled ? '#166534' : '#4B5563',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <IconBell size={14} />
                {alertsEnabled ? 'Alerts ON' : 'Enable Alerts'}
              </button>
            </div>
          </div>

          {/* Actionable Booking Handover & Return Notifications */}
          {bookedSlots.length > 0 && bookedSlots.map(slot => {
            const activeBooking = bookings.find(b => 
              (b.vehicle_id === slot.id || b.vehicle_id === slot.vehicle_id || (b.vehicle_model === slot.model && b.start_time === slot.start_time)) && 
              (b.status === 'CONFIRMED' || b.status === 'ACTIVE')
            )
            if (!activeBooking) return null;

            return (
              <div key={slot.id} className="z-card animate-fade-in-up stagger-1" style={{ marginBottom: '24px', background: activeBooking.status === 'ACTIVE' ? '#F0FDF4' : '#FEF9C3', borderColor: activeBooking.status === 'ACTIVE' ? '#86EFAC' : '#FDE047' }}>
                <div className="z-card-body">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <IconZap size={24} style={{ color: activeBooking.status === 'ACTIVE' ? '#16A34A' : '#CA8A04', flexShrink: 0 }} />
                    <div style={{ width: '100%' }}>
                      <div style={{ fontWeight: 800, color: activeBooking.status === 'ACTIVE' ? '#166534' : '#854D0E', fontSize: '1rem' }}>
                        {activeBooking.status === 'ACTIVE' ? '🚴 Ride In Progress — Drop-off & Return' : 'Upcoming Booking Handover!'}
                      </div>
                      
                      <div style={{ fontSize: '0.8125rem', color: activeBooking.status === 'ACTIVE' ? '#15803D' : '#A16207', marginTop: '4px', lineHeight: 1.5 }}>
                        Vehicle: <b>{slot.model} ({slot.plate})</b> | Customer: <b>{activeBooking.customer_phone || 'Renter'}</b>
                        <br />
                        Booking Window: {formatDateTime(activeBooking.start_time)} to {formatDateTime(activeBooking.end_time)} ({activeBooking.duration}h)
                      </div>

                      {/* Customer Contact */}
                      {activeBooking.customer_phone && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                          <a
                            href={`tel:${activeBooking.customer_phone}`}
                            style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <IconPhone size={13} /> Call Customer
                          </a>
                          <a
                            href={`https://wa.me/91${activeBooking.customer_phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <IconWhatsApp size={13} /> WhatsApp
                          </a>
                        </div>
                      )}

                      {/* --- CONFIRMED: Strict OTP Verification --- */}
                      {activeBooking.status === 'CONFIRMED' && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#854D0E', marginBottom: '8px' }}>
                            Verify Customer 4-digit OTP before handing over keys:
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="4-digit OTP"
                              className="z-input"
                              value={hostOtpInputs[activeBooking.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                setHostOtpInputs(prev => ({ ...prev, [activeBooking.id]: val }))
                              }}
                              style={{ width: '130px', background: '#fff', textAlign: 'center', fontSize: '1.125rem', letterSpacing: '0.15em', fontWeight: 700 }}
                            />
                            <button 
                              className="z-btn z-btn-primary" 
                              style={{ flex: 1 }}
                              onClick={() => handleVerifyOtp(activeBooking)}
                            >
                              Verify & Handover Keys
                            </button>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#92400E', marginTop: '6px' }}>
                            * Ask the customer for their OTP shown on their screen.
                          </div>
                        </div>
                      )}

                      {/* --- ACTIVE: Ride In Progress & Return Inspection Option --- */}
                      {activeBooking.status === 'ACTIVE' && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                          {activeBooking.return_requested && (
                            <div style={{ padding: '6px 10px', background: '#FEF3C7', color: '#92400E', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px' }}>
                              📍 Customer has arrived at the pickup location and requested drop-off!
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>
                              Keys handed over. Awaiting return at {formatDateTime(activeBooking.end_time)}.
                            </span>
                            <button
                              className="z-btn z-btn-primary z-btn-sm"
                              onClick={() => handleOpenInspection(activeBooking)}
                              style={{ background: '#16A34A', borderColor: '#16A34A' }}
                            >
                              <IconCheck size={14} /> Inspect Vehicle & Complete Return
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Stats Grid: Profit reflects ONLY actual customer booked hours */}
          <div className="z-stat-grid animate-fade-in-up stagger-1" style={{ marginBottom: '24px' }}>
            <div className="z-stat-card">
              <div className="z-stat-value" style={{ color: 'var(--z-emerald)' }}>
                {stats.activeSlots}
              </div>
              <div className="z-stat-label">Available Slots</div>
            </div>

            <div className="z-stat-card">
              <div className="z-stat-value" style={{ color: 'var(--z-text-primary)' }}>
                ₹{stats.totalPayouts}
              </div>
              <div className="z-stat-label">Earned Payouts</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-muted)', marginTop: '2px' }}>
                ({stats.actualBookedHours}h booked @ ₹{PRICING.hostPayout}/h)
              </div>
            </div>

            <div className="z-stat-card">
              <div className="z-stat-value">{stats.totalListedHours}h</div>
              <div className="z-stat-label">Total Listed Hours</div>
            </div>
          </div>

          {/* Tiered Payout Rate Banner */}
          <div className="z-card animate-fade-in-up stagger-2" style={{ marginBottom: '24px', border: '1px solid var(--z-emerald-light)', background: 'var(--z-emerald-ultra-light)' }}>
            <div className="z-card-body" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--z-emerald)', marginBottom: '8px' }}>
                <IconZap size={20} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Multi-Tier Passive Income Engine
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '8px' }}>
                <div style={{ background: '#ffffff', padding: '10px 8px', borderRadius: '12px', border: '1px solid var(--z-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>6-Hour Slot</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--z-emerald)' }}>₹210 / day</div>
                  <div style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>₹5,460/mo passive</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 8px', borderRadius: '12px', border: '1px solid var(--z-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>12-Hour Shift</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3B82F6' }}>₹279 / day</div>
                  <div style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>₹7,250/mo passive</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 8px', borderRadius: '12px', border: '1px solid var(--z-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Weekly Listing</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8B5CF6' }}>Up to ₹1,650</div>
                  <div style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Guaranteed / week</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--z-emerald-dark)', marginTop: '12px', fontWeight: 500 }}>
                Automatic UPI settlement into your wallet upon ride completion • 100% passive while resting
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <button
            className="z-btn z-btn-primary z-btn-full z-btn-lg animate-fade-in-up stagger-3"
            onClick={() => navigate('/rider/list-ev')}
            style={{ marginBottom: '24px' }}
          >
            <IconPlus size={18} />
            List My Idle EV
          </button>

          {/* Active Listings */}
          <div className="animate-fade-in-up stagger-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <IconClock size={18} />
                Your Listings ({userSlots.length})
              </h3>
              <button 
                onClick={refreshData}
                style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <IconRefresh size={14} /> Refresh
              </button>
            </div>

            {userSlots.length === 0 ? (
              <div className="z-card">
                <div className="z-card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <IconScooter size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ fontWeight: 500, color: 'var(--z-text-muted)' }}>
                    No listings yet
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--z-text-light)', marginTop: '4px' }}>
                    List your idle EV to start earning!
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userSlots.map((slot) => {
                  const hours = Math.ceil((new Date(slot.end_time) - new Date(slot.start_time)) / (1000 * 60 * 60))
                  return (
                    <div key={slot.id} className="z-card" style={{ borderLeft: slot.is_booked ? '4px solid #F59E0B' : '4px solid #10B981' }}>
                      <div className="z-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                            <IconScooter size={16} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
                            {slot.model}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {!slot.is_booked && (
                              <button 
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this listing?")) {
                                    deleteSlot(slot.id)
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, padding: '4px', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            )}
                            <span className={`z-badge ${slot.is_booked ? 'z-badge-warning' : 'z-badge-emerald'}`}>
                              {slot.is_booked ? 'Booked' : 'Available'}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginBottom: '6px' }}>
                          Registration: <b style={{ fontFamily: "'Courier New', monospace" }}>{slot.plate}</b> • Battery: <b>{slot.battery || 90}%</b>
                        </div>

                        {slot.listing_type === 'WEEKLY_COMMITMENT' ? (
                          <div style={{ background: '#EFF6FF', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', color: '#1E40AF', marginBottom: '8px', fontWeight: 600 }}>
                            📅 Weekly Commitment: {slot.daily_hours || `${slot.commitment_days || 6} days`} • Payout: ₹{slot.host_payout_expected || 1650}/wk
                          </div>
                        ) : (
                          <div style={{ background: 'var(--z-emerald-ultra-light)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--z-emerald-dark)', marginBottom: '8px', fontWeight: 600 }}>
                            ⚡ Single Slot ({hours}h) • Max Host Share: ₹{calculateTieredFare(hours).hostPayoutTotal}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>From: </span>
                            {formatDateTime(slot.start_time)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>To: </span>
                            {formatDateTime(slot.end_time)}
                          </div>
                        </div>

                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--z-text-secondary)' }}>
                          📍 {slot.pickup_location}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SYSTEMATIC RETURN INSPECTION & DEPOSIT SETTLEMENT MODAL */}
          {/* ========================================================= */}
          {inspectingBooking && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 99999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px', backdropFilter: 'blur(4px)'
            }}>
              <div className="z-card animate-fade-in-up" style={{ maxWidth: '460px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="z-card-body" style={{ padding: '24px' }}>
                  
                  {/* Modal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconShield size={20} style={{ color: 'var(--z-emerald)' }} />
                        Vehicle Return Inspection
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)', marginTop: '2px' }}>
                        Booking #{inspectingBooking.booking_code} • {inspectingBooking.vehicle_model}
                      </div>
                    </div>
                    <button
                      onClick={() => setInspectingBooking(null)}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                    >
                      <IconX size={20} />
                    </button>
                  </div>

                  {/* Inspection Step 1: Drop-off Timing & Late Fee Assessment */}
                  {(() => {
                    const settlement = getSettlementCalculation(inspectingBooking)
                    return (
                      <div>
                        <div style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background: settlement.isLate ? '#FEF2F2' : '#F0FDF4',
                          border: settlement.isLate ? '1px solid #FECACA' : '1px solid #BBF7D0',
                          marginBottom: '16px'
                        }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: settlement.isLate ? '#991B1B' : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconClock size={16} />
                            {settlement.isLate 
                              ? `⏰ Late Drop-off: ${settlement.diffMinutes} mins late (>15 min grace)`
                              : '✅ On-time Drop-off Verified'}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: settlement.isLate ? '#B91C1C' : '#15803D', marginTop: '4px', lineHeight: 1.4 }}>
                            Scheduled Drop-off: <b>{formatDateTime(inspectingBooking.end_time)}</b>
                            <br />
                            Actual Drop-off: <b>{formatDateTime(new Date())}</b>
                            {settlement.isLate && (
                              <div style={{ marginTop: '4px', fontWeight: 700 }}>
                                ⚠️ Late penalty: ₹99 (charged for full 1h extra, deducted from customer deposit)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inspection Step 2: Vehicle Condition Verification */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', background: '#F9FAFB', borderRadius: '8px',
                            border: '1px solid var(--z-border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem'
                          }}>
                            <input
                              type="checkbox"
                              checked={conditionChecked}
                              onChange={(e) => setConditionChecked(e.target.checked)}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--z-emerald)' }}
                            />
                            <span>Vehicle condition checked (Key, helmet & body verified)</span>
                          </label>
                        </div>

                        {/* Inspection Step 3: Damage Detection */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '8px' }}>
                            Damage Status:
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <button
                              type="button"
                              onClick={() => setDamageStatus('NO_DAMAGE')}
                              style={{
                                flex: 1, padding: '10px', borderRadius: '8px',
                                border: damageStatus === 'NO_DAMAGE' ? '2px solid #10B981' : '1px solid var(--z-border)',
                                background: damageStatus === 'NO_DAMAGE' ? '#ECFDF5' : '#fff',
                                color: damageStatus === 'NO_DAMAGE' ? '#065F46' : 'var(--z-text-secondary)',
                                fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer'
                              }}
                            >
                              🟢 No Damage
                            </button>

                            <button
                              type="button"
                              onClick={() => setDamageStatus('DAMAGE_DETECTED')}
                              style={{
                                flex: 1, padding: '10px', borderRadius: '8px',
                                border: damageStatus === 'DAMAGE_DETECTED' ? '2px solid #EF4444' : '1px solid var(--z-border)',
                                background: damageStatus === 'DAMAGE_DETECTED' ? '#FEF2F2' : '#fff',
                                color: damageStatus === 'DAMAGE_DETECTED' ? '#991B1B' : 'var(--z-text-secondary)',
                                fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer'
                              }}
                            >
                              🔴 Damage Detected
                            </button>
                          </div>

                          {/* Damage Notes if detected */}
                          {damageStatus === 'DAMAGE_DETECTED' && (
                            <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: '4px' }}>
                                Damage Description / Parts Affected:
                              </label>
                              <textarea
                                className="z-input"
                                rows={2}
                                placeholder="e.g. Scratches on side panel, broken mirror, damaged brake lever"
                                value={damageNotes}
                                onChange={(e) => setDamageNotes(e.target.value)}
                                style={{ fontSize: '0.8125rem', background: '#fff' }}
                              />
                              <div style={{ fontSize: '0.6875rem', color: '#B91C1C', marginTop: '6px', lineHeight: 1.4 }}>
                                🛡️ <b>Strict Policy:</b> Before-ride and after-ride inspection videos will be reviewed by Hub Admin. Deposit of ₹500 is <b>withheld and not refunded</b> to the customer.
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Inspection Step 4: Deposit Settlement Summary Breakdown */}
                        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid var(--z-border)', marginBottom: '20px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--z-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            Settlement Summary
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                            <span>Customer Deposit Paid</span>
                            <span style={{ fontWeight: 600 }}>₹500</span>
                          </div>

                          {settlement.isLate && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px', color: '#DC2626' }}>
                              <span>Late Drop-off Penalty (&gt;15 min)</span>
                              <span style={{ fontWeight: 700 }}>- ₹99</span>
                            </div>
                          )}

                          {settlement.hasDamage && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px', color: '#DC2626' }}>
                              <span>Damage Withholding (Video Review)</span>
                              <span style={{ fontWeight: 700 }}>- ₹500</span>
                            </div>
                          )}

                          <div className="z-divider" style={{ margin: '8px 0' }} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 800 }}>
                            <span>Net Refund to Customer</span>
                            <span style={{ color: settlement.depositRefund > 0 ? 'var(--z-emerald)' : '#DC2626' }}>
                              ₹{settlement.depositRefund}
                              {settlement.hasDamage && ' (Withheld)'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--z-border)', color: 'var(--z-emerald-dark)', fontWeight: 700 }}>
                            <span>Your Host Payout for Ride</span>
                            <span>+ ₹{settlement.hostPayout}</span>
                          </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className="z-btn z-btn-outline"
                            onClick={() => setInspectingBooking(null)}
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="z-btn z-btn-primary"
                            onClick={handleConfirmInspection}
                            style={{ flex: 2, background: 'var(--z-emerald)', borderColor: 'var(--z-emerald)' }}
                            disabled={!conditionChecked}
                          >
                            Confirm & Complete Return
                          </button>
                        </div>
                      </div>
                    )
                  })()}

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageShell>
  )
}
