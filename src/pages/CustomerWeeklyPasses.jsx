// =============================================
// Zevrento — Customer Weekly Subscription Passes
// Dedicated weekly pass management & booking
// =============================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { WEEKLY_SUBSCRIPTIONS, HUBS, calculateFare, roundToNextHour, addHours, toInputDateTime } from '../lib/data.js'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { IconZap, IconCheck, IconWhatsApp, IconClock, IconShield, IconMapPin, IconCalendar, IconChevronDown } from '../components/Icons.jsx'

export default function CustomerWeeklyPasses() {
  const { user, availableVehicles } = useApp()
  const navigate = useNavigate()
  const [selectedHubId, setSelectedHubId] = useState(HUBS[0]?.id || 'area1')

  const selectedHub = HUBS.find((h) => h.id === selectedHubId) || HUBS[0]

  const handleBookSubscription = (sub) => {
    if (user?.kyc_status !== 'VERIFIED' && !user?.kyc_verified) {
      alert('Your KYC is not verified yet. Please go to your Profile and complete KYC verification to subscribe.')
      navigate('/customer/profile')
      return
    }

    const subFare = calculateFare(sub.hoursPerDay * 7, 'SUBSCRIPTION', sub.id)
    const assignedVehicle = availableVehicles[0] || {
      id: `sub_${sub.id}_${Date.now()}`,
      model: 'Bounce Infinity E1',
      plate: 'ALLOCATED AT HUB',
      battery: 100,
      color: '#10B981',
      location: selectedHub?.name || 'Hyderabad Hub',
    }

    const subStart = roundToNextHour(new Date())
    const subEnd = addHours(subStart, 24 * 7)

    navigate('/customer/checkout', {
      state: {
        vehicle: assignedVehicle,
        hub: selectedHub,
        pickupTime: toInputDateTime(subStart),
        dropoffTime: toInputDateTime(subEnd),
        duration: sub.hoursPerDay * 7,
        fare: subFare,
        plan_type: 'SUBSCRIPTION',
        plan_name: sub.name,
        is_subscription: true,
        duration_hours: sub.hoursPerDay * 7,
        subscription_id: sub.id,
      },
    })
  }

  return (
    <PageShell nav={<CustomerBottomNav />}>
      <div style={{ padding: '20px 16px 80px' }}>
        <div className="z-container">
          {/* Header Banner */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }} className="animate-fade-in-up">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--z-emerald-ultra-light)',
                color: 'var(--z-emerald-dark)',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              <IconZap size={14} style={{ color: 'var(--z-emerald)' }} />
              Guaranteed Weekly Mobility
            </span>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Weekly EV Passes
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#4B5563', maxWidth: '480px', margin: '0 auto', lineHeight: '1.5' }}>
              Save up to 60% compared to hourly rentals. Guaranteed scooter every single day, ₹0 security deposit, and free hub battery swaps.
            </p>
          </div>

          {/* Hub Selector */}
          <div
            className="z-card"
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              marginBottom: '20px',
              border: '1px solid var(--z-border)',
              background: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--z-emerald-ultra-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--z-emerald)',
                  }}
                >
                  <IconMapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Preferred Pickup Hub
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                    {selectedHub?.name} Metro
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedHubId}
                  onChange={(e) => setSelectedHubId(e.target.value)}
                  style={{
                    padding: '8px 28px 8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--z-border)',
                    background: '#F9FAFB',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#374151',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <IconChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#6B7280',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Three Subscription Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {WEEKLY_SUBSCRIPTIONS.map((sub, idx) => {
              const gradientHeader =
                idx === 1
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : idx === 2
                  ? 'linear-gradient(135deg, #4F46E5, #3730A3)'
                  : 'linear-gradient(135deg, #0EA5E9, #0284C7)'

              return (
                <div
                  key={sub.id}
                  className={`z-card animate-fade-in-up stagger-${idx + 1}`}
                  style={{
                    borderRadius: '20px',
                    border: '1px solid var(--z-border)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
                    background: '#FFFFFF',
                  }}
                >
                  {/* Top Badge Strip */}
                  <div
                    style={{
                      background: gradientHeader,
                      padding: '16px 20px',
                      color: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.22)',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {sub.code}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                        {sub.shortName}
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{sub.price}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>/ 7-day week</div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '20px' }}>
                    {/* Highlight Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <span
                        style={{
                          background: 'var(--z-emerald-ultra-light)',
                          color: 'var(--z-emerald-dark)',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        🕒 {sub.dailyHoursText}
                      </span>
                      <span
                        style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        ⚡ Effective ₹{sub.effectivePerDay} / day
                      </span>
                      <span
                        style={{
                          background: '#EEF2FF',
                          color: '#4338CA',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        🛡️ ₹0 Security Deposit
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: '1.5', marginBottom: '16px' }}>
                      {sub.description}
                    </p>

                    {/* Features list */}
                    <div
                      style={{
                        background: '#F9FAFB',
                        borderRadius: '14px',
                        padding: '14px',
                        marginBottom: '18px',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                        <IconCheck size={16} style={{ color: 'var(--z-emerald)', flexShrink: 0 }} />
                        <span>Unlimited Kilometers (Fair-use commute policy)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                        <IconCheck size={16} style={{ color: 'var(--z-emerald)', flexShrink: 0 }} />
                        <span>Dedicated vehicle reserved at {selectedHub?.name || 'Hub'} Metro</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                        <IconCheck size={16} style={{ color: 'var(--z-emerald)', flexShrink: 0 }} />
                        <span>Zero daily turnaround delays • Fast-track QR check-in</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                        <IconCheck size={16} style={{ color: 'var(--z-emerald)', flexShrink: 0 }} />
                        <span>Host Partner Share: ₹{sub.hostPayout} • Platform Cut: ₹{sub.platformCut}</span>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <a
                        href={`https://wa.me/917020905724?text=${encodeURIComponent(
                          `${sub.whatsappText}\nPickup Area: ${selectedHub?.name || 'Hyderabad'}\nName: ${user?.name || user?.full_name || 'Customer'}\nPhone: ${user?.phone || ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="z-btn z-btn-outline"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          color: '#16A34A',
                          borderColor: '#86EFAC',
                          background: '#F0FDF4',
                          fontWeight: 700,
                          padding: '12px',
                          borderRadius: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        <IconWhatsApp size={18} />
                        Subscribe via WhatsApp Verification
                      </a>

                      <button
                        className="z-btn z-btn-primary z-btn-full"
                        onClick={() => handleBookSubscription(sub)}
                        style={{ fontWeight: 700, padding: '12px', borderRadius: '12px' }}
                      >
                        Book Pass Online (₹{sub.price} / wk)
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Value Proposition Box */}
          <div
            className="z-card"
            style={{
              marginTop: '28px',
              padding: '20px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
              border: '1px solid #DBEAFE',
            }}
          >
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '8px' }}>
              Why choose Zevrento Weekly Passes?
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#3B82F6', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>• <strong>Massive Cost Savings:</strong> Pay as low as ₹243/day compared to ₹499/day for regular 24h slots.</div>
              <div>• <strong>Zero Paperwork & Deposit:</strong> Regular security deposits are waived on weekly plans once your KYC is approved.</div>
              <div>• <strong>Free Battery Swaps:</strong> Unlimited battery swapping at partner hubs during your active pass validity.</div>
              <div>• <strong>P2P Economy Support:</strong> Directly empowers verified EV hosts in your neighbourhood to earn predictable income.</div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
