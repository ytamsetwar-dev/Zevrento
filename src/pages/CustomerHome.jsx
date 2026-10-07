// =============================================
// Zevrento — Customer Home (Royal Brothers Flow)
// Sticky search card + Vehicle fleet catalog
// =============================================
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { HUBS, PRICING, getHoursDiff, roundToNextHour, addHours, toInputDateTime, calculateFare } from '../lib/data.js'
import { PageShell, CustomerBottomNav } from '../components/Layout.jsx'
import { IconMapPin, IconClock, IconCalendar, IconSearch, IconZap, IconBattery, IconChevronDown, IconRefresh } from '../components/Icons.jsx'

export default function CustomerHome() {
  const { vehicles, availabilitySlots, user, refreshData } = useApp()
  const navigate = useNavigate()

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

  const availableVehicles = useMemo(() => {
    let hosts = availabilitySlots
      .filter((s) => !s.is_booked)
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
          pickup_location: s.pickup_location
        }
      })

    // Filter by location
    hosts = hosts.filter(h => {
      if (h.hub_id) return h.hub_id === hub;
      if (h.pickup_location) return h.pickup_location.includes(selectedHub?.name);
      return true; // Fallback
    })

    // Filter by requested duration and time slot if a search was made
    if (searched) {
      const pTime = new Date(pickupTime)
      const dTime = new Date(dropoffTime)
      hosts = hosts.filter(h => {
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

  const handleSearch = () => {
    if (duration < 1) return
    setSearched(true)
  }

  const handleBookNow = (vehicle) => {
    if (user?.kyc_status !== 'VERIFIED' && !user?.kyc_verified) {
      alert("Your KYC is not verified yet. Please go to your Profile and complete KYC verification to book a vehicle.")
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
        fare: calculateFare(duration),
      },
    })
  }

  return (
    <PageShell nav={<CustomerBottomNav />}>
      {/* ---- STARTUP POPUP ---- */}
      {showPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 999999, // Super high z-index
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="animate-fade-in-up" style={{
            background: 'var(--z-bg)', borderRadius: '24px', padding: '32px 24px',
            textAlign: 'center', maxWidth: '380px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--z-border)'
          }}>
            <div style={{ background: 'var(--z-emerald-ultra-light)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
               <IconZap size={32} style={{ color: 'var(--z-emerald)' }} />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 800 }}>Welcome to Zevrento!</h2>
            <p style={{ color: 'var(--z-text-primary)', fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '24px', opacity: 0.9 }}>
              Zevrento is the platform where owners host their idle EVs, and you can rent them instantly starting at just <strong>₹99/hour</strong>. 
              <br/><br/>Zero hassle, unlimited kilometers, 100% tension-free!
            </p>
            <button 
              className="z-btn z-btn-primary z-btn-full z-btn-lg" 
              onClick={() => setShowPopup(false)}
              style={{ fontWeight: 700, fontSize: '1rem', padding: '16px' }}
            >
              Start Riding
            </button>
          </div>
        </div>
      )}

      {/* ---- STICKY SEARCH CARD ---- */}
      <div className="search-card">
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
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <IconChevronDown
                size={16}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--z-text-light)' }}
              />
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
                onChange={(e) => setPickupTime(e.target.value)}
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
                onChange={(e) => setDropoffTime(e.target.value)}
                min={pickupTime}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Duration counter */}
          {duration >= 1 && (
            <div className="search-duration">
              <IconClock size={16} />
              <span>Duration: {duration} hour{duration !== 1 ? 's' : ''}</span>
              <span style={{ color: 'var(--z-emerald)', fontWeight: 700 }}>• ₹{PRICING.baseRate * duration} + ₹{PRICING.deposit} deposit</span>
            </div>
          )}

          {/* Search button */}
          <button
            className="z-btn z-btn-primary z-btn-full"
            onClick={handleSearch}
            disabled={duration < 1}
          >
            <IconSearch size={18} />
            Search Available EVs
          </button>
        </div>
      </div>

      {/* ---- VEHICLE FLEET CATALOG ---- */}
      <section className="fleet-section">
        <div className="z-container">
          <div className="fleet-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2>
                {searched ? `${availableVehicles.length} EVs Available` : 'Hosted EVs'}
              </h2>
              {searched && (
                <span className="z-badge z-badge-emerald" style={{ marginTop: '4px', display: 'inline-block' }}>
                  <IconZap size={12} /> Live
                </span>
              )}
            </div>
            
            {/* Sorting/Filtering */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={refreshData}
                style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', padding: '6px 10px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--z-text-primary)' }}
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
            >
              {/* Image area */}
              <div className="vehicle-card-image">
                <span className="ev-badge z-badge z-badge-emerald">
                  <IconZap size={10} /> EV
                </span>
                {/* Stylized scooter placeholder */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '120px',
                    height: '80px',
                    background: `linear-gradient(135deg, ${vehicle.color}22, ${vehicle.color}44)`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${vehicle.color}33`,
                  }}>
                    <IconScooterLarge color={vehicle.color} />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--z-emerald-dark)',
                    background: 'var(--z-emerald-ultra-light)',
                    padding: '3px 8px',
                    borderRadius: 'var(--z-radius-full)',
                  }}>
                    <IconBattery size={12} /> {vehicle.battery}%
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="vehicle-card-body">
                <div className="vehicle-card-header">
                  <div>
                    <div className="vehicle-card-name">{vehicle.model}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--z-text-light)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span>{vehicle.plate}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--z-emerald)' }}><IconMapPin size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {vehicle.location}</span>
                    </div>
                  </div>
                  <div className="vehicle-card-rate">
                    <div className="price">₹{vehicle.rate}</div>
                    <div className="unit">/hr</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--z-emerald)', marginBottom: '8px' }}>
                  Available for up to {vehicle.durationAvailable} hours
                </div>

                {/* Tags */}
                <div className="vehicle-card-tags">
                  {vehicle.tags.map((tag, i) => (
                    <span key={i} className="z-tag">{tag}</span>
                  ))}
                </div>

                {/* Meta + Book */}
                <div className="vehicle-card-meta">
                  {duration >= 1 && searched ? (
                    <div className="subtotal">
                      {duration}h → <strong>₹{vehicle.rate * duration}</strong> + ₹500 deposit
                    </div>
                  ) : (
                    <div className="subtotal">
                      Starting at <strong>₹{vehicle.rate}/hr</strong>
                    </div>
                  )}
                  <button
                    className="z-btn z-btn-primary z-btn-sm"
                    onClick={() => handleBookNow(vehicle)}
                    disabled={!searched}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}

          {availableVehicles.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--z-text-muted)',
            }}>
              <IconSearch size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>No EVs available for the selected slot.</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Try adjusting your pickup time.</p>
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
