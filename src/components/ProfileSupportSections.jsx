// =============================================
// Zevrento — Profile Support, Legal & Settings Components
// About Us, Contact Us, FAQ, Privacy Policy, Terms & Conditions,
// Notification Preferences, and KYC Verification.
// Tailored for Customer and Host roles.
// =============================================
import { useState } from 'react'
import { 
  IconPhone, 
  IconWhatsApp, 
  IconBell, 
  IconChevronDown 
} from './Icons.jsx'

// ---- NOTIFICATION PREFERENCES CARD ----
export function NotificationPreferencesCard({ role = 'CUSTOMER' }) {
  const storageKey = `zevrento_notifications_${role}`
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      // fallback
    }
    return {
      whatsapp: true,
      push: true,
      promos: false,
      sound: true,
    }
  })

  const [savedNotice, setSavedNotice] = useState(false)

  const handleToggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {}
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  return (
    <div className="z-card" style={{ borderRadius: '18px', border: '1px solid var(--z-border)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--z-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--z-emerald-ultra-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--z-emerald)' }}>
            <IconBell size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Notification Preferences</h3>
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Choose how Zevrento updates you</p>
          </div>
        </div>
        {savedNotice && (
          <span style={{ fontSize: '0.75rem', color: 'var(--z-emerald)', fontWeight: 700, animation: 'fadeIn 0.2s ease' }}>
            ✓ Preferences Saved
          </span>
        )}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* WhatsApp alerts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>WhatsApp Real-Time Alerts</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              {role === 'RIDER' 
                ? 'Instant booking alerts, OTP verification & payout credit confirmations'
                : 'Ride confirmations, handover OTPs & drop-off inspection reminders'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('whatsapp')}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '999px',
              background: prefs.whatsapp ? 'var(--z-emerald)' : '#D1D5DB',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            aria-label="Toggle WhatsApp Alerts"
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                position: 'absolute',
                top: '3px',
                left: prefs.whatsapp ? '23px' : '3px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>

        {/* Push & In-App notifications */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>In-App & Browser Notifications</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              Live ride countdowns, 15-minute grace alerts & battery turnaround updates
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('push')}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '999px',
              background: prefs.push ? 'var(--z-emerald)' : '#D1D5DB',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            aria-label="Toggle Push Notifications"
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                position: 'absolute',
                top: '3px',
                left: prefs.push ? '23px' : '3px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>

        {/* Promotional / Bonus earnings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>
              {role === 'RIDER' ? 'Host Bonus & Peak Earning Updates' : 'Weekly Pass Discounts & Promo Deals'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              {role === 'RIDER' 
                ? 'High-demand slot bonuses and weekend earning incentives' 
                : 'Special festival discounts, weekend saver coupons & loyalty perks'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('promos')}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '999px',
              background: prefs.promos ? 'var(--z-emerald)' : '#D1D5DB',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            aria-label="Toggle Promo Notifications"
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                position: 'absolute',
                top: '3px',
                left: prefs.promos ? '23px' : '3px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- EXPANDABLE SECTION ITEM ----
export function ProfileAccordionItem({ title, icon: Icon, badge, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      className="z-card"
      style={{
        borderRadius: '18px',
        border: '1px solid var(--z-border)',
        overflow: 'hidden',
        background: '#FFFFFF',
        transition: 'all 0.2s ease',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isOpen ? '#F9FAFB' : '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isOpen ? 'var(--z-emerald-ultra-light)' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isOpen ? 'var(--z-emerald)' : '#4B5563',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827' }}>
              {title}
            </div>
            {badge && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--z-emerald)', fontWeight: 600 }}>
                {badge}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconChevronDown
            size={18}
            style={{
              color: '#6B7280',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid var(--z-border)',
            background: '#FFFFFF',
            fontSize: '0.875rem',
            color: '#374151',
            lineHeight: '1.65',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ---- ABOUT US SECTION ----
export function AboutUsContent({ role = 'CUSTOMER' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          background: 'var(--z-emerald-ultra-light)',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--z-emerald-dark)',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        🌱 <strong>Zevrento</strong> is India’s community-driven peer-to-peer EV sharing marketplace and technology intermediary.
      </div>

      <p>
        <strong>Our Mission:</strong> At Zevrento, we are strictly a technology platform facilitating connections between individual electric vehicle owners (<strong>Hosts</strong>) and urban commuters, students, or gig delivery professionals (<strong>Customers</strong>).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ color: 'var(--z-emerald)', fontWeight: 800 }}>⚡</span>
          <div>
            <strong>Empowering Hosts to Earn:</strong> Most personal EVs sit idle for 16–20 hours a day. Zevrento enables vehicle owners to put their idle scooters to work, earning healthy passive income (up to ₹349/day or ₹1,800/week) safely and securely.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ color: 'var(--z-emerald)', fontWeight: 800 }}>🛴</span>
          <div>
            <strong>Affordable Rentals for the Needy:</strong> We believe green mobility should be accessible to all. Renters can access verified, high-speed electric scooters starting from just <strong>1 hour @ ₹99</strong> with zero paperwork hassle, instant QR booking, and transparent pricing.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ color: 'var(--z-emerald)', fontWeight: 800 }}>🛡️</span>
          <div>
            <strong>Platform Intermediary Role:</strong> Zevrento does NOT own the fleet vehicles. We operate purely as a digital facilitator, providing bank-grade security, government-compliant KYC checks, pre/post video inspection protocols, and automated UPI settlements.
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#6B7280', borderTop: '1px solid #E5E7EB', paddingTop: '10px', marginTop: '6px' }}>
        Operated by <strong>Coderware Technologies</strong> • Hyderabad, Telangana, India.
      </div>
    </div>
  )
}

// ---- CONTACT US SECTION ----
export function ContactUsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ margin: 0 }}>
        Our dedicated support team is available 7 days a week to assist customers and host partners with bookings, KYC verification, vehicle turnaround, and settlements.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        {/* WhatsApp Support */}
        <a
          href="https://wa.me/917020905724?text=Hi%20Zevrento%20Support%2C%20I%20need%20assistance%20with%20my%20account%20or%20booking."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#15803D',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          <IconWhatsApp size={22} />
          <div>
            <div style={{ fontSize: '0.875rem' }}>WhatsApp Helpline (Fastest)</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#166534' }}>+91 70209 05724 • Instant Response</div>
          </div>
        </a>

        {/* Phone Call */}
        <a
          href="tel:+917020905724"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#1F2937',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          <IconPhone size={20} style={{ color: '#4B5563' }} />
          <div>
            <div style={{ fontSize: '0.875rem' }}>Customer & Host Calling Support</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6B7280' }}>+91 70209 05724 • 7:00 AM – 11:00 PM IST</div>
          </div>
        </a>

        {/* Email Support */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#1F2937',
          }}
        >
          <div style={{ width: '20px', textAlign: 'center', fontSize: '1.1rem' }}>✉️</div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Official Email Inquiries</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              General: <strong>support@zevrento.in</strong> • Legal: <strong>legal@zevrento.in</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', fontSize: '0.8125rem', color: '#475569' }}>
        <strong>Operating Locations:</strong> Hyderabad Metro Hubs (Ameerpet, Begumpet, Yellareddygudda, Hitech City, Madhapur) & Partner P2P Host locations.
      </div>
    </div>
  )
}

