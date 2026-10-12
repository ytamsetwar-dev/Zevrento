// =============================================
// Zevrento — Rider/Host Profile Page
// Host earnings, address, KYC verification, Notification Preferences,
// About Us, Contact Us, Host FAQ, Terms & Privacy Policy
// =============================================
import { useApp } from '../lib/store.jsx'
import { PageShell, RiderBottomNav } from '../components/Layout.jsx'
import { 
  IconUser, 
  IconPhone, 
  IconScooter, 
  IconDollar, 
  IconMapPin, 
  IconShield,
  IconClock,
  IconCheck,
  IconWhatsApp,
  IconAlertTriangle,
  IconZap
} from '../components/Icons.jsx'
import { 
  NotificationPreferencesCard,
  ProfileAccordionItem,
  AboutUsContent,
  ContactUsContent,
  FaqContent,
  TermsConditionsContent,
  PrivacyPolicyContent
} from '../components/ProfileSupportSections.jsx'

export default function RiderProfile() {
  const { user, availabilitySlots, bookings, updateProfile, submitKyc } = useApp()

  // Calculate actual earnings from completed bookings
  const lifetimeEarnings = bookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.host_payout || 0), 0)

  const isKycVerified = user?.kyc_status === 'VERIFIED' || user?.kyc_verified
  const isKycPending = user?.kyc_status === 'PENDING'

  const handleKycWhatsApp = async (e) => {
    e.preventDefault()
    if (submitKyc) await submitKyc()
    window.open(
      `https://wa.me/917020905724?text=${encodeURIComponent(
        `Hi Zevrento, I want to verify my Host Partner KYC (Aadhaar, DL & Vehicle RC) for my payout account.\nName: ${user?.name || user?.full_name || 'Host Partner'}\nPhone: ${user?.phone || ''}`
      )}`,
      '_blank'
    )
  }

  return (
    <PageShell nav={<RiderBottomNav />}>
      <div style={{ padding: '20px 16px 80px' }}>
        <div className="z-container">
          <div className="animate-fade-in-up">
            {/* Host Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.2)',
                  border: '3px solid #FFFFFF',
                }}
              >
                <IconScooter size={36} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                {user?.name || user?.full_name || 'Host Partner'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                <span
                  style={{
                    background: 'var(--z-emerald-ultra-light)',
                    color: 'var(--z-emerald-dark)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ⚡ Verified EV Host
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                  📱 {user?.phone || '—'}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="z-card" style={{ padding: '16px', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Lifetime Earnings
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--z-emerald)', marginTop: '4px' }}>
                  ₹{lifetimeEarnings}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '2px' }}>
                  Direct UPI settlements
                </div>
              </div>

              <div className="z-card" style={{ padding: '16px', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Active Slots Listed
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                  {availabilitySlots.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '2px' }}>
                  Idle hours monetized
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Pickup Address Card */}
              <div className="z-card" style={{ borderRadius: '18px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--z-off-white)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--z-emerald)',
                      }}
                    >
                      <IconMapPin size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--z-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Default Handover Location
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                        {user?.address || 'No pickup address configured'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="z-btn z-btn-sm"
                    style={{
                      background: 'var(--z-surface)',
                      border: '1px solid var(--z-border)',
                      color: 'var(--z-text-primary)',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const addr = window.prompt('Enter your preferred vehicle handover address in Hyderabad:', user?.address || '')
                      if (addr !== null && updateProfile) {
                        updateProfile({ address: addr })
                      }
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Host KYC & Vehicle Registration Status */}
              <div
                className="z-card"
                style={{
                  borderRadius: '18px',
                  border: isKycVerified ? '1px solid #A7F3D0' : isKycPending ? '1px solid #FDE68A' : '1px solid #FECACA',
                  background: isKycVerified ? '#F0FDF4' : isKycPending ? '#FFFBEB' : '#FEF2F2',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: isKycVerified ? '#DCFCE7' : isKycPending ? '#FEF3C7' : '#FEE2E2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isKycVerified ? '#16A34A' : isKycPending ? '#D97706' : '#DC2626',
                        flexShrink: 0,
                      }}
                    >
                      <IconShield size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
                        Host & Vehicle Verification
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '2px', color: '#111827' }}>
                        {isKycVerified ? (
                          <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheck size={18} /> Verified Host Partner
                          </span>
                        ) : isKycPending ? (
                          <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconClock size={16} /> Verification Under Review
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconAlertTriangle size={16} /> Action Required: Submit RC & KYC
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#4B5563', marginTop: '6px', lineHeight: '1.5' }}>
                        {isKycVerified
                          ? 'Your Aadhaar and Vehicle RC are verified. Your listings are active on the customer search engine and settlements are enabled.'
                          : 'Valid Vehicle RC, active insurance and Aadhaar are required to receive customer bookings and automated payouts.'}
                      </p>
                    </div>
                  </div>
                </div>

                {!isKycVerified && (
                  <button
                    className="z-btn z-btn-full"
                    onClick={handleKycWhatsApp}
                    style={{
                      marginTop: '14px',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <IconWhatsApp size={18} />
                    {isKycPending ? 'Update Host Verification on WhatsApp' : 'Verify Vehicle & KYC via WhatsApp'}
                  </button>
                )}
              </div>

              {/* Notification Preferences */}
              <NotificationPreferencesCard role="RIDER" />

              {/* Expandable Information & Legal Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* About Us */}
                <ProfileAccordionItem
                  title="About Zevrento Platform"
                  icon={IconZap}
                  badge="P2P Ecosystem"
                >
                  <AboutUsContent role="RIDER" />
                </ProfileAccordionItem>

                {/* Contact Us */}
                <ProfileAccordionItem
                  title="Host Partner Support & Helpline"
                  icon={IconPhone}
                  badge="7 AM - 11 PM"
                >
                  <ContactUsContent />
                </ProfileAccordionItem>

                {/* Host FAQ */}
                <ProfileAccordionItem
                  title="Host Frequently Asked Questions (FAQ)"
                  icon={IconDollar}
                  badge="Payouts & Safety"
                >
                  <FaqContent role="RIDER" />
                </ProfileAccordionItem>

                {/* Terms and Conditions */}
                <ProfileAccordionItem
                  title="Host Terms & Conditions"
                  icon={IconShield}
                  badge="Platform Intermediary"
                >
                  <TermsConditionsContent role="RIDER" />
                </ProfileAccordionItem>

                {/* Privacy Policy */}
                <ProfileAccordionItem
                  title="Privacy Policy"
                  icon={IconShield}
                  badge="Data Security"
                >
                  <PrivacyPolicyContent role="RIDER" />
                </ProfileAccordionItem>
              </div>

              {/* Platform Legal Intermediary Disclaimer */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  padding: '12px 16px',
                  lineHeight: '1.5',
                }}
              >
                Zevrento operates strictly as a digital technology intermediary connecting vehicle hosts with riders under Section 79 of the Information Technology Act.
                <br />
                © {new Date().getFullYear()} Zevrento • Powered by Coderware Technologies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
