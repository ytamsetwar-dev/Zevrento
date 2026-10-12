import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useApp } from '../lib/store.jsx'
import { BOOKING_STATUS, PRICING, formatDateTime } from '../lib/data.js'
import { PageShell } from '../components/Layout.jsx'
import { 
  IconShield, IconCheck, IconClipboard, IconRefresh, 
  IconScooter, IconX, IconUser, IconDollar, IconBattery, 
  IconMapPin, IconClock, IconPhone, IconWhatsApp, IconBell,
  IconAlertTriangle
} from '../components/Icons.jsx'
import { requestNotificationPermission, playChime, sendNotification } from '../lib/notifications.js'

const STATUS_STYLES = {
  'PENDING_PAYMENT': 'z-badge-warning',
  [BOOKING_STATUS.PENDING_KYC]: 'z-badge-warning',
  [BOOKING_STATUS.CONFIRMED]: 'z-badge-info',
  [BOOKING_STATUS.ACTIVE]: 'z-badge-emerald',
  [BOOKING_STATUS.COMPLETED]: 'z-badge-neutral',
  [BOOKING_STATUS.CANCELLED]: 'z-badge-danger',
  [BOOKING_STATUS.EXPIRED]: 'z-badge-danger',
}

const STATUS_LABELS = {
  'PENDING_PAYMENT': 'Pending Payment',
  [BOOKING_STATUS.PENDING_KYC]: 'Pending KYC',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.ACTIVE]: 'Active',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.EXPIRED]: 'Expired',
}

