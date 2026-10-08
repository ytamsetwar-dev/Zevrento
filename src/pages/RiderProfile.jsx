// =============================================
// Zevrento — Rider Profile Page
// =============================================
import { useApp } from '../lib/store.jsx'
import { PRICING } from '../lib/data.js'
import { PageShell, RiderBottomNav } from '../components/Layout.jsx'
import { IconUser, IconPhone, IconScooter, IconDollar, IconMapPin } from '../components/Icons.jsx'

export default function RiderProfile() {
  const { user, availabilitySlots, bookings, updateProfile } = useApp()

  // Calculate actual earnings from completed bookings
  const lifetimeEarnings = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.host_payout || 0), 0)

  return (
    <PageShell nav={<RiderBottomNav />}>
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">
          <div className="animate-fade-in-up">
            {/* Avatar */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '72px', height: '72px',
                background: 'var(--z-emerald-light)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <IconScooter size={32} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <h2>{user?.name || 'Host'}</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginTop: '4px' }}>
                Rider / Host Account
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="z-card">
                <div className="z-card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'var(--z-off-white)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconPhone size={18} style={{ color: 'var(--z-text-muted)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', fontWeight: 500 }}>Phone</div>
                    <div style={{ fontWeight: 600 }}>{user?.phone || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="z-card">
                <div className="z-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px',
                        background: 'var(--z-off-white)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconMapPin size={18} style={{ color: 'var(--z-text-muted)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', fontWeight: 500 }}>Default Pickup Address</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.address || 'No address set'}</div>
                      </div>
                    </div>
                    <button 
                      className="z-btn z-btn-sm" 
                      style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', color: 'var(--z-text-primary)' }}
                      onClick={() => {
                        const addr = window.prompt('Enter your default pickup address:', user?.address || '')
                        if (addr !== null && updateProfile) {
                          updateProfile({ address: addr })
                        }
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="z-card">
                <div className="z-card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'var(--z-off-white)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconDollar size={18} style={{ color: 'var(--z-text-muted)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', fontWeight: 500 }}>Lifetime Earnings</div>
                    <div style={{ fontWeight: 700, color: 'var(--z-emerald)' }}>₹{lifetimeEarnings}</div>
                  </div>
                </div>
              </div>

              <div className="z-card">
                <div className="z-card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'var(--z-off-white)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconUser size={18} style={{ color: 'var(--z-text-muted)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', fontWeight: 500 }}>Total Slots Listed</div>
                    <div style={{ fontWeight: 600 }}>{availabilitySlots.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
