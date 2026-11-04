const STALE_AFTER_MS = 60_000 // no heartbeat for 1 min -> stale
const OFFLINE_AFTER_MS = 5 * 60_000 // no heartbeat for 5 min -> offline
const DELIVERY_FRESH_MS = 5 * 60_000 // confirmed delivery still counts as "delivered" for 5 min

export type DeviceStatus = 'online' | 'stale' | 'offline'
export type DeliveryState = 'delivered' | 'pending' | 'failed'
export type AnnouncementDisplayStatus = 'scheduled' | 'archived' | 'live' | string

export function deviceStatus(lastSeenAt: string | null | undefined): DeviceStatus {
  if (!lastSeenAt) return 'offline'
  const age = Date.now() - new Date(lastSeenAt).getTime()
  if (age < STALE_AFTER_MS) return 'online'
  if (age < OFFLINE_AFTER_MS) return 'stale'
  return 'offline'
}

// Single source of truth for "does this announcement belong on this screen",
// shared by the device endpoint and the dashboards.
// ponytail: substring match so older rows targeting "Engineering Wing" still reach
// zone "Engineering"; a zone name inside another (e.g. "Lab" / "Collaboration") would
// over-match. Switch to exact zone ids if that ever happens.
export function isScreenTargeted(
  a: { target_all?: boolean | null; target_zones?: string[] | null },
  screen: { name?: string | null; zone?: string | null; location?: string | null }
): boolean {
  if (a.target_all) return true
  const fields = [screen.name, screen.zone, screen.location]
    .map((f) => (f || '').trim().toLowerCase())
    .filter(Boolean)
  return (a.target_zones || []).some((z) => {
    const target = String(z || '').trim().toLowerCase()
    return !!target && fields.some((f) => f.includes(target) || target.includes(f))
  })
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
