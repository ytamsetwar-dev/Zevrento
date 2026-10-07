// =============================================
// Zevrento — Global State Store (Context)
// Handles auth, bookings, and app-wide state
// =============================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase.js'
import { VEHICLES, BOOKING_STATUS, generateBookingCode, generateOTP } from './data.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('z_user')
    return saved ? JSON.parse(saved) : null
  })
  const [isAuthenticated, setIsAuthenticated] = useState(!!user)

  // Booking state
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('z_bookings')
    return saved ? JSON.parse(saved) : []
  })
  const [availabilitySlots, setAvailabilitySlots] = useState(() => {
    const saved = localStorage.getItem('z_slots')
    return saved ? JSON.parse(saved) : []
  })

  // Fetch from Supabase on load
  useEffect(() => {
    async function fetchData() {
      const { data: bData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      if (bData && bData.length > 0) setBookings(bData)
      
      const { data: sData } = await supabase.from('availability_slots').select('*').order('created_at', { ascending: false })
      if (sData && sData.length > 0) setAvailabilitySlots(sData)
    }
    fetchData()
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('z_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('z_user')
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('z_bookings', JSON.stringify(bookings))
  }, [bookings])

  useEffect(() => {
    localStorage.setItem('z_slots', JSON.stringify(availabilitySlots))
  }, [availabilitySlots])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'z_bookings') {
        setBookings(e.newValue ? JSON.parse(e.newValue) : [])
      }
      if (e.key === 'z_slots') {
        setAvailabilitySlots(e.newValue ? JSON.parse(e.newValue) : [])
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Fleet state (mutable copy)
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
    // Customer submits KYC (moves to PENDING)
    setUser((prev) => prev ? { ...prev, kyc_status: 'PENDING' } : null)
    if (user?.phone) {
      await supabase.from('profiles').update({ kyc_status: 'PENDING' }).eq('phone', user.phone)
    }
  }, [user])

  const verifyUserKyc = useCallback(async (phoneToVerify) => {
    // Admin approves KYC
    if (user?.phone === phoneToVerify) {
      setUser((prev) => prev ? { ...prev, kyc_verified: true, kyc_status: 'VERIFIED' } : null)
    }
    await supabase.from('profiles').update({ kyc_status: 'VERIFIED' }).eq('phone', phoneToVerify)
  }, [user])

  // ---- BOOKINGS ----
  const createBooking = useCallback((bookingData) => {
    const booking = {
      id: `b_${Date.now()}`,
      booking_code: generateBookingCode(),
      status: BOOKING_STATUS.PENDING_KYC,
      pickup_otp: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min lock
      ...bookingData,
    }
    setBookings((prev) => [booking, ...prev])
    
    // Background sync to Supabase
    supabase.from('bookings').insert([booking]).then(({error}) => {
      if (error) console.error('Supabase insert booking error:', error)
    })
    
    return booking
  }, [])

  const updateBookingStatus = useCallback((bookingId, status, extra = {}) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status, ...extra } : b
      )
    )
    
    // Background sync to Supabase
    supabase.from('bookings').update({ status, ...extra }).eq('id', bookingId).then(({error}) => {
      if (error) console.error('Supabase update booking error:', error)
    })
  }, [])

  const approveBooking = useCallback((bookingId) => {
    const otp = generateOTP()
    updateBookingStatus(bookingId, BOOKING_STATUS.CONFIRMED, { pickup_otp: otp })
    return otp
  }, [updateBookingStatus])

  const completeBooking = useCallback((bookingId) => {
    updateBookingStatus(bookingId, BOOKING_STATUS.COMPLETED)
  }, [updateBookingStatus])

  // ---- AVAILABILITY SLOTS (Rider Host) ----
  const publishSlot = useCallback((slotData) => {
    const slot = {
      id: `s_${Date.now()}`,
      is_booked: false,
      created_at: new Date().toISOString(),
      ...slotData,
    }
    setAvailabilitySlots((prev) => [slot, ...prev])
    
    // Background sync to Supabase
    supabase.from('availability_slots').insert([slot]).then(({error}) => {
      if (error) console.error('Supabase insert slot error:', error)
    })
    
    return slot
  }, [])

  const value = {
    // Auth
    user,
    isAuthenticated,
    login,
    logout,
    verifyUserKyc,
    submitKyc,
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
    publishSlot,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
