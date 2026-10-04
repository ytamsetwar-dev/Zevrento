import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useApp } from '../lib/store.jsx'
import { BOOKING_STATUS, PRICING, formatDateTime } from '../lib/data.js'
import { PageShell } from '../components/Layout.jsx'
import { IconShield, IconCheck, IconSearch, IconClipboard, IconRefresh, IconScooter, IconX, IconUser, IconDollar } from '../components/Icons.jsx'

const STATUS_STYLES = {
  [BOOKING_STATUS.PENDING_KYC]: 'z-badge-warning',
  [BOOKING_STATUS.CONFIRMED]: 'z-badge-info',
  [BOOKING_STATUS.ACTIVE]: 'z-badge-emerald',
  [BOOKING_STATUS.COMPLETED]: 'z-badge-neutral',
  [BOOKING_STATUS.CANCELLED]: 'z-badge-danger',
  [BOOKING_STATUS.EXPIRED]: 'z-badge-danger',
}

const STATUS_LABELS = {
  [BOOKING_STATUS.PENDING_KYC]: 'Pending KYC',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.ACTIVE]: 'Active',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.EXPIRED]: 'Expired',
}

export default function AdminHubPanel() {
  const { bookings, availabilitySlots, approveBooking, completeBooking, updateBookingStatus } = useApp()
  const [activeTab, setActiveTab] = useState('bookings') // bookings, transactions, customers, hosts
  const [tokenSearch, setTokenSearch] = useState('')
  const [activeOTP, setActiveOTP] = useState(null)
  const [verifyOTPInput, setVerifyOTPInput] = useState('')
  const [dispatchBookingId, setDispatchBookingId] = useState(null)

  const [dbProfiles, setDbProfiles] = useState([])

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('*')
      if (data) setDbProfiles(data)
    }
    fetchProfiles()
  }, [])

  const filteredBookings = tokenSearch.trim()
    ? bookings.filter((b) => b.booking_code.toLowerCase().includes(tokenSearch.toLowerCase().replace('#', '')))
    : bookings

  // Derive unique customers from db and bookings
  const uniqueCustomers = useMemo(() => {
    const customers = {}
    dbProfiles.filter(p => p.role === 'CUSTOMER').forEach(p => {
      customers[p.phone] = { phone: p.phone, name: p.full_name, totalRides: 0, totalSpent: 0 }
    })
    bookings.forEach(b => {
      if (b.customer_phone) {
        if (!customers[b.customer_phone]) {
          customers[b.customer_phone] = { phone: b.customer_phone, name: 'Unknown', totalRides: 0, totalSpent: 0 }
        }
        customers[b.customer_phone].totalRides += 1
        customers[b.customer_phone].totalSpent += b.total_amount
      }
    })
    return Object.values(customers)
  }, [bookings, dbProfiles])

  // Derive unique hosts from db and availability slots
  const uniqueHosts = useMemo(() => {
    const hosts = {}
    dbProfiles.filter(p => p.role === 'RIDER').forEach(p => {
      hosts[p.phone] = { phone: p.phone, name: p.full_name, totalSlots: 0, totalEarnings: 0 }
    })
    availabilitySlots.forEach(s => {
      if (s.host_phone) {
        if (!hosts[s.host_phone]) {
          hosts[s.host_phone] = { phone: s.host_phone, name: 'Unknown', totalSlots: 0, totalEarnings: 0 }
        }
        hosts[s.host_phone].totalSlots += 1
        const hours = Math.ceil((new Date(s.end_time) - new Date(s.start_time)) / (1000 * 60 * 60))
        hosts[s.host_phone].totalEarnings += (hours * PRICING.hostPayout)
      }
    })
    return Object.values(hosts)
  }, [availabilitySlots, dbProfiles])

  const handleApprove = (bookingId) => {
    const otp = approveBooking(bookingId)
    setActiveOTP({ bookingId, otp })
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
    }
  }

  const handleComplete = (booking) => {
    completeBooking(booking.id)
  }

  return (
    <PageShell title="Zevrento Hub Control">
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          {/* Header Badge */}
          <div className="animate-fade-in-up" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '24px',
            padding: '12px 16px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--z-radius-md)',
            fontSize: '0.8125rem', fontWeight: 600, color: '#92400E',
          }}>
            <IconShield size={18} />
            Admin Access — Hub Operator Panel
          </div>

          {/* Tabs */}
          <div className="admin-tabs animate-fade-in-up" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['bookings', 'transactions', 'customers', 'hosts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--z-radius-full)',
                  border: 'none',
                  background: activeTab === tab ? 'var(--z-emerald)' : 'var(--z-off-white)',
                  color: activeTab === tab ? '#fff' : 'var(--z-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'bookings' && (
            <div className="animate-fade-in-up stagger-1">
              {/* Token Search */}
              <div className="admin-section">
                <div className="admin-section-title">
                  <IconSearch size={14} />
                  Live Booking Verifier
                </div>
                <div className="z-input-group" style={{ marginBottom: '16px' }}>
                  <input
                    className="z-input"
                    type="text"
                    placeholder="Search by token (e.g. #BK-7X9Q)"
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    style={{ fontFamily: "'Courier New', monospace" }}
                  />
                </div>
              </div>

              {/* Bookings List */}
              <div className="admin-section">
                <div className="admin-section-title">
                  <IconClipboard size={14} />
                  All Bookings ({filteredBookings.length})
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="z-card">
                    <div className="z-card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--z-text-muted)' }}>
                      <IconClipboard size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p>{tokenSearch ? 'No matching bookings' : 'No bookings yet'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="booking-list">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="booking-item">
                        <div className="booking-item-header">
                          <span className="booking-item-code">{booking.booking_code}</span>
                          <span className={`z-badge ${STATUS_STYLES[booking.status]}`}>
                            {STATUS_LABELS[booking.status]}
                          </span>
                        </div>

                        <div className="booking-item-details">
                          <span className="label">Vehicle</span>
                          <span className="value">{booking.vehicle_model}</span>
                          <span className="label">Customer</span>
                          <span className="value">{booking.customer_phone || '—'}</span>
                          <span className="label">Hub</span>
                          <span className="value">{booking.hub_name}</span>
                          <span className="label">Duration</span>
                          <span className="value">{booking.duration}h</span>
                          <span className="label">UTR</span>
                          <span className="value" style={{ fontFamily: "'Courier New', monospace", fontSize: '0.75rem' }}>
                            {booking.utr_number || '—'}
                          </span>
                          <span className="label">Total</span>
                          <span className="value" style={{ color: 'var(--z-emerald)', fontWeight: 700 }}>₹{booking.total_amount}</span>
                          <span className="label">Pickup</span>
                          <span className="value" style={{ fontSize: '0.6875rem' }}>{formatDateTime(booking.start_time)}</span>
                          <span className="label">Drop-off</span>
                          <span className="value" style={{ fontSize: '0.6875rem' }}>{formatDateTime(booking.end_time)}</span>
                        </div>

                        {/* ---- PENDING KYC: Approve ---- */}
                        {booking.status === BOOKING_STATUS.PENDING_KYC && (
                          <div className="admin-actions">
                            <button
                              className="z-btn z-btn-primary z-btn-sm"
                              onClick={() => handleApprove(booking.id)}
                              style={{ flex: 1 }}
                            >
                              <IconCheck size={14} />
                              Approve KYC & Issue OTP
                            </button>
                            <button
                              className="z-btn z-btn-outline z-btn-sm"
                              onClick={() => updateBookingStatus(booking.id, BOOKING_STATUS.CANCELLED)}
                              style={{ color: 'var(--z-danger)', borderColor: 'var(--z-danger)' }}
                            >
                              <IconX size={14} />
                            </button>
                          </div>
                        )}

                        {/* OTP Display after approval */}
                        {activeOTP?.bookingId === booking.id && booking.status === BOOKING_STATUS.CONFIRMED && (
                          <div className="otp-display">
                            <div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Pickup OTP Issued
                              </div>
                              <div className="otp-digits">{activeOTP.otp}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', marginTop: '4px' }}>
                                Sent to customer — Verify at hub pickup
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ---- CONFIRMED: Hub Dispatch ---- */}
                        {booking.status === BOOKING_STATUS.CONFIRMED && (
                          <div style={{ marginTop: '12px' }}>
                            {dispatchBookingId === booking.id ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  className="z-input"
                                  type="text"
                                  placeholder="Enter customer's 4-digit OTP"
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
                                <IconScooter size={14} />
                                Hub Dispatch — Verify OTP
                              </button>
                            )}
                          </div>
                        )}

                        {/* ---- ACTIVE: Return & Complete ---- */}
                        {booking.status === BOOKING_STATUS.ACTIVE && (
                          <div style={{ marginTop: '12px' }}>
                            <button
                              className="z-btn z-btn-primary z-btn-sm z-btn-full"
                              onClick={() => handleComplete(booking)}
                            >
                              <IconRefresh size={14} />
                              Complete Return — Refund ₹{booking.deposit} & Credit Host
                            </button>
                          </div>
                        )}

                        {/* ---- COMPLETED: Settlement info ---- */}
                        {booking.status === BOOKING_STATUS.COMPLETED && (
                          <div style={{
                            marginTop: '12px',
                            display: 'flex', flexDirection: 'column', gap: '6px',
                          }}>
                            <div style={{
                              padding: '8px 12px',
                              background: 'var(--z-emerald-ultra-light)',
                              borderRadius: 'var(--z-radius-sm)',
                              fontSize: '0.75rem', fontWeight: 600, color: 'var(--z-emerald-dark)',
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                              <IconCheck size={14} />
                              Deposit ₹{booking.deposit} refunded to customer via UPI
                            </div>
                            <div style={{
                              padding: '8px 12px',
                              background: '#F0F9FF',
                              borderRadius: 'var(--z-radius-sm)',
                              fontSize: '0.75rem', fontWeight: 600, color: '#0C4A6E',
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                              <IconCheck size={14} />
                              Host payout ₹{booking.host_payout} credited
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

          {activeTab === 'transactions' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconDollar size={14} />
                Payment Transaction History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bookings.filter(b => b.utr_number).map(b => (
                  <div key={b.id} className="z-card">
                    <div className="z-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--z-emerald)' }}>+ ₹{b.total_amount}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)' }}>{formatDateTime(b.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-primary)' }}>
                        <strong>Customer:</strong> {b.customer_phone}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-primary)', marginTop: '4px' }}>
                        <strong>UTR:</strong> <span style={{ fontFamily: "'Courier New', monospace" }}>{b.utr_number}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)', marginTop: '4px' }}>
                        Booking Token: {b.booking_code}
                      </div>
                      {b.status === BOOKING_STATUS.COMPLETED && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--z-border)', fontSize: '0.8125rem', color: '#991B1B', fontWeight: 600 }}>
                          - ₹{b.deposit} (Deposit Refunded)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.filter(b => b.utr_number).length === 0 && (
                  <p style={{ color: 'var(--z-text-muted)', fontSize: '0.875rem' }}>No payment transactions yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconUser size={14} />
                Registered Customers ({uniqueCustomers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uniqueCustomers.map(c => (
                  <div key={c.phone} className="z-card">
                    <div className="z-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{c.name} ({c.phone})</span>
                        <span className="z-badge z-badge-emerald">Account Created</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginTop: '8px' }}>
                        Total Rides: {c.totalRides} | Total Spent: ₹{c.totalSpent}
                      </div>
                    </div>
                  </div>
                ))}
                {uniqueCustomers.length === 0 && (
                  <p style={{ color: 'var(--z-text-muted)', fontSize: '0.875rem' }}>No customers yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hosts' && (
            <div className="animate-fade-in-up stagger-1">
              <div className="admin-section-title">
                <IconScooter size={14} />
                Registered Hosts ({uniqueHosts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uniqueHosts.map(h => (
                  <div key={h.phone} className="z-card">
                    <div className="z-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{h.name} ({h.phone})</span>
                        <span className="z-badge z-badge-info">Active Host</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginTop: '8px' }}>
                        Listed Slots: {h.totalSlots} | Estimated Lifetime Earnings: ₹{h.totalEarnings}
                      </div>
                    </div>
                  </div>
                ))}
                {uniqueHosts.length === 0 && (
                  <p style={{ color: 'var(--z-text-muted)', fontSize: '0.875rem' }}>No hosts registered yet.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </PageShell>
  )
}
