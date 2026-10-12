// =============================================
// Zevrento — Customer Profile Page
// User profile, KYC status, Notification Preferences,
// About Us, Contact Us, FAQ, Terms & Privacy Policy
// =============================================
import { useApp } from '../lib/store.jsx'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { 
  IconUser, 
  IconPhone, 
  IconShield, 
  IconClock, 
  IconWhatsApp, 
  IconZap,
  IconCheck,
  IconAlertTriangle 
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

export default function CustomerProfile() {
  const { user, submitKyc } = useApp()

  const isKycVerified = user?.kyc_status === 'VERIFIED' || user?.kyc_verified
  const isKycPending = user?.kyc_status === 'PENDING'

  const handleKycWhatsApp = async (e) => {
    e.preventDefault()
    if (submitKyc) await submitKyc()
    window.open(
      `https://wa.me/917020905724?text=${encodeURIComponent(
        `Hi Zevrento, I want to complete KYC verification for my Customer account.\nName: ${user?.name || user?.full_name || 'Customer'}\nPhone: ${user?.phone || ''}`
      )}`,
      '_blank'
    )
  }

  return (
    <PageShell nav={<CustomerBottomNav />}>
      <div style={{ padding: '20px 16px 80px' }}>
        <div className="z-container">
          <div className="animate-fade-in-up">
            {/* User Header */}
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
                <IconUser size={36} style={{ color: 'var(--z-emerald)' }} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                {user?.name || user?.full_name || 'Customer'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                <span
                  style={{
                    background: '#F3F4F6',
                    color: '#4B5563',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  Customer Account
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                  📱 {user?.phone || '—'}
                </span>
              </div>
            </div>

            {/* Main Sections Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. KYC Verification Card */}
              <div
                className="z-card"
                style={{
                  borderRadius: '18px',
                  border: isKycVerified ? '1px solid #A7F3D0' : isKycPending ? '1px solid #FDE68A' : '1px solid #FECACA',
                  background: isKycVerified ? '#F0FDF4' : isKycPending ? '#FFFBEB' : '#FEF2F2',
                  padding: '18px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
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
                        Government ID & KYC Status
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '2px', color: '#111827' }}>
                        {isKycVerified ? (
                          <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheck size={18} /> Verified (Aadhaar & DL Approved)
                          </span>
                        ) : isKycPending ? (
                          <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconClock size={16} /> Verification Under Review
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconAlertTriangle size={16} /> Action Required: Upload KYC
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#4B5563', marginTop: '6px', lineHeight: '1.5' }}>
                        {isKycVerified
                          ? 'Your driving license and identity are verified. You can book on-demand rides and weekly passes instantly.'
                          : 'Valid Driving License and Aadhaar are mandatory by law for peer-to-peer EV rentals starting at ₹99/hr.'}
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
                    {isKycPending ? 'Update / Resubmit KYC on WhatsApp' : 'Complete Instant KYC via WhatsApp'}
                  </button>
                )}
              </div>

              {/* 2. Notification Preferences */}
              <NotificationPreferencesCard role="CUSTOMER" />

              {/* 3. Expandable Information & Legal Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* About Us */}
                <ProfileAccordionItem
                  title="About Zevrento"
                  icon={IconZap}
                  badge="P2P Platform"
                >
                  <AboutUsContent role="CUSTOMER" />
                </ProfileAccordionItem>

                {/* Contact Us */}
                <ProfileAccordionItem
                  title="Contact Us & Support"
                  icon={IconPhone}
                  badge="7 AM - 11 PM"
                >
                  <ContactUsContent />
                </ProfileAccordionItem>

                {/* FAQ */}
                <ProfileAccordionItem
                  title="Frequently Asked Questions (FAQ)"
                  icon={IconClock}
                  badge="Rentals & Deposits"
                >
                  <FaqContent role="CUSTOMER" />
                </ProfileAccordionItem>

                {/* Terms and Conditions */}
                <ProfileAccordionItem
                  title="Terms & Conditions"
                  icon={IconShield}
                  badge="Legally Binding"
                >
                  <TermsConditionsContent role="CUSTOMER" />
                </ProfileAccordionItem>

                {/* Privacy Policy */}
                <ProfileAccordionItem
                  title="Privacy Policy"
                  icon={IconShield}
                  badge="Data Security"
                >
                  <PrivacyPolicyContent role="CUSTOMER" />
                </ProfileAccordionItem>
              </div>

              {/* Legal Intermediary Disclaimer Badge */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  padding: '12px 16px',
                  lineHeight: '1.5',
                }}
              >
                Zevrento operates strictly as a digital matchmaking platform connecting vehicle hosts with riders under Section 79 of the Information Technology Act.
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