// ---- FAQ SECTION ----
export function FaqContent({ role = 'CUSTOMER' }) {
  const customerFaqs = [
    {
      q: 'How does renting an EV starting at ₹99/hr work?',
      a: 'Choose your desired pickup hub or area, select your required duration (1 hr for ₹99, 3 hrs for ₹219, etc.), and complete your quick KYC. When you meet the host or reach the hub, verify the booking OTP, inspect the vehicle, and start riding immediately.'
    },
    {
      q: 'What is the security deposit and when is it refunded?',
      a: 'A refundable security deposit of ₹500 is collected for on-demand rides. Upon on-time drop-off and completion of the vehicle condition check, your ₹500 deposit is automatically processed and refunded to your original payment method / UPI within standard banking turnaround.'
    },
    {
      q: 'What if I return the vehicle more than 15 minutes late?',
      a: 'We offer a generous 15-minute grace window. If your return is delayed by more than 15 minutes past the booking end time, an additional 1-hour charge (₹99) is automatically deducted from your security deposit to compensate the host partner and cover turnaround scheduling.'
    },
    {
      q: 'How does the pre-ride & post-ride video inspection work?',
      a: 'To guarantee 100% transparency, both the customer and host record a quick 360° video of the vehicle before ride start and upon drop-off. If any physical damage or scratches occur during your custody, repair charges are assessed based on the comparison and deducted from your deposit.'
    },
    {
      q: 'How do I swap or charge the battery?',
      a: 'Every EV is handed over with at least 80% battery. You can swap batteries at our partner metro hubs or charge at home/office with the provided charger.'
    },
    {
      q: 'What are Weekly Subscription Passes?',
      a: 'If you commute daily or work delivery shifts (Swiggy, Zomato, Zepto), weekly passes give you dedicated scooters with ₹0 security deposit and unlimited kilometers starting at just ₹1,699/week (effective ₹243/day).'
    }
  ]

  const hostFaqs = [
    {
      q: 'How much money can I earn by hosting my idle EV on Zevrento?',
      a: 'You earn ₹69 for a 1-hour slot, ₹210 for a 6-hour pass, ₹349 for a full-day slot, or up to ₹1,800/week for dedicated weekly leases. Earnings are transferred directly to your bank account or UPI.'
    },
    {
      q: 'Who is responsible for my EV while it is rented out?',
      a: 'Every customer must be 18+ with verified government KYC (Aadhaar & Driving License). Customers pay a refundable security deposit and are legally liable for the vehicle. Pre-ride and post-ride video check-ins document vehicle condition before and after every booking.'
    },
    {
      q: 'What if the customer returns late or causes damage?',
      a: 'If a customer returns your EV more than 15 minutes late, they are penalized a full hour (₹99), deducted from their deposit and credited to host compensation. Any damage confirmed via inspection video is recovered directly from the customer’s security deposit.'
    },
    {
      q: 'When and how do I receive my payouts?',
      a: 'Once both you and the customer mark the ride as completed after checking the vehicle condition, your payout is recorded in the platform settlement ledger and paid out via UPI.'
    },
    {
      q: 'What is Zevrento’s role as a platform?',
      a: 'Zevrento operates strictly as a digital technology intermediary and matchmaking platform under Section 79 of the IT Act. We connect vehicle hosts with verified riders in need. You retain full legal ownership of your vehicle.'
    },
    {
      q: 'Can I cancel or modify my listed availability slot?',
      a: 'Yes! As long as a slot has not been confirmed by a paying customer, you can freely edit, toggle off, or delete your availability slot from the Host Dashboard.'
    }
  ]

  const items = role === 'RIDER' ? hostFaqs : customerFaqs

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid #E5E7EB' : 'none', paddingBottom: '12px' }}>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem', marginBottom: '4px' }}>
            Q: {item.q}
          </div>
          <div style={{ color: '#4B5563', fontSize: '0.8125rem', lineHeight: '1.55' }}>
            {item.a}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- TERMS AND CONDITIONS SECTION ----
export function TermsConditionsContent({ role = 'CUSTOMER' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', lineHeight: '1.6', color: '#374151' }}>
      <div
        style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: '10px',
          padding: '10px 12px',
          color: '#92400E',
          fontWeight: 600,
        }}
      >
        ⚖️ <strong>Legal Intermediary Notice (Information Technology Act, 2000):</strong>
        <br />
        Zevrento operates exclusively as a digital technology platform and intermediary. Zevrento is NOT a vehicle rental agency, public carrier, or vehicle lessor. Zevrento does not own vehicles listed on the platform.
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>1. Platform Intermediary Architecture</strong>
        <p style={{ marginTop: '2px' }}>
          Zevrento provides the digital infrastructure to connect individual vehicle owners (<strong>"Hosts"</strong>) wishing to monetize idle electric two-wheelers with verified drivers (<strong>"Customers/Renters"</strong>) in need of short-term electric mobility starting from 1 hour @ ₹99. All rental agreements are formed directly between Host and Renter under peer-to-peer facilitation.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>2. Driver Eligibility & Mandatory KYC</strong>
        <p style={{ marginTop: '2px' }}>
          Every customer must be at least 18 years of age and hold a valid, unexpired Indian Driving License authorizing the operation of two-wheelers, along with a verified Aadhaar card. Driving without a valid license or subletting to unverified third parties is strictly prohibited and constitutes a criminal offense.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>3. Pricing, Security Deposit & Refund Policy</strong>
        <p style={{ marginTop: '2px' }}>
          On-demand rentals start at ₹99/hr. A refundable security deposit of ₹500 is collected upon checkout. The deposit is refunded post ride completion after physical condition verification and host confirmation. Weekly subscription passes enjoy a waived (₹0) deposit upon approved tier verification.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>4. 15-Minute Grace Period & Late Return Penalty</strong>
        <p style={{ marginTop: '2px' }}>
          Customers are granted a 15-minute grace window past their scheduled drop-off time. In the event of a drop-off delay exceeding 15 minutes, an additional full hour charge of <strong>₹99</strong> will be automatically deducted from the customer’s security deposit to compensate the host partner and cover turnaround scheduling.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>5. Mandatory Before & After Inspection Video</strong>
        <p style={{ marginTop: '2px' }}>
          Before taking handover of the keys and upon drop-off, both customer and host must inspect the vehicle and document a 360° video. If damage, broken components, or excessive wear occur during the customer's custody, the cost of genuine repair or parts replacement will be deducted from the security deposit. In cases of severe damage exceeding the deposit, the customer remains legally and financially liable.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>6. Prohibited Uses & Traffic Law Compliance</strong>
        <p style={{ marginTop: '2px' }}>
          Vehicles shall not be operated under the influence of alcohol, narcotics, or intoxicating substances. Rash driving, street racing, commercial hazardous cargo transport, and overload beyond legal capacity are strictly forbidden. The renter is solely liable for all traffic challans, parking tickets, and penalties incurred during the rental tenure.
        </p>
      </div>

      {role === 'RIDER' ? (
        <div>
          <strong style={{ color: '#111827', fontSize: '0.875rem' }}>7. Host Partner Warranties & Obligations</strong>
          <p style={{ marginTop: '2px' }}>
            Hosts warrant that they are the lawful owner or authorized custodian of the EV, holding a valid Registration Certificate (RC), active third-party insurance, and a roadworthy vehicle with functioning brakes, lights, and certified battery. The host must verify the customer's secure booking OTP prior to handing over the vehicle keys.
          </p>
        </div>
      ) : (
        <div>
          <strong style={{ color: '#111827', fontSize: '0.875rem' }}>7. Customer Care & Battery Management</strong>
          <p style={{ marginTop: '2px' }}>
            The customer agrees to care for the electric vehicle in a prudent manner, protect the battery from water submersion or hazardous exposure, and adhere to recommended speed limits.
          </p>
        </div>
      )}

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>8. Limitation of Platform Liability</strong>
        <p style={{ marginTop: '2px' }}>
          Under Section 79 of the Information Technology Act, Zevrento acts purely as an intermediary. Zevrento is not liable for mechanical breakdowns, traffic accidents, bodily injuries, or third-party liabilities arising from the operation of vehicles on public roads.
        </p>
      </div>
    </div>
  )
}

