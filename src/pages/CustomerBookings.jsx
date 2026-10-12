// =============================================
// Zevrento — Customer Bookings List
// =============================================
import { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { formatDateTime, BOOKING_STATUS } from '../lib/data.js'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { IconList, IconClock, IconScooter, IconCheck, IconAlertTriangle } from '../components/Icons.jsx'

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
  [BOOKING_STATUS.ACTIVE]: 'Active Ride',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.EXPIRED]: 'Expired',
}

export default function CustomerBookings() {
  const { bookings, user, refreshData, requestReturnRide } = useApp()
  const [returnConfirmId, setReturnConfirmId] = useState(null)
  const [returnLoading, setReturnLoading] = useState(false)

  const customerBookings = bookings.filter((b) => {
    if (!user?.phone) return true
    return b.customer_phone === user.phone || !b.customer_phone
  })

  const handleInitiateReturn = async (bookingId) => {
    setReturnLoading(true)
    try {
      await requestReturnRide(bookingId)
      alert("✅ Return request submitted! Please present the vehicle, helmet, and key to the host for physical inspection.")
      setReturnConfirmId(null)
    } catch (err) {
      alert("Failed to submit return request: " + err.message)
    } finally {
      setReturnLoading(false)
    }
  }

  return (
    <PageShell nav={<CustomerBottomNav />}>
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>My Bookings ({customerBookings.length})</h2>
            <button
              onClick={refreshData}
              style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>

          {customerBookings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--z-text-muted)',
            }}>
              <IconList size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontWeight: 500 }}>No bookings yet</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                Search for EVs and book your first ride!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customerBookings.map((booking, idx) => {
                const now = new Date()
                const scheduledEnd = new Date(booking.end_time)
                const isLateOver15 = (now - scheduledEnd) > (15 * 60 * 1000)
                const lateMinutes = Math.max(0, Math.round((now - scheduledEnd) / (60 * 1000)))

                return (
                  <div
                    key={booking.id}
                    className={`z-card animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="z-card-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.9375rem',
                          color: 'var(--z-emerald)',
                        }}>
                          {booking.booking_code}
                        </span>
                        <span className={`z-badge ${STATUS_STYLES[booking.status]}`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <IconScooter size={16} style={{ color: 'var(--z-text-muted)' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {booking.vehicle_model}
                        </span>
                      </div>

                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '6px', fontSize: '0.75rem', color: 'var(--z-text-muted)',
                      }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>Pickup: </span>
                          <span style={{ color: 'var(--z-text-secondary)' }}>{formatDateTime(booking.start_time)}</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 500 }}>Drop-off: </span>
                          <span style={{ color: 'var(--z-text-secondary)' }}>{formatDateTime(booking.end_time)}</span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: '12px', paddingTop: '12px',
                        borderTop: '1px solid var(--z-border-light)',
                        fontSize: '0.8125rem',
                      }}>
                        <span className="text-muted">Total Paid</span>
                        <span style={{ fontWeight: 700 }}>₹{booking.total_amount} (incl. ₹500 Deposit)</span>
                      </div>

                      {/* Pickup OTP */}
                      {booking.pickup_otp && booking.status === BOOKING_STATUS.CONFIRMED && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px',
                          background: 'var(--z-emerald-ultra-light)',
                          borderRadius: 'var(--z-radius)',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Pickup Handover OTP
                          </div>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            fontFamily: "'Courier New', monospace",
                            color: 'var(--z-emerald)',
                            letterSpacing: '0.3em',
                            marginTop: '4px',
                          }}>
                            {booking.pickup_otp}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', marginTop: '4px' }}>
                            Show this to host to collect keys
                          </div>
                        </div>
                      )}

                      {/* ACTIVE RIDE ACTIONS & DROP-OFF STATUS */}
                      {booking.status === BOOKING_STATUS.ACTIVE && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--z-border)' }}>
                          {isLateOver15 && (
                            <div style={{
                              padding: '10px 12px',
                              background: '#FEF2F2',
                              border: '1px solid #FCA5A5',
                              borderRadius: '8px',
                              marginBottom: '10px',
                              fontSize: '0.75rem',
                              color: '#991B1B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <IconAlertTriangle size={18} />
                              <div>
                                <strong>Drop-off Delayed ({lateMinutes}m late):</strong> Exceeded 15-min grace period. A 1-hr late fee of ₹99 will be deducted from your deposit upon return.
                              </div>
                            </div>
                          )}

                          {booking.return_requested ? (
                            <div style={{
                              padding: '10px 12px',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              borderRadius: '8px',
                              fontSize: '0.8125rem',
                              color: '#065F46',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: 600
                            }}>
                              <IconCheck size={16} /> Return initiated! Host is inspecting the EV for key & condition.
                            </div>
                          ) : (
                            <div>
                              {returnConfirmId === booking.id ? (
                                <div style={{
                                  padding: '12px',
                                  background: 'var(--z-surface-elevated, #F9FAFB)',
                                  border: '1px solid var(--z-border)',
                                  borderRadius: '8px',
                                }}>
                                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                                    Ready to drop off vehicle?
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--z-text-muted)', marginBottom: '10px' }}>
                                    Make sure the EV is safely parked, with key and helmet ready for host inspection.
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      className="z-btn z-btn-primary z-btn-sm"
                                      onClick={() => handleInitiateReturn(booking.id)}
                                      disabled={returnLoading}
                                      style={{ flex: 1 }}
                                    >
                                      {returnLoading ? 'Notifying Host...' : 'Confirm Drop-off & Notify Host'}
                                    </button>
                                    <button
                                      className="z-btn z-btn-outline z-btn-sm"
                                      onClick={() => setReturnConfirmId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className="z-btn z-btn-primary z-btn-full"
                                  onClick={() => setReturnConfirmId(booking.id)}
                                  style={{ fontWeight: 600 }}
                                >
                                  🏁 Drop-off / Return EV at Hub
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* COMPLETED RIDE: SYSTEMATIC DEPOSIT & INSPECTION BREAKDOWN */}
                      {booking.status === BOOKING_STATUS.COMPLETED && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--z-border-light)' }}>
                          {booking.has_damage || booking.deposit_status === 'WITHHELD_FOR_DAMAGE_REVIEW' ? (
                            <div style={{
                              padding: '12px',
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              borderRadius: '8px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 700, fontSize: '0.8125rem' }}>
                                <IconAlertTriangle size={16} /> 🚨 Deposit Withheld for Damage Review
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '4px' }}>
                                Host reported vehicle condition issues during return: <em>"{booking.damage_notes || 'Damage noted during return inspection'}"</em>.
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: '#B91C1C', marginTop: '6px', background: '#FEE2E2', padding: '6px 8px', borderRadius: '4px' }}>
                                ℹ️ <strong>System Action:</strong> Security deposit (₹500) will NOT be refunded pending Admin verification of pre-ride vs post-ride inspection videos.
                              </div>
                            </div>
                          ) : booking.is_late || (booking.late_fee && booking.late_fee > 0) ? (
                            <div style={{
                              padding: '12px',
                              background: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              borderRadius: '8px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: 700, fontSize: '0.8125rem' }}>
                                <IconClock size={16} /> ⏱️ Late Drop-off Penalty Deducted
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '4px' }}>
                                Dropped off {booking.late_minutes || '>15'} mins late (exceeded 15m grace window). 1 extra hour fee of ₹{booking.late_fee || 99} charged from security deposit.
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #FCD34D', color: '#047857' }}>
                                <span>Deposit Refunded to Account:</span>
                                <span>₹{booking.refund_amount !== undefined ? booking.refund_amount : (500 - (booking.late_fee || 99))}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              padding: '10px 12px',
                              background: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              borderRadius: '8px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.8125rem' }}>
                                <IconCheck size={16} /> ✅ On-Time Return & Clean Inspection
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '4px' }}>
                                Vehicle condition and on-time drop-off verified by host. Full security deposit of ₹{booking.refund_amount || 500} released to original payment method.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

