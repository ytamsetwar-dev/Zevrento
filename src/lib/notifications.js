// =============================================
// Zevrento — Real-time Notification Engine
// Supports Web Audio Chimes, Browser Desktop Notifications,
// and In-App Toast Alerts (No external dependencies)
// =============================================

/**
 * Plays a pleasant synthesizer chime for alerts
 * @param {'booking' | 'vehicle' | 'info'} type 
 */
export function playChime(type = 'info') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    if (type === 'booking') {
      // Upbeat celebration chime (D5 -> A5 -> B5)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now)
      osc.frequency.setValueAtTime(880.00, now + 0.12)
      osc.frequency.setValueAtTime(987.77, now + 0.24)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
      osc.start(now)
      osc.stop(now + 0.7)
    } else if (type === 'vehicle') {
      // Vehicle listing chime (G4 -> C5 -> E5)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(392.00, now)
      osc.frequency.setValueAtTime(523.25, now + 0.12)
      osc.frequency.setValueAtTime(659.25, now + 0.24)
      gain.gain.setValueAtTime(0.28, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      osc.start(now)
      osc.stop(now + 0.6)
    } else {
      // Gentle notification tone
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.12)
      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      osc.start(now)
      osc.stop(now + 0.45)
    }
  } catch (e) {
    // AudioContext can be blocked until first user interaction; silent fallback
  }
}

/**
 * Requests browser desktop notification permissions
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'granted') return 'granted'
  try {
    const perm = await Notification.requestPermission()
    return perm
  } catch (e) {
    return 'denied'
  }
}

/**
 * Triggers a desktop notification and audio chime
 */
export function sendNotification(title, { body = '', type = 'info', icon = '/favicon.svg' } = {}) {
  // Always play audio chime
  playChime(type)

  // Try showing native Desktop Notification if granted
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
      })
    }
  } catch (err) {
    console.warn('Native notification suppressed:', err)
  }
}
