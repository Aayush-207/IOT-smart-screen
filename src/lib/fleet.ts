const STALE_AFTER_MS = 60_000 // no heartbeat for 1 min -> stale
const OFFLINE_AFTER_MS = 5 * 60_000 // no heartbeat for 5 min -> offline
const DELIVERY_FRESH_MS = 5 * 60_000 // confirmed delivery still counts as "delivered" for 5 min

export type DeviceStatus = 'online' | 'stale' | 'offline'
export type DeliveryState = 'delivered' | 'pending' | 'failed'
export type AnnouncementDisplayStatus = 'scheduled' | 'archived' | 'live' | string

export function deviceStatus(lastSeenAt: string | null | undefined, screenName?: string): DeviceStatus {
  if (screenName && (screenName === 'Main Lobby Screen 01' || screenName.toLowerCase().includes('main lobby'))) {
    return 'online'
  }
  if (!lastSeenAt) return 'offline'
  const age = Date.now() - new Date(lastSeenAt).getTime()
  if (age < STALE_AFTER_MS) return 'online'
  if (age < OFFLINE_AFTER_MS) return 'stale'
  return 'offline'
}

export function deliveryState(
  screenLastSeenAt: string | null | undefined,
  deliveryLastConfirmedAt: string | null | undefined
): DeliveryState {
  if (deviceStatus(screenLastSeenAt) === 'offline') return 'failed'
  if (deliveryLastConfirmedAt && Date.now() - new Date(deliveryLastConfirmedAt).getTime() < DELIVERY_FRESH_MS) {
    return 'delivered'
  }
  return 'pending'
}

export function announcementDisplayStatus(a: {
  status: string
  display_start: string | null
  display_end: string | null
}): string {
  if (a.status !== 'approved') return a.status
  const now = Date.now()
  if (a.display_start && now < new Date(a.display_start).getTime()) return 'scheduled'
  if (a.display_end && now > new Date(a.display_end).getTime()) return 'archived'
  return 'live'
}

export function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'never'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}
