// =============================================
// Zevrento — List My Idle EV Form
// Host vehicle listing with tiered earnings preview
// =============================================
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { 
  HUBS, 
  PRICING, 
  toInputDateTime, 
  roundToNextHour, 
  addHours, 
  getHoursDiff, 
  calculateTieredFare,
  WEEKLY_SUBSCRIPTIONS 
} from '../lib/data.js'
import { PageShell, RiderBottomNav } from '../components/Layout.jsx'
import { IconScooter, IconBattery, IconCheck, IconChevronDown, IconMapPin, IconClock, IconZap, IconShield } from '../components/Icons.jsx'

const EV_MODELS = [
  'Bounce Infinity E1',
  'Ather 450X',
  'Ola S1 Pro',
  'TVS iQube',
  'Bajaj Chetak',
  'Hero Vida V1',
  'Simple One',
  'Zypp',
  'Yulu',
  'Hala',
  'Other',
]

export default function RiderListEV() {
  const { publishSlot, user } = useApp()
  const navigate = useNavigate()

  // Listing Mode: Single Idle Slot vs Weekly Idle Commitment
  const [listingMode, setListingMode] = useState('SINGLE_SLOT') // 'SINGLE_SLOT' | 'WEEKLY_COMMITMENT'

  const defaultStart = roundToNextHour(new Date())
  const defaultEnd = addHours(defaultStart, 6)

  const [model, setModel] = useState(EV_MODELS[0])
  const [plate, setPlate] = useState('')
  const [battery, setBattery] = useState('90')
  const [selectedArea, setSelectedArea] = useState(HUBS[0].id)
  const [exactAddress, setExactAddress] = useState(user?.address || '')
  const [startTime, setStartTime] = useState(toInputDateTime(defaultStart))
  const [endTime, setEndTime] = useState(toInputDateTime(defaultEnd))

  // Weekly commitment state
  const [weeklyPlanId, setWeeklyPlanId] = useState('WEEKLY_12HR') // 'WEEKLY_6HR', 'WEEKLY_12HR', 'WEEKLY_24HR'
  const [weeklySlotHours, setWeeklySlotHours] = useState('1:00 PM - 7:00 PM')
  const [commitmentDays, setCommitmentDays] = useState(6) // 6 or 7 days
  const [submitted, setSubmitted] = useState(false)

  const hours = useMemo(() => getHoursDiff(startTime, endTime), [startTime, endTime])

  // Single slot tiered payout calculation
  const singlePayout = useMemo(() => {
    const tiered = calculateTieredFare(hours)
    const hostEarnToday = tiered.hostPayoutTotal
    const monthlyPassive = Math.round(hostEarnToday * 26) // 26 days/mo
    return {
      today: hostEarnToday,
      monthly: monthlyPassive,
      rateLabel: hours === 6 ? 'Earn ₹210 today (₹5,460/month passive income while resting)'
        : hours === 12 ? 'Earn ₹279 today (₹7,250/month passive income)'
        : `Earn ₹${hostEarnToday} today (₹${monthlyPassive}/month passive income)`
    }
  }, [hours])

  // Weekly commitment payout
  const selectedWeeklySub = useMemo(() => {
    return WEEKLY_SUBSCRIPTIONS.find(s => s.id === weeklyPlanId) || WEEKLY_SUBSCRIPTIONS[1]
  }, [weeklyPlanId])

  const handleQuickSlot = (h) => {
    const s = new Date(startTime)
    const e = addHours(s, h)
    setEndTime(toInputDateTime(e))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!plate.trim()) return

    if (listingMode === 'SINGLE_SLOT') {
      if (hours < 1) return
      publishSlot({
        vehicle_id: `vh_${Date.now()}`,
        model,
        plate: plate.toUpperCase().trim(),
        battery: parseInt(battery) || 0,
        host_phone: user?.phone || '',
        pickup_location: `${HUBS.find(h => h.id === selectedArea)?.name} - ${exactAddress.trim()}`,
        hub_id: selectedArea,
        start_time: startTime,
        end_time: endTime,
        listing_type: 'SINGLE_SLOT',
        daily_hours: `${hours} hours`,
        commitment_days: 1,
        host_payout_expected: singlePayout.today,
      })
    } else {
      // Weekly commitment listing
      const now = new Date()
      const endWeekly = addHours(now, commitmentDays * 24)
      publishSlot({
        vehicle_id: `vh_${Date.now()}`,
        model,
        plate: plate.toUpperCase().trim(),
        battery: parseInt(battery) || 0,
        host_phone: user?.phone || '',
        pickup_location: `${HUBS.find(h => h.id === selectedArea)?.name} - ${exactAddress.trim()}`,
        hub_id: selectedArea,
        start_time: toInputDateTime(now),
        end_time: toInputDateTime(endWeekly),
        listing_type: 'WEEKLY_COMMITMENT',
        daily_hours: `Available daily ${weeklySlotHours} for ${commitmentDays} days`,
        commitment_days: commitmentDays,
        host_payout_expected: selectedWeeklySub.hostPayout,
      })
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <PageShell title="Slot Published" showBack onBack={() => navigate('/rider/dashboard')} nav={<RiderBottomNav />}>
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div className="z-container animate-fade-in-up">
            <div style={{
              width: '64px', height: '64px',
              background: 'var(--z-emerald-light)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <IconCheck size={32} style={{ color: 'var(--z-emerald)' }} />
            </div>
            <h2 style={{ marginBottom: '8px' }}>EV Listed Successfully!</h2>
            <p className="text-sm text-muted" style={{ marginBottom: '24px' }}>
              {listingMode === 'SINGLE_SLOT' 
                ? `Your EV is live for ${hours} hours` 
                : `Your EV is registered for ${selectedWeeklySub.shortName} (${commitmentDays} days)`}
            </p>

            <div className="earnings-preview" style={{ marginBottom: '24px', background: 'var(--z-emerald-ultra-light)' }}>
              <div className="headline" style={{ fontSize: '1.25rem', color: 'var(--z-emerald-dark)', fontWeight: 800 }}>
                {listingMode === 'SINGLE_SLOT' ? `Earn up to ₹${singlePayout.today} Payout` : `Earn up to ₹${selectedWeeklySub.hostPayout}/week Guaranteed`}
              </div>
              <div className="sub" style={{ marginTop: '4px' }}>
                {listingMode === 'SINGLE_SLOT'
                  ? singlePayout.rateLabel
                  : `Earn up to ₹${selectedWeeklySub.hostPayout}/week guaranteed passive payout (${commitmentDays} days commitment)`}
              </div>
            </div>

            <button
              className="z-btn z-btn-primary z-btn-full"
              onClick={() => navigate('/rider/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="List My Idle EV" showBack onBack={() => navigate('/rider/dashboard')} nav={<RiderBottomNav />}>
      <div style={{ padding: '20px 16px' }}>
        <div className="z-container">

          {/* LISTING TYPE SEGMENTED CONTROL */}
          <div style={{
            display: 'flex',
            background: '#F3F4F6',
            borderRadius: '16px',
            padding: '4px',
            gap: '4px',
            marginBottom: '20px',
            border: '1px solid var(--z-border)'
          }}>
            <button
              type="button"
              onClick={() => setListingMode('SINGLE_SLOT')}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: '12px',
                border: 'none',
                background: listingMode === 'SINGLE_SLOT' ? '#FFFFFF' : 'transparent',
                color: listingMode === 'SINGLE_SLOT' ? 'var(--z-emerald-dark)' : '#6B7280',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: listingMode === 'SINGLE_SLOT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <IconClock size={15} /> Single Idle Slot
            </button>
            <button
              type="button"
              onClick={() => setListingMode('WEEKLY_COMMITMENT')}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: '12px',
                border: 'none',
                background: listingMode === 'WEEKLY_COMMITMENT' ? '#FFFFFF' : 'transparent',
                color: listingMode === 'WEEKLY_COMMITMENT' ? 'var(--z-emerald-dark)' : '#6B7280',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: listingMode === 'WEEKLY_COMMITMENT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <IconZap size={15} /> Weekly Idle Commitment
            </button>
          </div>

          <form className="host-form" onSubmit={handleSubmit}>
            {/* Vehicle Details */}
            <div className="z-card animate-fade-in-up">
              <div className="z-card-body">
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconScooter size={18} /> Vehicle Details
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="z-input-group">
                    <label className="z-input-label">EV Model</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        className="z-input"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        style={{ appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
                      >
                        {EV_MODELS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <IconChevronDown
                        size={16}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--z-text-light)' }}
                      />
                    </div>
                  </div>

                  <div className="z-input-group">
                    <label className="z-input-label">Registration / Plate Number</label>
                    <input
                      className="z-input"
                      type="text"
                      placeholder="e.g. TS 09 EV 1234"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </div>

                  <div className="z-input-group">
                    <label className="z-input-label">
                      <IconMapPin size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                      Major Area
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        className="z-input"
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        style={{ appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
                      >
                        {HUBS.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                      <IconChevronDown
                        size={16}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--z-text-light)' }}
                      />
                    </div>
                  </div>

                  <div className="z-input-group">
                    <label className="z-input-label">
                      Full Exact Address / Landmark
                    </label>
                    <input
                      className="z-input"
                      type="text"
                      placeholder="e.g. Near Metro Pillar 123"
                      value={exactAddress}
                      onChange={(e) => setExactAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="z-input-group">
                    <label className="z-input-label">
                      <IconBattery size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                      Drop-off Battery %
                    </label>
                    <input
                      className="z-input"
                      type="number"
                      min="20"
                      max="100"
                      value={battery}
                      onChange={(e) => setBattery(e.target.value)}
                      placeholder="90"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Schedule: SINGLE SLOT */}
            {listingMode === 'SINGLE_SLOT' ? (
              <div className="z-card animate-fade-in-up stagger-1" style={{ marginTop: '16px' }}>
                <div className="z-card-body">
                  <h4 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconClock size={16} /> Single Idle Slot
                  </h4>

                  {/* Quick Preset Chips */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { hours: 6, label: '6-Hour Slot', earn: '₹210' },
                      { hours: 12, label: '12-Hour Slot', earn: '₹279' },
                      { hours: 24, label: '24-Hour Slot', earn: '₹349' }
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.hours}
                        onClick={() => handleQuickSlot(preset.hours)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: hours === preset.hours ? '2px solid var(--z-emerald)' : '1px solid var(--z-border)',
                          background: hours === preset.hours ? 'var(--z-emerald-ultra-light)' : '#ffffff',
                          color: hours === preset.hours ? 'var(--z-emerald-dark)' : 'var(--z-text-primary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {preset.label} ({preset.earn})
                      </button>
                    ))}
                  </div>

                  <div className="time-picker-row">
                    <div className="z-input-group">
                      <label className="z-input-label">Available From</label>
                      <input
                        className="z-input"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div className="z-input-group">
                      <label className="z-input-label">Available To</label>
                      <input
                        className="z-input"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        min={startTime}
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  {hours >= 1 && (
                    <div style={{
                      marginTop: '12px', padding: '8px 12px',
                      background: 'var(--z-emerald-ultra-light)',
                      borderRadius: 'var(--z-radius-sm)',
                      fontSize: '0.8125rem', fontWeight: 600, color: 'var(--z-emerald-dark)',
                      textAlign: 'center',
                    }}>
                      {hours} hour{hours !== 1 ? 's' : ''} available
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Availability Schedule: WEEKLY COMMITMENT */
              <div className="z-card animate-fade-in-up stagger-1" style={{ marginTop: '16px' }}>
                <div className="z-card-body">
                  <h4 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconZap size={16} /> Weekly Idle Commitment
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="z-input-group">
                      <label className="z-input-label">Select Weekly Tier</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {WEEKLY_SUBSCRIPTIONS.map(sub => (
                          <label
                            key={sub.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: '12px',
                              border: weeklyPlanId === sub.id ? '2px solid var(--z-emerald)' : '1px solid var(--z-border)',
                              background: weeklyPlanId === sub.id ? 'var(--z-emerald-ultra-light)' : '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="radio"
                                name="weeklyPlan"
                                checked={weeklyPlanId === sub.id}
                                onChange={() => setWeeklyPlanId(sub.id)}
                                style={{ accentColor: 'var(--z-emerald)' }}
                              />
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#111827' }}>{sub.shortName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{sub.dailyHoursText}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, color: 'var(--z-emerald-dark)', fontSize: '0.9375rem' }}>₹{sub.hostPayout}</div>
                              <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>host payout/wk</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="z-input-group">
                      <label className="z-input-label">Daily Available Window</label>
                      <input
                        className="z-input"
                        type="text"
                        placeholder="e.g. Available daily 1 PM - 7 PM for 6 days"
                        value={weeklySlotHours}
                        onChange={(e) => setWeeklySlotHours(e.target.value)}
                        required
                      />
                    </div>

                    <div className="z-input-group">
                      <label className="z-input-label">Commitment Days per Week</label>
                      <select
                        className="z-input"
                        value={commitmentDays}
                        onChange={(e) => setCommitmentDays(Number(e.target.value))}
                      >
                        <option value={6}>6 Days / Week</option>
                        <option value={7}>7 Days (Full Week)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC PAYOUT CALCULATOR */}
            <div className="earnings-preview animate-fade-in-up stagger-2" style={{ marginTop: '16px', background: 'var(--z-emerald-ultra-light)', border: '1px solid var(--z-emerald-light)' }}>
              {listingMode === 'SINGLE_SLOT' ? (
                <>
                  <div className="headline" style={{ fontSize: '1.1875rem', color: 'var(--z-emerald-dark)', fontWeight: 800 }}>
                    {hours === 6 ? 'Earn ₹210 today (₹5,460/month passive income while resting)'
                      : hours === 12 ? 'Earn ₹279 today (₹7,250/month passive income)'
                      : `Earn ₹${singlePayout.today} today (₹${singlePayout.monthly}/month passive income)`}
                  </div>
                  <div className="sub" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>
                    {hours === 6 ? '6-Hour Slot: ₹210 guaranteed host share upon booking.'
                      : hours === 12 ? '12-Hour Slot: ₹279 day-shift host payout.'
                      : `Tiered payout for ${hours} hours. Scaled by Zevrento's fair pricing matrix.`}
                  </div>
                  <div className="earnings-formula" style={{ marginTop: '6px' }}>
                    <span>Estimated 26-Day Passive Earnings: <strong>₹{singlePayout.monthly}</strong></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="headline" style={{ fontSize: '1.1875rem', color: 'var(--z-emerald-dark)', fontWeight: 800 }}>
                    Earn up to ₹{selectedWeeklySub.hostPayout}/week guaranteed passive payout
                  </div>
                  <div className="sub" style={{ marginTop: '4px', fontSize: '0.8125rem' }}>
                    Weekly Listing: {selectedWeeklySub.shortName} • {commitmentDays} days commitment ({weeklySlotHours}).
                  </div>
                  <div className="earnings-formula" style={{ marginTop: '6px' }}>
                    <span>Monthly Passive Host Income: <strong>₹{selectedWeeklySub.hostPayout * 4}</strong></span>
                  </div>
                </>
              )}
            </div>

            {/* Hub Notice */}
            <div className="hub-notice animate-fade-in-up stagger-3" style={{ marginTop: '16px' }}>
              <strong>📍 Direct Handover (P2P)</strong>
              The customer will come to your entered pickup location to collect the vehicle.
              Ensure you verify the customer's KYC and booking code before handing over the keys.
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="z-btn z-btn-primary z-btn-full z-btn-lg animate-fade-in-up stagger-4"
              style={{ marginTop: '16px' }}
              disabled={!plate.trim() || (listingMode === 'SINGLE_SLOT' && hours < 1)}
            >
              {listingMode === 'SINGLE_SLOT' ? 'Publish Available Slot' : 'Register Weekly Commitment'}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}
