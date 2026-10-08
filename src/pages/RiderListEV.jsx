// =============================================
// Zevrento — List My Idle EV Form
// Host vehicle listing with earnings preview
// =============================================
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { HUBS, PRICING, toInputDateTime, roundToNextHour, addHours, getHoursDiff } from '../lib/data.js'
import { PageShell, RiderBottomNav } from '../components/Layout.jsx'
import { IconScooter, IconBattery, IconCheck, IconChevronDown, IconMapPin } from '../components/Icons.jsx'

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

  const defaultStart = roundToNextHour(new Date())
  const defaultEnd = addHours(defaultStart, 6)

  const [model, setModel] = useState(EV_MODELS[0])
  const [plate, setPlate] = useState('')
  const [battery, setBattery] = useState('90')
  const [selectedArea, setSelectedArea] = useState(HUBS[0].id)
  const [exactAddress, setExactAddress] = useState(user?.address || '')
  const [startTime, setStartTime] = useState(toInputDateTime(defaultStart))
  const [endTime, setEndTime] = useState(toInputDateTime(defaultEnd))
  const [submitted, setSubmitted] = useState(false)

  const hours = useMemo(() => getHoursDiff(startTime, endTime), [startTime, endTime])
  const earnings = hours * PRICING.hostPayout

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!plate.trim() || hours < 1) return

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
    })

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
            <h2 style={{ marginBottom: '8px' }}>Slot Published!</h2>
            <p className="text-sm text-muted" style={{ marginBottom: '24px' }}>
              Your EV is now listed for {hours} hours
            </p>

            <div className="earnings-preview" style={{ marginBottom: '24px', background: 'var(--z-emerald-ultra-light)' }}>
              <div className="headline" style={{ fontSize: '1.25rem' }}>Listing Details</div>
              <div className="sub">You have hosted your EV for {hours} hours.</div>
              <div className="earnings-formula" style={{ marginTop: '8px' }}>
                <span style={{ fontWeight: 600 }}>Potential Earnings: up to ₹{earnings}</span>
                <span style={{ fontSize: '0.75rem' }}>(You will be notified and paid when a customer books your EV)</span>
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

            {/* Availability Schedule */}
            <div className="z-card animate-fade-in-up stagger-1">
              <div className="z-card-body">
                <h4 style={{ marginBottom: '16px' }}>Idle Availability Schedule</h4>

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

            {/* Earnings Preview */}
            {hours >= 1 && (
              <div className="earnings-preview animate-fade-in-up stagger-2" style={{ background: 'var(--z-emerald-ultra-light)' }}>
                <div className="headline" style={{ fontSize: '1.25rem', color: 'var(--z-emerald-dark)' }}>Host to Earn!</div>
                <div className="sub">
                  When a customer books, you earn ₹{PRICING.hostPayout}/hour.
                </div>
                <div className="earnings-formula">
                  <span>If booked for full {hours}h = ₹{earnings} Potential</span>
                </div>
              </div>
            )}

            {/* Hub Notice */}
            <div className="hub-notice animate-fade-in-up stagger-3">
              <strong>📍 Direct Handover (P2P)</strong>
              The customer will come to your entered pickup location to collect the vehicle.
              Ensure you verify the customer's KYC and booking code before handing over the keys.
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="z-btn z-btn-primary z-btn-full z-btn-lg animate-fade-in-up stagger-4"
              disabled={!plate.trim() || hours < 1}
            >
              Publish Available Slot
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}
