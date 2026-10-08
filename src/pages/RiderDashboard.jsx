// =============================================
// Zevrento — Rider/Host Dashboard
// Stats overview + Active listed slots
// =============================================
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { PRICING, formatDateTime } from '../lib/data.js'
import { PageShell, RiderBottomNav } from '../components/Layout.jsx'
import { IconScooter, IconDollar, IconZap, IconPlus, IconClock } from '../components/Icons.jsx'

export default function RiderDashboard() {
  const { availabilitySlots, bookings, user, deleteSlot, refreshData } = useApp()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const activeSlots = availabilitySlots.filter((s) => !s.is_booked).length
    const totalSlots = availabilitySlots.length
    
    // Calculate total hours listed vs booked
    const totalHours = availabilitySlots.reduce((sum, s) => {
      const diff = (new Date(s.end_time) - new Date(s.start_time)) / (1000 * 60 * 60)
      return sum + Math.ceil(diff)
    }, 0)

    // Only count payouts for BOOKED slots
    const totalPayouts = availabilitySlots.filter(s => s.is_booked).reduce((sum, s) => {
      const diff = (new Date(s.end_time) - new Date(s.start_time)) / (1000 * 60 * 60)
      return sum + (Math.ceil(diff) * PRICING.hostPayout)
    }, 0)

    return { activeSlots, totalSlots, totalPayouts, totalHours }
  }, [availabilitySlots])

  const bookedSlots = availabilitySlots.filter(s => s.is_booked)

  return (
    <PageShell nav={<RiderBottomNav />}>
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          {/* Welcome */}
          <div className="animate-fade-in-up" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '4px' }}>Welcome, {user?.name || 'Host'} 👋</h2>
            <p className="text-sm text-muted">Manage your idle EV listings and track earnings</p>
          </div>

          {/* Actionable Notifications */}
          {bookedSlots.length > 0 && (
            <div className="z-card animate-fade-in-up stagger-1" style={{ marginBottom: '24px', background: '#FEF9C3', borderColor: '#FDE047' }}>
              <div className="z-card-body">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <IconZap size={24} style={{ color: '#CA8A04', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#854D0E', fontSize: '0.9375rem' }}>Upcoming Booking!</div>
                    <div style={{ fontSize: '0.8125rem', color: '#A16207', marginTop: '4px', lineHeight: 1.5 }}>
                      You have an upcoming booking! The customer will come directly to your location to pick up the <b>{bookedSlots[0].model}</b>. Please keep the vehicle ready at least <b>10 mins before</b> the pickup time.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="z-stat-grid animate-fade-in-up stagger-1" style={{ marginBottom: '24px' }}>
            <div className="z-stat-card">
              <div className="z-stat-value" style={{ color: 'var(--z-emerald)' }}>
                {stats.activeSlots}
              </div>
              <div className="z-stat-label">Active Slots</div>
            </div>
            <div className="z-stat-card">
              <div className="z-stat-value">₹{stats.totalPayouts}</div>
              <div className="z-stat-label">Earned Payouts</div>
            </div>
            <div className="z-stat-card">
              <div className="z-stat-value">{stats.totalHours}h</div>
              <div className="z-stat-label">Listed Hours</div>
            </div>
          </div>

          {/* Earnings Banner */}
          <div className="z-card animate-fade-in-up stagger-2" style={{ marginBottom: '24px', border: '1px solid var(--z-emerald-light)', background: 'var(--z-emerald-ultra-light)' }}>
            <div className="z-card-body" style={{ textAlign: 'center' }}>
              <IconDollar size={24} style={{ color: 'var(--z-emerald)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8125rem', color: 'var(--z-emerald-dark)', fontWeight: 500, marginBottom: '4px' }}>
                You earn
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--z-emerald)' }}>
                ₹{PRICING.hostPayout}/hr
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--z-emerald-dark)', marginTop: '4px' }}>
                List 6 idle hours = ₹420/day • ₹12,000+/month
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
                Your Listings
              </h3>
              <button 
                onClick={refreshData}
                style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Refresh
              </button>
            </div>

            {availabilitySlots.length === 0 ? (
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
                {availabilitySlots.map((slot) => {
                  const hours = Math.ceil((new Date(slot.end_time) - new Date(slot.start_time)) / (1000 * 60 * 60))
                  return (
                    <div key={slot.id} className="z-card">
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
                            <span className={`z-badge ${slot.is_booked ? 'z-badge-emerald' : 'z-badge-info'}`}>
                              {slot.is_booked ? 'Booked' : 'Available'}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginBottom: '6px' }}>
                          {slot.plate}
                        </div>

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

                        <div style={{
                          marginTop: '12px', paddingTop: '12px',
                          borderTop: '1px solid var(--z-border-light)',
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '0.8125rem',
                        }}>
                          {slot.is_booked ? (
                            <>
                              <span className="text-muted">{hours}h Booked × ₹{PRICING.hostPayout}/hr</span>
                              <span style={{ fontWeight: 700, color: 'var(--z-emerald)' }}>₹{hours * PRICING.hostPayout} Earned</span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted">{hours}h Available for Booking</span>
                              <span style={{ fontWeight: 600, color: 'var(--z-text-light)' }}>Potential: ₹{hours * PRICING.hostPayout}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