export default function AdminHubPanel() {
  const { 
    bookings, 
    availabilitySlots, 
    approveBooking, 
    completeBooking, 
    completeRideWithInspection,
    updateBookingStatus, 
    deleteBooking,
    deleteSlot,
    verifyUserKyc, 
    refreshData 
  } = useApp()

  const [activeTab, setActiveTab] = useState('bookings') // bookings, vehicles, kyc, transactions, customers, hosts
  const [tokenSearch, setTokenSearch] = useState('')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('ALL') // ALL, AVAILABLE, BOOKED
  const [bookingFilter, setBookingFilter] = useState('ALL') // ALL, PENDING_KYC, CONFIRMED, ACTIVE, COMPLETED
  const [verifyOTPInput, setVerifyOTPInput] = useState('')
  const [dispatchBookingId, setDispatchBookingId] = useState(null)
  const [notificationsActive, setNotificationsActive] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  })

  // Return inspection modal states
  const [inspectModalBooking, setInspectModalBooking] = useState(null)
  const [inspectionConditionChecked, setInspectionConditionChecked] = useState(false)
  const [inspectionOnTimeChecked, setInspectionOnTimeChecked] = useState(true)
  const [inspectionHasDamage, setInspectionHasDamage] = useState(false)
  const [inspectionDamageNotes, setInspectionDamageNotes] = useState('')

  const [dbProfiles, setDbProfiles] = useState([])

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('*')
      if (data) setDbProfiles(data)
    }
    fetchProfiles()
  }, [activeTab])

  // Handle notification toggle
  const handleToggleNotifications = async () => {
    const res = await requestNotificationPermission()
    if (res === 'granted') {
      setNotificationsActive(true)
      playChime('booking')
      sendNotification('🔔 Zevrento Alerts Enabled', {
        body: 'You will receive real-time push and sound notifications for bookings and vehicle listings.',
        type: 'booking'
      })
    } else {
      alert('Notification permissions are ' + res + '. Please enable notifications in your browser site settings.')
    }
  }

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    let list = bookings
    if (tokenSearch.trim()) {
      const query = tokenSearch.toLowerCase().replace('#', '')
      list = list.filter((b) => 
        (b.booking_code && b.booking_code.toLowerCase().includes(query)) ||
        (b.customer_phone && b.customer_phone.includes(query)) ||
        (b.vehicle_model && b.vehicle_model.toLowerCase().includes(query)) ||
        (b.utr_number && b.utr_number.includes(query))
      )
    }
    if (bookingFilter !== 'ALL') {
      list = list.filter((b) => b.status === bookingFilter)
    }
    return list
  }, [bookings, tokenSearch, bookingFilter])

  // Filtered Availability Slots / Listed Vehicles
  const filteredVehicles = useMemo(() => {
    let list = availabilitySlots
    if (vehicleSearch.trim()) {
      const q = vehicleSearch.toLowerCase()
      list = list.filter((s) => 
        (s.model && s.model.toLowerCase().includes(q)) ||
        (s.plate && s.plate.toLowerCase().includes(q)) ||
        (s.host_phone && s.host_phone.includes(q)) ||
        (s.pickup_location && s.pickup_location.toLowerCase().includes(q)) ||
        (s.hub_id && s.hub_id.toLowerCase().includes(q))
      )
    }
    if (vehicleFilter === 'AVAILABLE') {
      list = list.filter((s) => !s.is_booked)
    } else if (vehicleFilter === 'BOOKED') {
      list = list.filter((s) => s.is_booked)
    }
    return list
  }, [availabilitySlots, vehicleSearch, vehicleFilter])

  // Derive unique customers from db and bookings
  const uniqueCustomers = useMemo(() => {
    const customers = {}
    dbProfiles.filter(p => p.role === 'CUSTOMER').forEach(p => {
      customers[p.phone] = { 
        id: p.id,
        phone: p.phone, 
        name: p.full_name,
        joiningDate: p.created_at,
        kycVerified: p.kyc_verified || false,
        isActive: false,
        totalRides: 0, 
        totalSpent: 0 
      }
    })
    bookings.forEach(b => {
      if (b.customer_phone && customers[b.customer_phone]) {
        customers[b.customer_phone].totalRides += 1
        customers[b.customer_phone].totalSpent += (Number(b.total_amount) || 0)
        if (b.status === BOOKING_STATUS.ACTIVE) {
          customers[b.customer_phone].isActive = true
        }
      }
    })
    return Object.values(customers)
  }, [bookings, dbProfiles])

  // Derive unique hosts from db and availability slots
  const uniqueHosts = useMemo(() => {
    const hosts = {}
    dbProfiles.filter(p => p.role === 'RIDER').forEach(p => {
      hosts[p.phone] = { 
        id: p.id,
        phone: p.phone, 
        name: p.full_name, 
        joiningDate: p.created_at,
        kycVerified: p.kyc_verified || false,
        totalSlots: 0, 
        totalEarnings: 0,
        hasActiveSlot: false
      }
    })
    availabilitySlots.forEach(s => {
      if (s.host_phone) {
        if (!hosts[s.host_phone]) {
          hosts[s.host_phone] = { 
            phone: s.host_phone, 
            name: 'Partner Host', 
            joiningDate: s.created_at, 
            kycVerified: false, 
            totalSlots: 0, 
            totalEarnings: 0, 
            hasActiveSlot: false 
          }
        }
        hosts[s.host_phone].totalSlots += 1
        if (!s.is_booked) hosts[s.host_phone].hasActiveSlot = true
        
        if (s.is_booked) {
          const hours = Math.ceil((new Date(s.end_time) - new Date(s.start_time)) / (1000 * 60 * 60)) || 2
          hosts[s.host_phone].totalEarnings += (hours * PRICING.hostPayout)
        }
      }
    })
    return Object.values(hosts)
  }, [availabilitySlots, dbProfiles])

  const pendingKycCount = dbProfiles.filter(p => p.kyc_status === 'PENDING').length

  const handleApprove = (bookingId) => {
    approveBooking(bookingId)
  }

  const handleStartDispatch = (booking) => {
    setDispatchBookingId(booking.id)
    setVerifyOTPInput('')
  }

  const handleVerifyOTP = (booking) => {
    if (verifyOTPInput === booking.pickup_otp) {
      updateBookingStatus(booking.id, BOOKING_STATUS.ACTIVE)
      setDispatchBookingId(null)
      setVerifyOTPInput('')
    } else {
      alert("Invalid OTP entered. Please re-check with customer.")
    }
  }

  const handleStartInspection = (booking) => {
    const now = new Date()
    const scheduledEnd = new Date(booking.end_time)
    const isLate = (now - scheduledEnd) > (15 * 60 * 1000)
    setInspectModalBooking(booking)
    setInspectionConditionChecked(false)
    setInspectionOnTimeChecked(!isLate)
    setInspectionHasDamage(false)
    setInspectionDamageNotes('')
  }

  const handleConfirmInspectionSubmit = async () => {
    if (!inspectModalBooking) return
    if (!inspectionConditionChecked) {
      alert("Please confirm the vehicle condition checkbox before completing.")
      return
    }

    const now = new Date()
    const scheduledEnd = new Date(inspectModalBooking.end_time)
    const lateDiffMs = now - scheduledEnd
    const lateMinutes = Math.max(0, Math.round(lateDiffMs / (60 * 1000)))
    const isLate = !inspectionOnTimeChecked || lateMinutes > 15
    const lateFee = isLate ? 99 : 0
    let refundAmount = isLate ? (500 - 99) : 500
    let depositStatus = 'REFUNDED'

    if (inspectionHasDamage) {
      refundAmount = 0
      depositStatus = 'WITHHELD_FOR_DAMAGE_REVIEW'
    }

    await completeRideWithInspection(inspectModalBooking.id, {
      inspection_condition_checked: true,
      on_time_dropping: inspectionOnTimeChecked,
      is_late: isLate,
      late_minutes: isLate ? lateMinutes : 0,
      late_fee: lateFee,
      has_damage: inspectionHasDamage,
      damage_notes: inspectionDamageNotes,
      refund_amount: refundAmount,
      deposit_status: depositStatus
    })

    alert(`Inspection logged! Ride marked completed. ${inspectionHasDamage ? 'Deposit withheld for damage review.' : (isLate ? '₹99 late fee deducted from deposit.' : 'Full deposit refunded.')}`)
    setInspectModalBooking(null)
  }

  const handleResolveDamageReview = async (bookingId, decision) => {
    if (decision === 'FORFEIT') {
      if (!window.confirm("Pre/post inspection videos verified: Damage is confirmed. Forfeit the ₹500 security deposit?")) return
      await updateBookingStatus(bookingId, BOOKING_STATUS.COMPLETED, {
        deposit_status: 'FORFEITED_DAMAGE',
        refund_amount: 0,
        admin_video_verified: true
      })
      alert("Deposit permanently forfeited. Logged in audit history.")
    } else {
      if (!window.confirm("Pre/post inspection videos verified: Clear customer of fault and release ₹500 deposit refund?")) return
      await updateBookingStatus(bookingId, BOOKING_STATUS.COMPLETED, {
        deposit_status: 'REFUNDED_AFTER_REVIEW',
        refund_amount: 500,
        admin_video_verified: true
      })
      alert("₹500 Deposit refund released to customer.")
    }
  }

  const handleComplete = (booking) => {
    handleStartInspection(booking)
  }

  const handleDeleteBooking = (bookingId, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete booking ${code || bookingId}?`)) return
    deleteBooking(bookingId)
  }

  const handleDeleteSlot = (slotId, plate) => {
    if (!window.confirm(`Are you sure you want to remove the listed vehicle slot for ${plate || 'EV'}?`)) return
    deleteSlot(slotId)
  }

  const handleDeleteCustomer = async (phone) => {
    if (!window.confirm(`Are you sure you want to delete profile ${phone} from the database?`)) return
    const { error } = await supabase.from('profiles').delete().eq('phone', phone)
    if (error) {
      alert('Error deleting customer: ' + error.message)
    } else {
      setDbProfiles(prev => prev.filter(p => p.phone !== phone))
      alert('Profile deleted successfully.')
    }
  }

  return (
    <PageShell title="Zevrento Hub Control">
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          
          {/* Top Control Bar */}
          <div className="animate-fade-in-up" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--z-radius-md)',
              fontSize: '0.8125rem', fontWeight: 600, color: '#92400E',
            }}>
              <IconShield size={18} />
              Admin Access — Hub Operator Panel
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={handleToggleNotifications}
                style={{ 
                  background: notificationsActive ? '#DCFCE7' : '#F3F4F6', 
                  border: notificationsActive ? '1px solid #86EFAC' : '1px solid #E5E7EB', 
                  color: notificationsActive ? '#166534' : '#4B5563',
                  padding: '8px 12px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
                }}
                title="Toggle push and sound notifications"
              >
                <IconBell size={15} /> 
                {notificationsActive ? 'Alerts ON' : 'Enable Alerts'}
              </button>

              <button 
                onClick={refreshData}
                style={{ 
                  background: 'var(--z-emerald-ultra-light)', 
                  border: '1px solid var(--z-emerald-light)', 
                  padding: '8px 14px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--z-emerald)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
                }}
              >
                <IconRefresh size={15} /> Sync
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="admin-tabs animate-fade-in-up" style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '6px' }}>
            {[
              { id: 'bookings', label: `Bookings (${bookings.length})` },
              { id: 'vehicles', label: `Listed EVs (${availabilitySlots.length})` },
              { id: 'kyc', label: `KYC (${pendingKycCount})` },
              { id: 'transactions', label: `Transactions (${bookings.filter(b => b.utr_number).length})` },
              { id: 'customers', label: `Customers (${uniqueCustomers.length})` },
              { id: 'hosts', label: `Hosts (${uniqueHosts.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--z-radius-full)',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--z-emerald)' : 'var(--z-off-white)',
                  color: activeTab === tab.id ? '#fff' : 'var(--z-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activeTab === tab.id ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================================================== */}
          {/* TAB 1: BOOKINGS */}
          {/* ==================================================== */}
          {activeTab === 'bookings' && (
            <div className="animate-fade-in-up stagger-1">
              {/* Token & Phone Search */}
              <div className="admin-section" style={{ marginBottom: '16px' }}>
                <div className="z-input-group">
                  <input
                    className="z-input"
                    type="text"
                    placeholder="Search by token (e.g. #BK-7X9Q), phone, or vehicle..."
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                  />
                </div>

                {/* Booking status filter pills */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['ALL', BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.PENDING_KYC, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].map(status => (
                    <button
                      key={status}
                      onClick={() => setBookingFilter(status)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--z-border)',
                        background: bookingFilter === status ? 'var(--z-text-primary)' : '#fff',
                        color: bookingFilter === status ? '#fff' : 'var(--z-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {status === 'ALL' ? 'All Bookings' : (STATUS_LABELS[status] || status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings List */}
              <div className="admin-section">
                <div className="admin-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconClipboard size={15} />
                    Live Bookings Feed ({filteredBookings.length})
                  </span>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--z-text-muted)' }}>
                      <IconClipboard size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p style={{ fontWeight: 600 }}>{tokenSearch ? 'No matching bookings found' : 'No bookings in the system yet'}</p>
                      <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Bookings created by customers will appear here in real-time.</p>
                    </div>
                  </div>
                ) : (
                  <div className="booking-list">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="booking-item" style={{ position: 'relative' }}>
                        <div className="booking-item-header">
                          <span className="booking-item-code">{booking.booking_code}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={`z-badge ${STATUS_STYLES[booking.status] || 'z-badge-warning'}`}>
                              {STATUS_LABELS[booking.status] || booking.status}
                            </span>
                            <button
                              onClick={() => handleDeleteBooking(booking.id, booking.booking_code)}
                              title="Delete booking"
                              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}
                            >
                              <IconX size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="booking-item-details">
                          <span className="label">Vehicle</span>
                          <span className="value" style={{ fontWeight: 700 }}>{booking.vehicle_model}</span>
                          <span className="label">Customer</span>
                          <span className="value">
                            {booking.customer_phone ? (
                              <a href={`tel:${booking.customer_phone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                                📞 {booking.customer_phone}
                              </a>
                            ) : '—'}
                          </span>
                          <span className="label">Hub/Pickup</span>
                          <span className="value">{booking.hub_name || 'Standard Hub'}</span>
                          <span className="label">Duration</span>
                          <span className="value">{booking.duration} hours</span>
                          <span className="label">UTR Number</span>
                          <span className="value" style={{ fontFamily: "'Courier New', monospace", fontSize: '0.75rem', fontWeight: 700 }}>
                            {booking.utr_number || '—'}
                          </span>
                          <span className="label">Payment</span>
                          <span className="value" style={{ color: 'var(--z-emerald)', fontWeight: 700 }}>
                            {booking.payment_mode === 'DEPOSIT_ONLY' ? '₹500 Deposit Paid' : `₹${booking.total_amount} Full Payment`}
                          </span>
                          <span className="label">Pickup Time</span>
                          <span className="value" style={{ fontSize: '0.6875rem' }}>{formatDateTime(booking.start_time)}</span>
                          <span className="label">Drop-off Time</span>
                          <span className="value" style={{ fontSize: '0.6875rem' }}>{formatDateTime(booking.end_time)}</span>
                        </div>

                        {/* WhatsApp Customer Action */}
                        {booking.customer_phone && (
                          <div style={{ marginTop: '10px' }}>
                            <a
                              href={`https://wa.me/91${booking.customer_phone}?text=${encodeURIComponent(`Hello! Regarding your Zevrento booking #${booking.booking_code} for ${booking.vehicle_model}. Your pickup OTP is ${booking.pickup_otp || 'being generated'}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="z-btn z-btn-outline z-btn-sm"
                              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', color: '#16A34A', borderColor: '#86EFAC' }}
                            >
                              <IconWhatsApp size={16} /> Contact Customer on WhatsApp
                            </a>
                          </div>
                        )}

                        {/* ---- PENDING KYC: Approve ---- */}
                        {booking.status === BOOKING_STATUS.PENDING_KYC && (
                          <div className="admin-actions" style={{ marginTop: '10px' }}>
                            <button
                              className="z-btn z-btn-primary z-btn-sm"
                              onClick={() => handleApprove(booking.id)}
                              style={{ flex: 1 }}
                            >
                              <IconCheck size={14} /> Approve KYC & Issue OTP
                            </button>
                            <button
                              className="z-btn z-btn-outline z-btn-sm"
                              onClick={() => updateBookingStatus(booking.id, BOOKING_STATUS.CANCELLED)}
                              style={{ color: 'var(--z-danger)', borderColor: 'var(--z-danger)' }}
                              title="Cancel booking"
                            >
                              <IconX size={14} /> Cancel
                            </button>
                          </div>
                        )}

                        {/* OTP Display after approval */}
                        {booking.pickup_otp && booking.status === BOOKING_STATUS.CONFIRMED && (
                          <div className="otp-display" style={{ marginTop: '10px' }}>
                            <div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Pickup OTP Generated
                              </div>
                              <div className="otp-digits">{booking.pickup_otp}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', marginTop: '4px' }}>
                                Give keys to customer after verifying this OTP at pickup
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ---- CONFIRMED: Hub Dispatch ---- */}
                        {booking.status === BOOKING_STATUS.CONFIRMED && (
                          <div style={{ marginTop: '10px' }}>
                            {dispatchBookingId === booking.id ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  className="z-input"
                                  type="text"
                                  placeholder="Enter 4-digit OTP"
                                  value={verifyOTPInput}
                                  onChange={(e) => setVerifyOTPInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  maxLength={4}
                                  inputMode="numeric"
                                  style={{ flex: 1, fontFamily: "'Courier New', monospace", textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2em' }}
                                />
                                <button
                                  className="z-btn z-btn-primary z-btn-sm"
                                  onClick={() => handleVerifyOTP(booking)}
                                  disabled={verifyOTPInput.length !== 4}
                                >
                                  Verify
                                </button>
                              </div>
                            ) : (
                              <button
                                className="z-btn z-btn-outline z-btn-sm z-btn-full"
                                onClick={() => handleStartDispatch(booking)}
                              >
                                <IconScooter size={14} /> Dispatch Vehicle — Verify OTP
                              </button>
                            )}
                          </div>
                        )}

                        {/* ---- ACTIVE: Return & Complete ---- */}
                        {booking.status === BOOKING_STATUS.ACTIVE && (
                          <div style={{ marginTop: '10px' }}>
                            {booking.return_requested && (
                              <div style={{
                                padding: '6px 10px',
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: '#065F46',
                                fontWeight: 600,
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <IconCheck size={14} /> Customer initiated return! Ready for inspection.
                              </div>
                            )}
                            <button
                              className="z-btn z-btn-primary z-btn-sm z-btn-full"
                              onClick={() => handleStartInspection(booking)}
                            >
                              <IconRefresh size={14} /> Inspect & Complete Return
                            </button>
                          </div>
                        )}

                        {/* ---- COMPLETED: Settlement info ---- */}
                        {booking.status === BOOKING_STATUS.COMPLETED && (
                          <div style={{
                            marginTop: '10px',
                            display: 'flex', flexDirection: 'column', gap: '6px',
                          }}>
                            {booking.deposit_status === 'WITHHELD_FOR_DAMAGE_REVIEW' || (booking.has_damage && !booking.admin_video_verified) ? (
                              <div style={{
                                padding: '10px 12px',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: 'var(--z-radius-sm)',
                                fontSize: '0.75rem',
                              }}>
                                <div style={{ color: '#991B1B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <IconAlertTriangle size={15} /> 🚨 DAMAGE REPORTED — Video Verification Pending
                                </div>
                                <div style={{ color: '#7F1D1D', marginTop: '4px' }}>
                                  <strong>Damage Notes:</strong> {booking.damage_notes || 'Damage noted during return inspection'}
                                </div>
                                <div style={{ color: '#B91C1C', marginTop: '4px', fontSize: '0.6875rem' }}>
                                  Deposit ₹500 is currently withheld. Compare pre-ride & post-ride inspection videos to conclude action:
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                  <button
                                    onClick={() => handleResolveDamageReview(booking.id, 'FORFEIT')}
                                    className="z-btn z-btn-sm"
                                    style={{ background: '#DC2626', color: '#fff', border: 'none', flex: 1, fontSize: '0.6875rem', cursor: 'pointer' }}
                                  >
                                    Confirm Video: Forfeit Deposit (₹0)
                                  </button>
                                  <button
                                    onClick={() => handleResolveDamageReview(booking.id, 'REFUND')}
                                    className="z-btn z-btn-sm"
                                    style={{ background: '#16A34A', color: '#fff', border: 'none', flex: 1, fontSize: '0.6875rem', cursor: 'pointer' }}
                                  >
                                    Clear Video: Refund ₹500
                                  </button>
                                </div>
                              </div>
                            ) : booking.deposit_status === 'FORFEITED_DAMAGE' ? (
                              <div style={{
                                padding: '8px 12px',
                                background: '#FEF2F2',
                                borderRadius: 'var(--z-radius-sm)',
                                fontSize: '0.75rem', fontWeight: 600, color: '#991B1B',
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}>
                                <IconAlertTriangle size={14} /> ₹500 Deposit Forfeited (Video Confirmed Damage)
                              </div>
                            ) : booking.deposit_status === 'REFUNDED_AFTER_REVIEW' ? (
                              <div style={{
                                padding: '8px 12px',
                                background: '#F0FDF4',
                                borderRadius: 'var(--z-radius-sm)',
                                fontSize: '0.75rem', fontWeight: 600, color: '#166534',
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}>
                                <IconCheck size={14} /> ₹500 Deposit Refunded (Cleared by Video Review)
                              </div>
                            ) : booking.is_late || (booking.late_fee && booking.late_fee > 0) ? (
                              <div style={{
                                padding: '8px 12px',
                                background: '#FFFBEB',
                                borderRadius: 'var(--z-radius-sm)',
                                fontSize: '0.75rem', fontWeight: 600, color: '#92400E',
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}>
                                <IconClock size={14} /> Late drop-off ({booking.late_minutes}m): ₹{booking.late_fee || 99} deducted, ₹{booking.refund_amount || 401} refunded
                              </div>
                            ) : (
                              <div style={{
                                padding: '8px 12px',
                                background: 'var(--z-emerald-ultra-light)',
                                borderRadius: 'var(--z-radius-sm)',
                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--z-emerald-dark)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}>
                                <IconCheck size={14} /> Clean return: Deposit ₹{booking.refund_amount || 500} refunded
                              </div>
                            )}

                            <div style={{
                              padding: '8px 12px',
                              background: '#F0F9FF',
                              borderRadius: 'var(--z-radius-sm)',
                              fontSize: '0.75rem', fontWeight: 600, color: '#0C4A6E',
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                              <IconCheck size={14} /> Host payout ₹{booking.host_payout || 0} settled
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: LISTED VEHICLES / FLEET MANAGEMENT (NEW!) */}
          {/* ==================================================== */}
          {activeTab === 'vehicles' && (
            <div className="animate-fade-in-up stagger-1">
              {/* Fleet Statistics summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div className="z-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>Total Listed EVs</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--z-text-primary)' }}>{availabilitySlots.length}</div>
                </div>
                <div className="z-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>Available Now</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--z-emerald)' }}>
                    {availabilitySlots.filter(s => !s.is_booked).length}
                  </div>
                </div>
                <div className="z-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>Booked Slots</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>
                    {availabilitySlots.filter(s => s.is_booked).length}
                  </div>
                </div>
                <div className="z-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>Active Hosts</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>
                    {new Set(availabilitySlots.map(s => s.host_phone).filter(Boolean)).size}
                  </div>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="admin-section" style={{ marginBottom: '16px' }}>
                <div className="z-input-group">
                  <input
                    className="z-input"
                    type="text"
                    placeholder="Search by model, plate, host phone or location..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {[
                    { id: 'ALL', label: `All Vehicles (${availabilitySlots.length})` },
                    { id: 'AVAILABLE', label: `Available (${availabilitySlots.filter(s => !s.is_booked).length})` },
                    { id: 'BOOKED', label: `Booked (${availabilitySlots.filter(s => s.is_booked).length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setVehicleFilter(f.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--z-border)',
                        background: vehicleFilter === f.id ? 'var(--z-text-primary)' : '#fff',
                        color: vehicleFilter === f.id ? '#fff' : 'var(--z-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicles Feed */}
              <div className="admin-section">
                <div className="admin-section-title">
                  <IconScooter size={16} />
                  Host Listed EV Fleet ({filteredVehicles.length})
                </div>

                {filteredVehicles.length === 0 ? (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--z-text-muted)' }}>
                      <IconScooter size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p style={{ fontWeight: 600 }}>{vehicleSearch ? 'No matching vehicles found' : 'No EVs currently listed'}</p>
                      <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                        When riders list their EVs via "List My Idle EV", they will appear here instantly!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredVehicles.map((slot) => (
                      <div key={slot.id} className="z-card" style={{ borderLeft: slot.is_booked ? '4px solid #F59E0B' : '4px solid #10B981' }}>
                        <div className="z-card-body">
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--z-text-primary)' }}>
                                  {slot.model}
                                </span>
                                <span style={{
                                  background: '#F3F4F6',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  fontFamily: "'Courier New', monospace",
                                  letterSpacing: '0.05em'
                                }}>
                                  {slot.plate || 'NO PLATE'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)', marginTop: '2px' }}>
                                Listed on: {slot.created_at ? formatDateTime(slot.created_at) : 'Recently'}
                              </div>
                            </div>

                            <span className={`z-badge ${slot.is_booked ? 'z-badge-warning' : 'z-badge-emerald'}`}>
                              {slot.is_booked ? '🟡 Booked' : '🟢 Available'}
                            </span>
                          </div>

                          {/* Details Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '0.8125rem', marginBottom: '12px' }}>
                            <div>
                              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                <IconBattery size={13} /> Battery Level
                              </span>
                              <span style={{ fontWeight: 700, color: (slot.battery || 90) > 40 ? 'var(--z-emerald)' : '#DC2626' }}>
                                {slot.battery || 90}% Charge
                              </span>
                            </div>

                            <div>
                              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                <IconPhone size={13} /> Host Partner
                              </span>
                              <span>
                                {slot.host_phone ? (
                                  <a href={`tel:${slot.host_phone}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
                                    {slot.host_phone}
                                  </a>
                                ) : 'Not Provided'}
                              </span>
                            </div>

                            <div>
                              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                <IconClock size={13} /> Available From
                              </span>
                              <span style={{ fontSize: '0.75rem' }}>{slot.start_time ? formatDateTime(slot.start_time) : 'Immediate'}</span>
                            </div>

                            <div>
                              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                <IconClock size={13} /> Available To
                              </span>
                              <span style={{ fontSize: '0.75rem' }}>{slot.end_time ? formatDateTime(slot.end_time) : 'End of day'}</span>
                            </div>
                          </div>

                          {/* Pickup Location */}
                          <div style={{
                            padding: '8px 12px',
                            background: '#F9FAFB',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px'
                          }}>
                            <IconMapPin size={15} style={{ color: 'var(--z-emerald)', flexShrink: 0 }} />
                            <span><strong>Location:</strong> {slot.pickup_location || 'Designated Hub Location'}</span>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {slot.host_phone && (
                              <a
                                href={`https://wa.me/91${slot.host_phone}?text=${encodeURIComponent(`Hello! Regarding your listed EV (${slot.model} - ${slot.plate}) on Zevrento Hub.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="z-btn z-btn-outline z-btn-sm"
                                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#16A34A', borderColor: '#86EFAC' }}
                              >
                                <IconWhatsApp size={16} /> WhatsApp Host
                              </a>
                            )}

                            <button
                              onClick={() => handleDeleteSlot(slot.id, slot.plate)}
                              className="z-btn z-btn-outline z-btn-sm"
                              style={{ color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconX size={14} /> Remove Listing
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: KYC APPROVALS */}
          {/* ==================================================== */}
          {activeTab === 'kyc' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconShield size={14} />
                Pending KYC Approvals ({dbProfiles.filter(p => p.kyc_status === 'PENDING').length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dbProfiles.filter(p => p.kyc_status === 'PENDING').map(c => (
                  <div key={c.phone} className="z-card">
                    <div className="z-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.full_name || 'Customer'}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)' }}>📞 {c.phone}</div>
                        {c.address && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--z-text-light)', marginTop: '2px' }}>📍 {c.address}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a 
                          href={`https://wa.me/91${c.phone}?text=Your%20Zevrento%20KYC%20is%20approved!%20You%20can%20now%20rent%20EVs.`}
                          target="_blank" rel="noopener noreferrer"
                          className="z-btn z-btn-outline z-btn-sm"
                          style={{ color: '#16A34A', borderColor: '#86EFAC' }}
                          title="WhatsApp Approval Message"
                        >
                          <IconWhatsApp size={14} /> WhatsApp
                        </a>
                        <button 
                          className="z-btn z-btn-primary z-btn-sm" 
                          onClick={async () => {
                            await verifyUserKyc(c.phone)
                            setDbProfiles(prev => prev.map(p => p.phone === c.phone ? { ...p, kyc_status: 'VERIFIED', kyc_verified: true } : p))
                          }}
                        >
                          <IconCheck size={14} /> Approve KYC
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {dbProfiles.filter(p => p.kyc_status === 'PENDING').length === 0 && (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '30px', color: 'var(--z-text-muted)' }}>
                      <p style={{ fontWeight: 500 }}>No pending KYC approvals.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: PAYMENT TRANSACTIONS */}
          {/* ==================================================== */}
          {activeTab === 'transactions' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconDollar size={14} />
                Payment Transaction History ({bookings.filter(b => b.utr_number).length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bookings.filter(b => b.utr_number).map(b => (
                  <div key={b.id} className="z-card">
                    <div className="z-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--z-emerald)', fontSize: '1rem' }}>+ ₹{b.total_amount}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>{formatDateTime(b.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-primary)' }}>
                        <strong>Customer:</strong> {b.customer_phone} ({b.vehicle_model})
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-primary)', marginTop: '4px' }}>
                        <strong>UTR Ref:</strong> <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{b.utr_number}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)', marginTop: '4px' }}>
                        Booking Token: {b.booking_code} | Mode: {b.payment_mode || 'UPI'}
                      </div>
                      {b.status === BOOKING_STATUS.COMPLETED && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--z-border)', fontSize: '0.8125rem' }}>
                          {b.deposit_status === 'WITHHELD_FOR_DAMAGE_REVIEW' || b.deposit_status === 'FORFEITED_DAMAGE' ? (
                            <span style={{ color: '#DC2626', fontWeight: 600 }}>
                              🚨 ₹500 Deposit Withheld / Forfeited for Damage Review
                            </span>
                          ) : b.is_late || (b.late_fee && b.late_fee > 0) ? (
                            <span style={{ color: '#D97706', fontWeight: 600 }}>
                              ⏱️ -₹{b.refund_amount || 401} Refunded (₹99 Late Fee Deducted)
                            </span>
                          ) : (
                            <span style={{ color: '#16A34A', fontWeight: 600 }}>
                              - ₹{b.refund_amount || b.deposit || 500} (Deposit Refunded)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.filter(b => b.utr_number).length === 0 && (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '30px', color: 'var(--z-text-muted)' }}>
                      <p style={{ fontWeight: 500 }}>No payment transactions recorded yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: REGISTERED CUSTOMERS */}
          {/* ==================================================== */}
          {activeTab === 'customers' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconUser size={14} />
                Registered Customers ({uniqueCustomers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uniqueCustomers.map(c => (
                  <div key={c.phone} className="z-card" style={{ position: 'relative' }}>
                    <div className="z-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--z-emerald-dark)' }}>{c.name || 'Customer'}</span>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span><strong>Mobile:</strong> {c.phone}</span>
                            <span><strong>Joined:</strong> {c.joiningDate ? formatDateTime(c.joiningDate).split(',')[0] : 'Recently'}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteCustomer(c.phone)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <IconX size={14} /> Delete
                        </button>
                      </div>
                      
                      <div className="z-divider-dashed" style={{ margin: '12px 0' }} />
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', fontSize: '0.8125rem' }}>
                        <div>
                          <div className="text-muted text-xs">KYC Status</div>
                          <div style={{ fontWeight: 600, color: c.kycVerified ? 'var(--z-emerald)' : '#D97706' }}>
                            {c.kycVerified ? 'Verified' : 'Pending'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">Current Status</div>
                          <div style={{ fontWeight: 600, color: c.isActive ? 'var(--z-emerald)' : 'var(--z-text-primary)' }}>
                            {c.isActive ? 'Active Ride' : 'Idle'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">Total Rides</div>
                          <div style={{ fontWeight: 600 }}>{c.totalRides}</div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">Total Spent</div>
                          <div style={{ fontWeight: 600 }}>₹{c.totalSpent}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {uniqueCustomers.length === 0 && (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '30px', color: 'var(--z-text-muted)' }}>
                      <p style={{ fontWeight: 500 }}>No customers registered yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: REGISTERED HOST PARTNERS */}
          {/* ==================================================== */}
          {activeTab === 'hosts' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconScooter size={14} />
                Registered Hosts & Partners ({uniqueHosts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uniqueHosts.map(c => (
                  <div key={c.phone} className="z-card" style={{ position: 'relative' }}>
                    <div className="z-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--z-emerald-dark)' }}>{c.name || 'Partner Host'}</span>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span><strong>Mobile:</strong> {c.phone}</span>
                            <span><strong>Joined:</strong> {c.joiningDate ? formatDateTime(c.joiningDate).split(',')[0] : 'Recently'}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteCustomer(c.phone)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <IconX size={14} /> Delete
                        </button>
                      </div>
                      
                      <div className="z-divider-dashed" style={{ margin: '12px 0' }} />
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', fontSize: '0.8125rem' }}>
                        <div>
                          <div className="text-muted text-xs">KYC Status</div>
                          <div style={{ fontWeight: 600, color: c.kycVerified ? 'var(--z-emerald)' : '#D97706' }}>
                            {c.kycVerified ? 'Verified' : 'Pending'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">Current Status</div>
                          <div style={{ fontWeight: 600, color: c.hasActiveSlot ? 'var(--z-emerald)' : 'var(--z-text-primary)' }}>
                            {c.hasActiveSlot ? 'Has Active EV Listed' : 'Idle'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">Total Slots</div>
                          <div style={{ fontWeight: 600 }}>{c.totalSlots}</div>
                        </div>
                        <div>
                          <div className="text-muted text-xs">Earned Payouts</div>
                          <div style={{ fontWeight: 600 }}>₹{c.totalEarnings}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {uniqueHosts.length === 0 && (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '30px', color: 'var(--z-text-muted)' }}>
                      <p style={{ fontWeight: 500 }}>No hosts registered yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Return & Inspection Modal for Admin */}
      {inspectModalBooking && (() => {
        const now = new Date()
        const scheduledEnd = new Date(inspectModalBooking.end_time)
        const lateDiffMs = now - scheduledEnd
        const lateMinutes = Math.max(0, Math.round(lateDiffMs / (60 * 1000)))
        const autoLate = lateMinutes > 15
        const effectiveLate = !inspectionOnTimeChecked || autoLate
        const lateFee = effectiveLate ? 99 : 0
        let refundAmount = effectiveLate ? (500 - 99) : 500
        if (inspectionHasDamage) refundAmount = 0

        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px',
              padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>
                  Return Inspection & Handover
                </h3>
                <button
                  onClick={() => setInspectModalBooking(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '0.8125rem', color: '#4B5563', marginBottom: '16px' }}>
                Complete the physical verification for Booking <strong>{inspectModalBooking.booking_code}</strong> ({inspectModalBooking.vehicle_model}).
              </div>

              {/* Requirement 1: Vehicle Condition Checked */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: '8px', cursor: 'pointer', marginBottom: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={inspectionConditionChecked}
                  onChange={(e) => setInspectionConditionChecked(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--z-emerald)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                    Vehicle Condition Checked
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                    Physical inspection verified: Key returned, helmet in place, and body checked.
                  </div>
                </div>
              </label>

              {/* Requirement 2: On-Time Dropping Check */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px',
                background: autoLate ? '#FEF2F2' : '#F9FAFB',
                border: `1px solid ${autoLate ? '#FCA5A5' : '#E5E7EB'}`,
                borderRadius: '8px', cursor: 'pointer', marginBottom: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={inspectionOnTimeChecked}
                  onChange={(e) => setInspectionOnTimeChecked(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--z-emerald)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: autoLate ? '#991B1B' : '#111827' }}>
                    On-Time Dropping Verified
                  </div>
                  <div style={{ fontSize: '0.75rem', color: autoLate ? '#7F1D1D' : '#6B7280', marginTop: '2px' }}>
                    {autoLate ? (
                      <span>⚠️ <strong>Customer is {lateMinutes} mins late!</strong> Exceeded 15-min grace period. A 1-hour late fee of ₹99 will be deducted from their security deposit.</span>
                    ) : (
                      <span>Returned within scheduled booking window or grace period (15 mins).</span>
                    )}
                  </div>
                </div>
              </label>

              {/* Requirement 3: Vehicle Damage Check */}
              <div style={{
                padding: '12px', background: inspectionHasDamage ? '#FEF2F2' : '#F9FAFB',
                border: `1px solid ${inspectionHasDamage ? '#F87171' : '#E5E7EB'}`,
                borderRadius: '8px', marginBottom: '16px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inspectionHasDamage}
                    onChange={(e) => setInspectionHasDamage(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: inspectionHasDamage ? '#991B1B' : '#111827' }}>
                      Report Vehicle Damage / Scratches
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Action: ₹500 deposit withheld pending verification of pre-ride vs post-ride inspection videos.
                    </div>
                  </div>
                </label>

                {inspectionHasDamage && (
                  <div style={{ marginTop: '10px' }}>
                    <textarea
                      placeholder="Specify damage observed (e.g., dented right mirror, front scratch)..."
                      value={inspectionDamageNotes}
                      onChange={(e) => setInspectionDamageNotes(e.target.value)}
                      style={{
                        width: '100%', minHeight: '60px', padding: '8px',
                        fontSize: '0.8125rem', border: '1px solid #FCA5A5',
                        borderRadius: '6px', resize: 'vertical'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Settlement Summary preview */}
              <div style={{
                padding: '10px 14px', background: '#F3F4F6', borderRadius: '8px',
                fontSize: '0.8125rem', marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Security Deposit:</span>
                  <span style={{ fontWeight: 600 }}>₹500</span>
                </div>
                {effectiveLate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', marginBottom: '4px' }}>
                    <span>Late Drop-off Fee (&gt;15 min):</span>
                    <span style={{ fontWeight: 600 }}>-₹{lateFee}</span>
                  </div>
                )}
                {inspectionHasDamage ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', fontWeight: 700 }}>
                    <span>Refund Status:</span>
                    <span>WITHHELD FOR VIDEO REVIEW (₹0)</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 700 }}>
                    <span>Deposit Refund to Customer:</span>
                    <span>₹{refundAmount}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleConfirmInspectionSubmit}
                  className="z-btn z-btn-primary"
                  style={{ flex: 1 }}
                  disabled={!inspectionConditionChecked}
                >
                  Confirm & Mark Ride Completed
                </button>
                <button
                  onClick={() => setInspectModalBooking(null)}
                  className="z-btn z-btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </PageShell>
  )
}
