// =============================================
// Zevrento — Customer Home (Royal Brothers Flow)
// Sticky search card + Vehicle fleet catalog
// =============================================
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { 
  HUBS, 
  PRICING, 
  HOURLY_TIERS, 
  getHoursDiff, 
  roundToNextHour, 
  addHours, 
  toInputDateTime, 
  calculateFare 
} from '../lib/data.js'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { 
  IconMapPin, 
  IconClock, 
  IconCalendar, 
  IconSearch, 
  IconZap, 
  IconBattery, 
  IconChevronDown, 
  IconRefresh,
  IconWhatsApp,
  IconShield,
  IconCheck
} from '../components/Icons.jsx'

export default function CustomerHome() {
  const { vehicles, availabilitySlots, user, refreshData } = useApp()
  const navigate = useNavigate()

  const [selectedTierHours, setSelectedTierHours] = useState(2)

  // Search state
  const defaultPickup = roundToNextHour(new Date())
  const defaultDropoff = addHours(defaultPickup, 2)

  const [hub, setHub] = useState(HUBS[0].id)
  const [pickupTime, setPickupTime] = useState(toInputDateTime(defaultPickup))
  const [dropoffTime, setDropoffTime] = useState(toInputDateTime(defaultDropoff))
  const [searched, setSearched] = useState(false)
  const [showPopup, setShowPopup] = useState(true)
  const [sortBy, setSortBy] = useState('none') // 'battery', 'duration'

  const duration = useMemo(() => getHoursDiff(pickupTime, dropoffTime), [pickupTime, dropoffTime])
  const selectedHub = HUBS.find((h) => h.id === hub)

  // Active fare breakdown for selected hourly duration
  const fareBreakdown = useMemo(() => calculateFare(duration, 'HOURLY'), [duration])

  const availableVehicles = useMemo(() => {
    const now = new Date()
    let hosts = availabilitySlots
      .filter((s) => new Date(s.end_time) > now)
      .map((s) => {
        const durationAvailable = getHoursDiff(s.start_time, s.end_time)
        return {
          id: s.id,
          model: s.model,
          plate: s.plate,
          color: '#10B981',
          battery: s.battery || 100,
          rate: PRICING.baseRate,
          status: 'available',
          tags: ['Host EV', 'Verified'],
          durationAvailable,
          location: s.pickup_location || selectedHub?.name || 'Owner Location',
          start_time: s.start_time,
          end_time: s.end_time,
          hub_id: s.hub_id,
          pickup_location: s.pickup_location,
          is_booked: s.is_booked,
          host_phone: s.host_phone,
        }
      })

    // Filter by location
    hosts = hosts.filter((h) => {
      if (h.hub_id) return h.hub_id === hub
      if (h.pickup_location) return h.pickup_location.includes(selectedHub?.name)
      return true
    })

    // Filter by requested duration and time slot if a search was made
    if (searched) {
      const pTime = new Date(pickupTime)
      const dTime = new Date(dropoffTime)
      hosts = hosts.filter((h) => {
        const hStart = new Date(h.start_time)
        const hEnd = new Date(h.end_time)
        return pTime >= hStart && dTime <= hEnd
      })
    }

    if (sortBy === 'battery') {
      hosts = hosts.sort((a, b) => b.battery - a.battery)
    } else if (sortBy === 'duration') {
      hosts = hosts.sort((a, b) => b.durationAvailable - a.durationAvailable)
    }

    return hosts
  }, [availabilitySlots, sortBy, selectedHub, hub, pickupTime, dropoffTime, searched])

  // Select standard tiered chip
  const handleSelectTier = (tierHours) => {
    setSelectedTierHours(tierHours)
    const pDate = new Date(pickupTime)
    const newDropoff = addHours(pDate, tierHours)
    setDropoffTime(toInputDateTime(newDropoff))
    setSearched(true)
  }

  const handleSearch = () => {
    if (duration < 1) return
    setSearched(true)
  }

  const handleBookNow = (vehicle) => {
    if (user?.kyc_status !== 'VERIFIED' && !user?.kyc_verified) {
      alert('Your KYC is not verified yet. Please go to your Profile and complete KYC verification to book a vehicle.')
      navigate('/customer/profile')
      return
    }

    navigate('/customer/checkout', {
      state: {
        vehicle,
        hub: selectedHub,
        pickupTime,
        dropoffTime,
        duration,
        fare: fareBreakdown,
        plan_type: 'HOURLY',
        plan_name: fareBreakdown.planName,
        is_subscription: false,
        duration_hours: duration,
      },
    })
  }

  return (
    <PageShell nav={<CustomerBottomNav />}>
      {/* ---- STARTUP POPUP ---- */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px 24px',
              textAlign: 'center',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--z-border)',
            }}
          >
            <div
              style={{
                background: 'var(--z-emerald-ultra-light)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <IconZap size={32} style={{ color: 'var(--z-emerald)' }} />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Welcome to Zevrento!
            </h2>
            <p
              style={{
                color: '#4B5563',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                marginBottom: '24px',
                opacity: 0.9,
              }}
            >
              Rent high-speed EVs starting at just <strong>₹99/hr</strong> or get guaranteed weekly passes for daily shifts.
              <br />
              <br />
              Zero hassle, unlimited kilometers, 100% tension-free!
            </p>
            <button
              className="z-btn z-btn-primary z-btn-full z-btn-lg"
              onClick={() => setShowPopup(false)}
              style={{ fontWeight: 700, fontSize: '1rem', padding: '16px' }}
            >
              Explore Passes
            </button>
          </div>
        </div>
      )}

      {/* ---- ON-DEMAND HOURLY SEARCH CARD ---- */}
      <div className="search-card" style={{ marginTop: '16px' }}>
        <div className="search-card-inner">
              {/* Location */}
              <div className="z-input-group search-location">
                <label className="z-input-label">
                  <IconMapPin size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                  Pickup Area
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="z-input"
                    value={hub}
                    onChange={(e) => setHub(e.target.value)}
                    style={{ appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
                  >
                    {HUBS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown
                    size={16}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'var(--z-text-light)',
                    }}
                  />
                </div>
              </div>

              {/* DURATION CHIP SELECTOR (Royal Brothers Clean Layout) */}
              <div style={{ marginBottom: '14px' }}>
                <label className="z-input-label" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Choose Rental Pass</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--z-emerald)', fontWeight: 700 }}>Tiered Super-Saver</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', paddingTop: '6px' }}>
                  {HOURLY_TIERS.map((tier) => {
                    const isSelected = selectedTierHours === tier.hours || duration === tier.hours
                    return (
                      <div
                        key={tier.id}
                        onClick={() => handleSelectTier(tier.hours)}
                        style={{
                          flex: '0 0 auto',
                          minWidth: '108px',
                          padding: '10px 10px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid var(--z-emerald)' : '1px solid var(--z-border)',
                          background: isSelected ? 'var(--z-emerald-ultra-light)' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
                        }}
                      >
                        {tier.badge && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: tier.hours === 6 ? 'var(--z-emerald)' : tier.hours === 12 ? '#3B82F6' : '#F59E0B',
                              color: '#ffffff',
                              fontSize: '0.59rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '999px',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            }}
                          >
                            {tier.badge}
                          </span>
                        )}
                        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: isSelected ? 'var(--z-emerald-dark)' : '#111827' }}>
                          {tier.label}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: isSelected ? 'var(--z-emerald)' : '#4B5563', marginTop: '2px' }}>
                          ₹{tier.price}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '2px' }}>
                          {tier.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pickup & Dropoff time */}
              <div className="search-row">
                <div className="z-input-group">
                  <label className="z-input-label">
                    <IconCalendar size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    Pickup
                  </label>
                  <input
                    className="z-input"
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => {
                      setPickupTime(e.target.value)
                      setSelectedTierHours(null)
                    }}
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
                <div className="z-input-group">
                  <label className="z-input-label">
                    <IconCalendar size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    Drop-off
                  </label>
                  <input
                    className="z-input"
                    type="datetime-local"
                    value={dropoffTime}
                    onChange={(e) => {
                      setDropoffTime(e.target.value)
                      setSelectedTierHours(null)
                    }}
                    min={pickupTime}
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              {/* TRANSPARENT BREAKDOWN COMPONENT */}
              {duration >= 1 && (
                <div
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid var(--z-border)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    margin: '12px 0 16px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconShield size={14} style={{ color: 'var(--z-emerald)' }} /> Transparent Fare Breakdown
                    </span>
                    <span className="z-badge z-badge-emerald" style={{ fontSize: '0.6875rem' }}>
                      {fareBreakdown.durationHours}h ({fareBreakdown.planName})
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#4B5563' }}>
                    <span>Base Rental Pass</span>
                    <span style={{ fontWeight: 700 }}>₹{fareBreakdown.rental}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#6B7280', fontSize: '0.75rem' }}>
                    <span>• Platform & Maintenance Fee (Included)</span>
                    <span>₹{fareBreakdown.platformFeeTotal}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4B5563' }}>
                    <span>100% Refundable Security Deposit</span>
                    <span style={{ fontWeight: 700 }}>₹{fareBreakdown.deposit}</span>
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed var(--z-border)',
                      paddingTop: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.875rem' }}>Total Payable</span>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>(Includes ₹500 instant UPI refund on return)</div>
                    </div>
                    <span style={{ color: 'var(--z-emerald-dark)', fontWeight: 800, fontSize: '1.125rem' }}>
                      ₹{fareBreakdown.total}
                    </span>
                  </div>
                </div>
              )}

              {/* Search button */}
              <button className="z-btn z-btn-primary z-btn-full" onClick={handleSearch} disabled={duration < 1}>
                <IconSearch size={18} />
                Search Available EVs
              </button>
            </div>
          </div>

          {/* ---- VEHICLE FLEET CATALOG ---- */}
          <section className="fleet-section">
            <div className="z-container">
              <div
                className="fleet-heading"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
              >
                <div>
                  <h2>{searched ? `${availableVehicles.length} EVs Available` : 'Hosted EVs'}</h2>
                  {searched && (
                    <span className="z-badge z-badge-emerald" style={{ marginTop: '4px', display: 'inline-block' }}>
                      <IconZap size={12} /> Live Slots for {duration}h
                    </span>
                  )}
                </div>

                {/* Sorting/Filtering */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={refreshData}
                    style={{
                      background: 'var(--z-surface)',
                      border: '1px solid var(--z-border)',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--z-text-primary)',
                    }}
                    title="Refresh Live EVs"
                  >
                    <IconRefresh size={14} /> Refresh
                  </button>
                  <select
                    className="z-input"
                    style={{ padding: '6px 12px', fontSize: '0.8125rem', height: 'auto', borderRadius: '20px' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="none">Sort By</option>
                    <option value="battery">High Battery</option>
                    <option value="duration">Longest Duration</option>
                  </select>
                </div>
              </div>

              {availableVehicles.map((vehicle, idx) => (
                <div
                  key={vehicle.id}
                  className={`vehicle-card animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
                  style={vehicle.is_booked ? { opacity: 0.6, filter: 'grayscale(0.8)' } : {}}
                >
                  {/* Image area */}
                  <div className="vehicle-card-image">
                    <span className="ev-badge z-badge z-badge-emerald">
                      <IconZap size={10} /> EV
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '120px',
                          height: '80px',
                          background: `linear-gradient(135deg, ${vehicle.color}22, ${vehicle.color}44)`,
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${vehicle.color}33`,
                        }}
                      >
                        <IconScooterLarge color={vehicle.color} />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: 'var(--z-emerald-dark)',
                          background: 'var(--z-emerald-ultra-light)',
                          padding: '3px 8px',
                          borderRadius: 'var(--z-radius-full)',
                        }}
                      >
                        <IconBattery size={12} /> {vehicle.battery}%
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="vehicle-card-body">
                    <div className="vehicle-card-header">
                      <div>
                        <div className="vehicle-card-name">{vehicle.model}</div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--z-text-light)',
                            marginTop: '2px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <span>{vehicle.plate}</span>
                          <span>•</span>
                          <span style={{ color: 'var(--z-emerald)' }}>
                            <IconMapPin size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {vehicle.location}
                          </span>
                        </div>
                      </div>
                      <div className="vehicle-card-rate">
                        <div className="price">₹{fareBreakdown.rental}</div>
                        <div className="unit">/{duration}h pass</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--z-emerald)', marginBottom: '8px' }}>
                      Available for up to {vehicle.durationAvailable} hours
                    </div>

                    {/* Tags */}
                    <div className="vehicle-card-tags">
                      {vehicle.tags.map((tag, i) => (
                        <span key={i} className="z-tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta + Book */}
                    <div className="vehicle-card-meta">
                      {vehicle.is_booked ? (
                        <div className="subtotal" style={{ color: 'var(--z-orange)', fontWeight: 600 }}>
                          Available after {new Date(vehicle.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <div className="subtotal">
                          {duration}h Pass: <strong>₹{fareBreakdown.rental}</strong> + ₹500 dep
                        </div>
                      )}
                      <button
                        className="z-btn z-btn-primary z-btn-sm"
                        onClick={() => handleBookNow(vehicle)}
                        disabled={vehicle.is_booked}
                      >
                        {vehicle.is_booked ? 'Booked' : 'Book Pass'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {availableVehicles.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--z-text-muted)',
                  }}
                >
                  <IconSearch size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p>No EVs available for the selected slot.</p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Try adjusting your pickup area or time slot.</p>
                </div>
              )}
            </div>
          </section>
    </PageShell>
  )
}

// Large scooter icon for vehicle cards
function IconScooterLarge({ color = '#10B981' }) {
  return (
    <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
      <ellipse cx="14" cy="36" rx="7" ry="7" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
      <ellipse cx="50" cy="36" rx="7" ry="7" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
      <path d="M14 36h36" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M20 36l4-16h12l2 8h10l4-12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 28h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="36" r="3" fill={color} />
      <circle cx="50" cy="36" r="3" fill={color} />
      <path d="M48 12l4-8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
