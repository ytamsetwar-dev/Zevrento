// =============================================
// Zevrento — Customer Profile Page
// =============================================
import { useApp } from '../lib/store.jsx'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { IconUser, IconPhone, IconShield } from '../components/Icons.jsx'

export default function CustomerProfile() {
  const { user, verifyUserKyc, submitKyc } = useApp()

  return (
    <PageShell nav={<CustomerBottomNav />}>
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
                <IconUser size={32} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <h2>{user?.name || 'User'}</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--z-text-muted)', marginTop: '4px' }}>
                {user?.role === 'CUSTOMER' ? 'Customer Account' : user?.role}
              </p>
            </div>

            {/* Info Cards */}
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
                <div className="z-card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'var(--z-off-white)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconShield size={18} style={{ color: 'var(--z-text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', fontWeight: 500 }}>KYC Status</div>
                    <div style={{ fontWeight: 600, marginTop: '4px' }}>
                      {user?.kyc_status === 'VERIFIED' || user?.kyc_verified ? (
                        <span className="z-badge z-badge-emerald">Verified</span>
                      ) : user?.kyc_status === 'PENDING' ? (
                        <span className="z-badge z-badge-warning" style={{ background: '#FEF08A', color: '#854D0E' }}>
                          <IconClock size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                          Verification in Progress
                        </span>
                      ) : (
                        <span className="z-badge z-badge-danger">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                  {(!user?.kyc_verified && user?.kyc_status !== 'PENDING') && (
                    <a 
                      href="https://wa.me/917020905724?text=Hi%2C%20I%20want%20to%20complete%20my%20KYC%20verification%20for%20my%20Zevrento%20account."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="z-btn z-btn-outline" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                      onClick={() => submitKyc()}
                    >
                      Complete KYC
                    </a>
                  )}
                </div>
              </div>

              <div className="z-card" style={{ marginTop: '8px' }}>
                <div className="z-card-body">
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--z-text-light)', textAlign: 'center', lineHeight: 1.6,
                  }}>
                    Zevrento uses WhatsApp for KYC verification.<br />
                    No personal documents are stored on our servers.<br />
                    Your privacy is our priority.
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