// ---- PRIVACY POLICY SECTION ----
export function PrivacyPolicyContent({ role = 'CUSTOMER' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', lineHeight: '1.6', color: '#374151' }}>
      <div
        style={{
          background: 'var(--z-emerald-ultra-light)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: '10px 12px',
          color: 'var(--z-emerald-dark)',
          fontWeight: 600,
        }}
      >
        🔒 <strong>Your Privacy & Data Security:</strong> Zevrento is committed to safeguarding the personal information of our riders and host partners.
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>1. Information We Collect</strong>
        <p style={{ marginTop: '2px' }}>
          • <strong>Account Details:</strong> Name, mobile phone number, email address, profile credentials.
          <br />
          • <strong>Verification / KYC:</strong> Government ID (Aadhaar Card) and Driving License images, verified securely via WhatsApp / compliant cloud storage.
          <br />
          • <strong>Vehicle & Booking Data:</strong> Pickup/drop-off timestamps, hub locations, vehicle plate number, handover inspection videos, and payment receipts.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>2. How We Use Your Data</strong>
        <p style={{ marginTop: '2px' }}>
          We collect and process your data strictly to:
          <br />
          • Authenticate driver eligibility and prevent unauthorized vehicle use or theft.
          <br />
          • Facilitate peer-to-peer bookings and disburse earnings to host partners.
          <br />
          • Send transaction receipts, OTPs, and ride updates via WhatsApp and push notifications.
          <br />
          • Resolve damage claims, security deposit adjustments, and traffic challan liabilities.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>3. Zero Third-Party Selling Guarantee</strong>
        <p style={{ marginTop: '2px' }}>
          We NEVER sell, rent, or trade your personal or identification documents to third-party marketing companies. Data is only accessible to authorized Zevrento operations staff and shared with law enforcement authorities only when mandated by court summons or official statutory warrants.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>4. Data Security & Storage</strong>
        <p style={{ marginTop: '2px' }}>
          All authentication tokens, phone numbers, and profile details are encrypted in transit using industry-standard TLS protocols. KYC verification through our official WhatsApp business hotline ensures immediate human-verified security without vulnerable permanent server storage of sensitive documents.
        </p>
      </div>

      <div>
        <strong style={{ color: '#111827', fontSize: '0.875rem' }}>5. Contact Our Privacy Grievance Officer</strong>
        <p style={{ marginTop: '2px' }}>
          For any data inquiries, rectification, or account deletion requests, write to: <strong>legal@zevrento.in</strong> or WhatsApp +91 70209 05724.
        </p>
      </div>
    </div>
  )
}
