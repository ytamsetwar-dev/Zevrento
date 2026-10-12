// =============================================
// Zevrento — Global State Store (Context)
// Handles auth, bookings, and app-wide state
// Bulletproof multi-tier persistence (LocalStorage + Supabase)
// =============================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase.js'
import { VEHICLES, BOOKING_STATUS, generateBookingCode, generateOTP, toInputDateTime } from './data.js'
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

    // 2. Sync Bookings (Authoritative Cloud Sync: Deletions in Supabase propagate to all clients)
    try {
      const { data: bData, error: bErr } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      if (!bErr && Array.isArray(bData)) {
        setBookings(prev => {
          const now = Date.now()
          // Only preserve local bookings that are marked pending sync and created within the last 20 seconds
          const pendingNewLocal = prev.filter(b => b?._pending_sync && (now - new Date(b.created_at || now).getTime()) < 20000)

          const resultMap = new Map()

          // Supabase is authoritative!
          bData.forEach(remote => {
            if (!remote?.id) return
            const local = prev.find(p => p.id === remote.id)
            resultMap.set(remote.id, {
              ...local,
              ...remote,
              // If local or remote completed, persist completion
              status: (remote.status === 'COMPLETED' || local?.status === 'COMPLETED') ? 'COMPLETED' : remote.status,
            })
          })

          // Add locally pending items
          pendingNewLocal.forEach(p => {
            if (!resultMap.has(p.id)) resultMap.set(p.id, p)
          })

          const finalBookings = Array.from(resultMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          try {
            localStorage.setItem('z_bookings', JSON.stringify(finalBookings))
          } catch { /* ignore */ }
          return finalBookings
        })
      }
    } catch (e) {
      console.warn('Notice syncing bookings:', e)
    }

    // 3. Sync Availability Slots (Authoritative Cloud Sync: Deletions in Supabase propagate to all clients)
    try {
      const { data: sData, error: sErr } = await supabase.from('availability_slots').select('*').order('created_at', { ascending: false })
      if (!sErr && Array.isArray(sData)) {
        setAvailabilitySlots(prev => {
          const now = Date.now()
          const pendingNewLocal = prev.filter(s => s?._pending_sync && (now - new Date(s.created_at || now).getTime()) < 20000)

          const resultMap = new Map()

          sData.forEach(remote => {
            if (!remote?.id) return
            const local = prev.find(p => p.id === remote.id)
            resultMap.set(remote.id, {
              ...local,
              ...remote,
            })
          })

          pendingNewLocal.forEach(p => {
            if (!resultMap.has(p.id)) resultMap.set(p.id, p)
          })

          const finalSlots = Array.from(resultMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          try {
            localStorage.setItem('z_slots', JSON.stringify(finalSlots))
          } catch { /* ignore */ }
          return finalSlots
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

    // Periodic sync every 3 seconds
    const intervalId = setInterval(() => {
      refreshData()
    }, 3000)

    // Realtime channel for instant cross-device updates
    const channel = supabase.channel('zevrento_live_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        refreshData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability_slots' }, () => {
        refreshData()
      })
      .subscribe()

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
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
      : 'b_' + Date.now()

    const booking = {
      id: bookingId,
      booking_code: generateBookingCode(),
      status: BOOKING_STATUS.CONFIRMED,
      pickup_otp: generateOTP(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      customer_phone: user?.phone || '',
      vehicle_model: 'EV Scooter',
      hub_name: 'Main Hub',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 3600000).toISOString(),
      total_amount: 198,
      deposit: 500,
      platform_fee: 10,
      host_payout: 140,
      duration: 2,
      duration_hours: 2,
      plan_type: 'HOURLY',
      plan_name: 'Micro Slot (1h)',
      is_subscription: false,
      payment_mode: 'UPI',
      _pending_sync: true,
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
      body: `Plan: ${booking.plan_name || booking.plan_type} | Vehicle: ${booking.vehicle_model || 'EV'} | Amount: ₹${booking.total_amount}`,
      type: 'booking'
    })

    // 3. Clean DB payload
    const dbBooking = {
      id: booking.id,
      booking_code: booking.booking_code,
      status: booking.status,
      pickup_otp: booking.pickup_otp,
      customer_phone: booking.customer_phone || '',
      vehicle_model: booking.vehicle_model || '',
      vehicle_id: booking.vehicle_id || null,
      slot_id: booking.slot_id || null,
      hub_name: booking.hub_name || 'Main Hub',
      start_time: booking.start_time,
      end_time: booking.end_time,
      total_amount: booking.total_amount || 0,
      deposit: booking.deposit !== undefined ? booking.deposit : 500,
      platform_fee: booking.platform_fee || 10,
      host_payout: booking.host_payout || 140,
      duration: booking.duration || 1,
      duration_hours: booking.duration_hours || booking.duration || 1,
      plan_type: booking.plan_type || 'HOURLY',
      plan_name: booking.plan_name || 'On-Demand Pass',
      is_subscription: booking.is_subscription || false,
      payment_mode: booking.payment_mode || 'UPI',
      utr_number: booking.utr_number || null,
      expires_at: booking.expires_at || null,
    }

    supabase.from('bookings').insert([dbBooking]).then(async ({ error }) => {
      if (error) {
        console.warn('Notice syncing full booking to Supabase, attempting core insert:', error.message)
        // Core fallback if new columns are not yet in Supabase cache
        const coreBooking = {
          id: dbBooking.id,
          booking_code: dbBooking.booking_code,
          status: dbBooking.status,
          pickup_otp: dbBooking.pickup_otp,
          customer_phone: dbBooking.customer_phone,
          vehicle_model: dbBooking.vehicle_model,
          vehicle_id: dbBooking.vehicle_id,
          start_time: dbBooking.start_time,
          end_time: dbBooking.end_time,
          total_amount: dbBooking.total_amount,
          deposit: dbBooking.deposit,
          platform_fee: dbBooking.platform_fee,
          host_payout: dbBooking.host_payout,
          duration: dbBooking.duration,
          payment_mode: dbBooking.payment_mode,
        }
        const { error: coreErr } = await supabase.from('bookings').insert([coreBooking])
        if (coreErr) console.warn('Core booking insert error:', coreErr.message)
      } else {
        console.log('✅ Booking synced successfully to Supabase!')
      }
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, _pending_sync: false } : b))
    })

    return booking
  }, [user])

  const updateBookingStatus = useCallback((bookingId, status, extra = {}) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status, ...extra } : b
      )
    )

    try {
      const current = JSON.parse(localStorage.getItem('z_bookings') || '[]')
      localStorage.setItem('z_bookings', JSON.stringify(
        current.map(b => b.id === bookingId ? { ...b, status, ...extra } : b)
      ))
    } catch { /* ignore */ }

    supabase.from('bookings').update({ status, ...extra }).eq('id', bookingId).then(async ({ error }) => {
      if (error) {
        console.warn('Notice updating with extra fields in Supabase, falling back to core status:', error.message)
        const { error: coreErr } = await supabase.from('bookings').update({ status }).eq('id', bookingId)
        if (coreErr) console.warn('Core status update notice:', coreErr.message)
      }
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

  const deleteBooking = useCallback(async (bookingId) => {
    setBookings((prev) => prev.filter(b => b.id !== bookingId))
    try {
      const current = JSON.parse(localStorage.getItem('z_bookings') || '[]')
      localStorage.setItem('z_bookings', JSON.stringify(current.filter(b => b.id !== bookingId)))
    } catch { /* ignore */ }

    const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
    if (error) console.warn('Notice deleting booking in Supabase:', error.message)
    refreshData()
  }, [refreshData])

  // ---- AVAILABILITY SLOTS (Rider Host Listed Vehicles) ----
  const publishSlot = useCallback((slotData) => {
    const slot = {
      id: `s_${Date.now()}`,
      is_booked: false,
      created_at: new Date().toISOString(),
      listing_type: slotData.listing_type || 'SINGLE_SLOT',
      commitment_days: slotData.commitment_days || 1,
      daily_hours: slotData.daily_hours || null,
      _pending_sync: true,
      ...slotData,
    }

    setAvailabilitySlots((prev) => [slot, ...prev.filter(s => s.id !== slot.id)])
    try {
      const current = JSON.parse(localStorage.getItem('z_slots') || '[]')
      localStorage.setItem('z_slots', JSON.stringify([slot, ...current.filter(s => s.id !== slot.id)]))
    } catch { /* ignore */ }

    sendNotification(`⚡ New Vehicle Listed: ${slot.model}`, {
      body: `Type: ${slot.listing_type === 'WEEKLY_COMMITMENT' ? 'Weekly Commitment' : 'Single Slot'} | Plate: ${slot.plate} | Location: ${slot.pickup_location || 'Hub'}`,
      type: 'vehicle'
    })

    const dbSlot = {
      id: slot.id,
      model: slot.model,
      plate: slot.plate,
      battery: slot.battery || 90,
      host_phone: slot.host_phone || '',
      start_time: slot.start_time || new Date().toISOString(),
      end_time: slot.end_time || new Date(Date.now() + 6 * 3600000).toISOString(),
      hub_id: slot.hub_id || null,
      pickup_location: slot.pickup_location || '',
      listing_type: slot.listing_type || 'SINGLE_SLOT',
      commitment_days: slot.commitment_days || 1,
      daily_hours: slot.daily_hours || null,
      is_booked: false,
    }

    supabase.from('availability_slots').insert([dbSlot]).then(async ({ error }) => {
      if (error) {
        console.warn('Notice syncing slot to Supabase with full schema, trying fallback:', error.message)
        const coreSlot = {
          id: dbSlot.id,
          model: dbSlot.model,
          plate: dbSlot.plate,
          battery: dbSlot.battery,
          host_phone: dbSlot.host_phone,
          start_time: dbSlot.start_time,
          end_time: dbSlot.end_time,
          hub_id: dbSlot.hub_id,
          pickup_location: dbSlot.pickup_location,
          is_booked: false,
        }
        await supabase.from('availability_slots').insert([coreSlot])
      } else {
        console.log('✅ Vehicle slot synced successfully to Supabase!')
      }
      setAvailabilitySlots(prev => prev.map(s => s.id === slot.id ? { ...s, _pending_sync: false } : s))
    })

    return slot
  }, [])

  const deleteSlot = useCallback(async (slotId) => {
    setAvailabilitySlots((prev) => prev.filter(s => s.id !== slotId))
    try {
      const current = JSON.parse(localStorage.getItem('z_slots') || '[]')
      localStorage.setItem('z_slots', JSON.stringify(current.filter(s => s.id !== slotId)))
    } catch { /* ignore */ }

    const { error } = await supabase.from('availability_slots').delete().eq('id', slotId)
    if (error) console.warn('Notice deleting slot in Supabase:', error.message)
    refreshData()
  }, [refreshData])

  const markSlotAsBooked = useCallback((slotId) => {
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, is_booked: true } : s))
    )

    supabase.from('availability_slots').update({ is_booked: true }).eq('id', slotId).then(({ error }) => {
      if (error) console.warn('Notice updating slot in Supabase:', error.message)
    })
  }, [])

  // Smart slot splitter: When customer books a slot for part of the time (e.g. 2h out of 6h),
  // the vehicle becomes available again after customer booking end time + 1 hour turnaround!
  const splitOrBookSlot = useCallback((slotId, bookingStartTime, bookingEndTime) => {
    setAvailabilitySlots((prev) => {
      const targetSlot = prev.find(s => s.id === slotId)
      if (!targetSlot) return prev

      const originalEnd = new Date(targetSlot.end_time)
      const bookingEnd = new Date(bookingEndTime)

      // Turnaround buffer = customer booking end time + 1 hour extra
      const turnaroundEnd = new Date(bookingEnd.getTime() + 60 * 60 * 1000)

      // 1. Mark the booked portion
      const updatedBookedSlot = {
        ...targetSlot,
        end_time: bookingEndTime,
        is_booked: true,
      }

      supabase.from('availability_slots').update({
        end_time: bookingEndTime,
        is_booked: true
      }).eq('id', slotId).then(({ error }) => {
        if (error) console.warn('Notice updating booked slot in Supabase:', error.message)
      })

      // 2. Check if remaining window has at least 1 hour available
      const remainingMs = originalEnd.getTime() - turnaroundEnd.getTime()
      const minOneHourMs = 60 * 60 * 1000

      if (remainingMs >= minOneHourMs) {
        // Create remaining slot from turnaroundEnd to originalEnd
        const remainingSlot = {
          id: `s_${Date.now()}`,
          vehicle_id: targetSlot.vehicle_id || targetSlot.id,
          model: targetSlot.model,
          plate: targetSlot.plate,
          battery: Math.max(20, (targetSlot.battery || 90) - 15),
          host_phone: targetSlot.host_phone,
          pickup_location: targetSlot.pickup_location,
          hub_id: targetSlot.hub_id,
          start_time: toInputDateTime(turnaroundEnd),
          end_time: targetSlot.end_time,
          is_booked: false,
          created_at: new Date().toISOString(),
        }

        // Sync remaining slot to Supabase
        const dbRemaining = {
          id: remainingSlot.id,
          model: remainingSlot.model,
          plate: remainingSlot.plate,
          battery: remainingSlot.battery,
          host_phone: remainingSlot.host_phone || '',
          start_time: remainingSlot.start_time,
          end_time: remainingSlot.end_time,
          hub_id: remainingSlot.hub_id || null,
          pickup_location: remainingSlot.pickup_location || '',
          is_booked: false,
        }

        supabase.from('availability_slots').insert([dbRemaining]).then(({ error }) => {
          if (error) console.warn('Notice inserting remaining slot in Supabase:', error.message)
        })

        const updated = prev.map(s => s.id === slotId ? updatedBookedSlot : s)
        const result = [remainingSlot, ...updated]
        try {
          localStorage.setItem('z_slots', JSON.stringify(result))
        } catch { /* ignore */ }
        return result
      } else {
        const result = prev.map(s => s.id === slotId ? updatedBookedSlot : s)
        try {
          localStorage.setItem('z_slots', JSON.stringify(result))
        } catch { /* ignore */ }
        return result
      }
    })
  }, [])

  // Structured ride return completion with damage and late drop-off inspection
  const completeRideWithInspection = useCallback((bookingId, inspectionData = {}) => {
    const {
      conditionChecked = true,
      onTime = true,
      isLate = false,
      lateMinutes = 0,
      lateFee = 0,
      hasDamage = false,
      damageNotes = '',
      depositRefund = 500
    } = inspectionData

    const statusUpdates = {
      status: BOOKING_STATUS.COMPLETED,
      inspection_condition_checked: conditionChecked,
      inspection_on_time: onTime,
      is_late: isLate,
      late_minutes: lateMinutes,
      late_fee: lateFee,
      has_damage: hasDamage,
      damage_notes: damageNotes,
      refund_amount: depositRefund,
      deposit_status: hasDamage 
        ? 'WITHHELD_FOR_DAMAGE_REVIEW' 
        : (isLate ? 'PARTIAL_REFUND_LATE_FEE' : 'FULL_REFUND'),
      settlement_logged: true,
      host_share_settled: true,
      platform_cut_settled: true,
      ledger_partitioned_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, ...statusUpdates } : b
      )
    )

    try {
      const current = JSON.parse(localStorage.getItem('z_bookings') || '[]')
      localStorage.setItem('z_bookings', JSON.stringify(
        current.map(b => b.id === bookingId ? { ...b, ...statusUpdates } : b)
      ))
    } catch { /* ignore */ }

    // Resilient update to Supabase: tries full fields, falls back to status alone
    supabase.from('bookings').update(statusUpdates).eq('id', bookingId).then(async ({ error }) => {
      if (error) {
        console.warn('Full status update notice, falling back to core status:', error.message)
        const { error: coreErr } = await supabase.from('bookings').update({ status: BOOKING_STATUS.COMPLETED }).eq('id', bookingId)
        if (coreErr) {
          console.warn('Notice updating status in Supabase:', coreErr.message)
        } else {
          console.log('✅ Status updated to COMPLETED in Supabase!')
        }
      } else {
        console.log('✅ Full inspection data saved to Supabase!')
      }
    })

    sendNotification('Trip Return Completed', {
      body: hasDamage 
        ? `Deposit withheld for video verification. Damage notes recorded.`
        : (isLate ? `Returned late by ${lateMinutes}m. Late fee ₹${lateFee} deducted. Refund: ₹${depositRefund}` : `Vehicle in good condition. Full deposit ₹${depositRefund} refunded.`),
      type: 'info'
    })
  }, [])

  const requestReturnRide = useCallback((bookingId) => {
    updateBookingStatus(bookingId, BOOKING_STATUS.ACTIVE, {
      return_requested: true,
      return_requested_at: new Date().toISOString()
    })
    sendNotification('Drop-off Requested', {
      body: 'Customer has initiated return. Please complete vehicle inspection.',
      type: 'info'
    })
  }, [updateBookingStatus])

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
    completeRideWithInspection,
    requestReturnRide,
    deleteBooking,
    publishSlot,
    deleteSlot,
    markSlotAsBooked,
    splitOrBookSlot,
    refreshData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
