// =============================================
// Zevrento — Customer Bookings List
// =============================================
import { useApp } from '../lib/store.jsx'
import { formatDateTime, BOOKING_STATUS } from '../lib/data.js'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { IconList, IconClock, IconScooter } from '../components/Icons.jsx'

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

export default function CustomerBookings() {
  const { bookings } = useApp()

  const customerBookings = bookings.filter(() => true) // In production, filter by user

  return (
    <PageShell nav={<CustomerBottomNav />}>
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          <h2 style={{ marginBottom: '20px' }}>My Bookings</h2>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {customerBookings.map((booking, idx) => (
                <div
                  key={booking.id}
                  className={`z-card animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
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
                      <span className="text-muted">Total</span>
                      <span style={{ fontWeight: 700 }}>₹{booking.total_amount}</span>
                    </div>

                    {booking.pickup_otp && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: 'var(--z-emerald-ultra-light)',
                        borderRadius: 'var(--z-radius)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Pickup OTP
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
                          Show this at the hub to collect your EV
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
