// =============================================
// Zevrento — Global State Store (Context)
// Handles auth, bookings, and app-wide state
// Bulletproof multi-tier persistence (LocalStorage + Supabase)
// =============================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase.js'
import { VEHICLES, BOOKING_STATUS, generateBookingCode, generateOTP } from './data.js'
import { sendNotification } from './notifications.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('z_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isAuthenticated, setIsAuthenticated] = useState(!!user)

  // Booking state
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('z_bookings')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Availability slots (Rider-listed EVs)
  const [availabilitySlots, setAvailabilitySlots] = useState(() => {
    try {
      const saved = localStorage.getItem('z_slots')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // To prevent firing notifications on initial load
  const isInitialLoad = useRef(true)

  // Sync latest data from Supabase
  const refreshData = useCallback(async () => {
    // 1. Sync latest profile data
    const savedStr = localStorage.getItem('z_user')
    if (savedStr) {
      try {
        const saved = JSON.parse(savedStr)
        if (saved?.phone && saved.phone !== '') {
          const { data } = await supabase.from('profiles').select('*').eq('phone', saved.phone).single()
          if (data) {
            setUser(prev => prev ? {
              ...prev,
              kyc_status: data.kyc_status,
              kyc_verified: data.kyc_status === 'VERIFIED' || data.kyc_verified,
              address: data.address || prev.address || '',
            } : null)
          }
        }
      } catch (e) {
        console.warn('Notice syncing profile:', e)
      }
    }

    // 2. Sync Bookings (Safe merge: never wipe local bookings if Supabase returns empty)
    try {
      const { data: bData, error: bErr } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      if (!bErr && Array.isArray(bData)) {
        setBookings(prev => {
          const map = new Map()
          // Retain local bookings
          prev.forEach(b => { if (b?.id) map.set(b.id, b) })
          // Merge Supabase bookings (authoritative for cloud status)
          bData.forEach(b => { if (b?.id) map.set(b.id, b) })
          return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        })
      }
    } catch (e) {
      console.warn('Notice syncing bookings:', e)
    }

    // 3. Sync Availability Slots (Safe merge: retain all active listings)
    try {
      const { data: sData, error: sErr } = await supabase.from('availability_slots').select('*').order('created_at', { ascending: false })
      if (!sErr && Array.isArray(sData)) {
        setAvailabilitySlots(prev => {
          const map = new Map()
          prev.forEach(s => { if (s?.id) map.set(s.id, s) })
          sData.forEach(s => { if (s?.id) map.set(s.id, s) })
          return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        })
      }
    } catch (e) {
      console.warn('Notice syncing slots:', e)
    }
  }, [])

  useEffect(() => {
    refreshData().finally(() => {
      // Mark initial load complete after 1.5s
      setTimeout(() => {
        isInitialLoad.current = false
      }, 1500)
    })

    // Periodic sync every 4 seconds
    const intervalId = setInterval(() => {
      refreshData()
    }, 4000)

    return () => clearInterval(intervalId)
  }, [refreshData])

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('z_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('z_user')
    }
  }, [user])

  // Persist bookings to localStorage
  useEffect(() => {
    localStorage.setItem('z_bookings', JSON.stringify(bookings))
  }, [bookings])

  // Persist availability slots to localStorage
  useEffect(() => {
    localStorage.setItem('z_slots', JSON.stringify(availabilitySlots))
  }, [availabilitySlots])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'z_bookings') {
        try {
          setBookings(e.newValue ? JSON.parse(e.newValue) : [])
        } catch { /* ignore */ }
      }
      if (e.key === 'z_slots') {
        try {
          setAvailabilitySlots(e.newValue ? JSON.parse(e.newValue) : [])
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Fleet state (mutable copy for custom overrides)
  const [vehicles, setVehicles] = useState(VEHICLES)

  // ---- AUTH ----
  const login = useCallback((userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const submitKyc = useCallback(async () => {
    setUser((prev) => prev ? { ...prev, kyc_status: 'PENDING' } : null)
    if (user?.phone) {
      await supabase.from('profiles').update({ kyc_status: 'PENDING' }).eq('phone', user.phone)
    }
  }, [user])

  const updateProfile = useCallback(async (updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null)
    if (user?.phone) {
      await supabase.from('profiles').update(updates).eq('phone', user.phone)
    }
  }, [user])

  const verifyUserKyc = useCallback(async (phoneToVerify) => {
    if (user?.phone === phoneToVerify) {
      setUser((prev) => prev ? { ...prev, kyc_verified: true, kyc_status: 'VERIFIED' } : null)
    }
    await supabase.from('profiles').update({ kyc_status: 'VERIFIED', kyc_verified: true }).eq('phone', phoneToVerify)
  }, [user])

  // ---- BOOKINGS ----
  const createBooking = useCallback((bookingData) => {
    const bookingId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        })

    const booking = {
      id: bookingId,
      booking_code: generateBookingCode(),
      status: BOOKING_STATUS.CONFIRMED,
      pickup_otp: generateOTP(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      ...bookingData,
    }

    // 1. Immediately store in state and localStorage
    setBookings((prev) => [booking, ...prev.filter(b => b.id !== bookingId)])
    try {
      const current = JSON.parse(localStorage.getItem('z_bookings') || '[]')
      localStorage.setItem('z_bookings', JSON.stringify([booking, ...current.filter(b => b.id !== bookingId)]))
    } catch { /* ignore */ }

    // 2. Real-time Audio and Desktop Notification
    sendNotification(`🎉 New Booking: ${booking.booking_code}`, {
      body: `Vehicle: ${booking.vehicle_model || 'EV'} | Amount: ₹${booking.total_amount}`,
      type: 'booking'
    })

    // 3. Sync to Supabase
    supabase.from('bookings').insert([booking]).then(({ error }) => {
      if (error) {
        console.warn('Notice syncing booking to Supabase (preserved in local storage):', error.message)
      } else {
        console.log('✅ Booking synced successfully to Supabase!')
      }
    })

    return booking
  }, [])

  const updateBookingStatus = useCallback((bookingId, status, extra = {}) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status, ...extra } : b
      )
    )

    supabase.from('bookings').update({ status, ...extra }).eq('id', bookingId).then(({ error }) => {
      if (error) console.warn('Notice updating booking in Supabase:', error.message)
    })
  }, [])

  const approveBooking = useCallback((bookingId) => {
    const otp = generateOTP()
    updateBookingStatus(bookingId, BOOKING_STATUS.CONFIRMED, { pickup_otp: otp })
    sendNotification(`OTP Issued: ${otp}`, {
      body: `Booking approved and OTP generated for pickup`,
      type: 'info'
    })
    return otp
  }, [updateBookingStatus])

  const completeBooking = useCallback((bookingId) => {
    updateBookingStatus(bookingId, BOOKING_STATUS.COMPLETED)
    sendNotification('Trip Completed', {
      body: `Booking completed. Deposit refunded and host credited.`,
      type: 'info'
    })
  }, [updateBookingStatus])

  const deleteBooking = useCallback((bookingId) => {
    setBookings((prev) => prev.filter(b => b.id !== bookingId))
    try {
      const current = JSON.parse(localStorage.getItem('z_bookings') || '[]')
      localStorage.setItem('z_bookings', JSON.stringify(current.filter(b => b.id !== bookingId)))
    } catch { /* ignore */ }

    supabase.from('bookings').delete().eq('id', bookingId).then(({ error }) => {
      if (error) console.warn('Notice deleting booking in Supabase:', error.message)
    })
  }, [])

  // ---- AVAILABILITY SLOTS (Rider Host Listed Vehicles) ----
  const publishSlot = useCallback((slotData) => {
    const slot = {
      id: `s_${Date.now()}`,
      is_booked: false,
      created_at: new Date().toISOString(),
      ...slotData,
    }

    // 1. Immediately store in state and localStorage
    setAvailabilitySlots((prev) => [slot, ...prev.filter(s => s.id !== slot.id)])
    try {
      const current = JSON.parse(localStorage.getItem('z_slots') || '[]')
      localStorage.setItem('z_slots', JSON.stringify([slot, ...current.filter(s => s.id !== slot.id)]))
    } catch { /* ignore */ }

    // 2. Real-time Audio and Desktop Notification
    sendNotification(`⚡ New Vehicle Listed: ${slot.model}`, {
      body: `Plate: ${slot.plate} | Location: ${slot.pickup_location || 'Hub'}`,
      type: 'vehicle'
    })

    // 3. Sync to Supabase
    supabase.from('availability_slots').insert([slot]).then(({ error }) => {
      if (error) {
        console.warn('Notice syncing slot to Supabase (preserved in local storage):', error.message)
      } else {
        console.log('✅ Vehicle slot synced successfully to Supabase!')
      }
    })

    return slot
  }, [])

  const deleteSlot = useCallback((slotId) => {
    setAvailabilitySlots((prev) => prev.filter(s => s.id !== slotId))
    try {
      const current = JSON.parse(localStorage.getItem('z_slots') || '[]')
      localStorage.setItem('z_slots', JSON.stringify(current.filter(s => s.id !== slotId)))
    } catch { /* ignore */ }

    supabase.from('availability_slots').delete().eq('id', slotId).then(({ error }) => {
      if (error) console.warn('Notice deleting slot in Supabase:', error.message)
    })
  }, [])

  const markSlotAsBooked = useCallback((slotId) => {
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, is_booked: true } : s))
    )

    supabase.from('availability_slots').update({ is_booked: true }).eq('id', slotId).then(({ error }) => {
      if (error) console.warn('Notice updating slot in Supabase:', error.message)
    })
  }, [])

  const value = {
    // Auth
    user,
    isAuthenticated,
    login,
    logout,
    verifyUserKyc,
    submitKyc,
    updateProfile,
    // Data
    vehicles,
    setVehicles,
    bookings,
    availabilitySlots,
    // Actions
    createBooking,
    updateBookingStatus,
    approveBooking,
    completeBooking,
    deleteBooking,
    publishSlot,
    deleteSlot,
    markSlotAsBooked,
    refreshData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
