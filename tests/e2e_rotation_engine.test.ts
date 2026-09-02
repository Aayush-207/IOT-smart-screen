import { describe, it, expect } from 'vitest'
import { comparePriority, type Priority } from '../src/lib/priority'

interface Announcement {
  id: string
  title: string
  priority: Priority
  is_emergency: boolean
  target_all: boolean
  target_zones: string[]
  display_start: string | null
  display_end: string | null
  created_at: string
}

function inWindow(a: { display_start: string | null; display_end: string | null }, now = new Date()): boolean {
  if (a.display_start && new Date(a.display_start) > now) return false
  if (a.display_end && new Date(a.display_end) < now) return false
  return true
}

function resolvePlaylist(
  screen: { id: string; zone: string | null },
  candidates: Announcement[],
  emergencies: Announcement[],
  now = new Date()
) {
  // 1. Emergency override
  const activeEmergency = emergencies.find((e) => inWindow(e, now))
  if (activeEmergency) {
    return {
      chosen: activeEmergency,
      playlist: [activeEmergency],
      isEmergency: true,
    }
  }

  // 2. Filter eligible announcements
  const eligible = candidates.filter((c) => {
    if (!inWindow(c, now)) return false
    if (c.target_all) return true
    return !!screen.zone && Array.isArray(c.target_zones) && c.target_zones.includes(screen.zone)
  })

  eligible.sort((a, b) => {
    const byPriority = comparePriority(a.priority, b.priority)
    if (byPriority !== 0) return byPriority
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })

  return {
    chosen: eligible[0] ?? null,
    playlist: eligible.slice(0, 10),
    isEmergency: false,
  }
}

describe('E2E Playlist & Rotation Engine', () => {
  const mockScreen = { id: 'screen-101', zone: 'Library' }

  it('orders playlist strictly by priority: Critical > TimeSensitive > Routine', () => {
    const announcements: Announcement[] = [
      {
        id: '1',
        title: 'Routine Notice',
        priority: 'routine',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T10:00:00Z',
      },
      {
        id: '2',
        title: 'Critical Campus Announcement',
        priority: 'critical',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T09:00:00Z',
      },
      {
        id: '3',
        title: 'Time-Sensitive Midterm Schedule',
        priority: 'timesensitive',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T08:00:00Z',
      },
    ]

    const result = resolvePlaylist(mockScreen, announcements, [])
    expect(result.chosen?.id).toBe('2')
    expect(result.playlist.map((p) => p.id)).toEqual(['2', '3', '1'])
  })

  it('correctly filters out expired or future announcements', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    const announcements: Announcement[] = [
      {
        id: 'past',
        title: 'Past Notice',
        priority: 'critical',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: '2026-06-01T00:00:00Z',
        display_end: '2026-06-10T00:00:00Z', // expired
        created_at: '2026-06-01T00:00:00Z',
      },
      {
        id: 'active',
        title: 'Active Notice',
        priority: 'routine',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: '2026-06-14T00:00:00Z',
        display_end: '2026-06-20T00:00:00Z', // active
        created_at: '2026-06-14T00:00:00Z',
      },
      {
        id: 'future',
        title: 'Future Notice',
        priority: 'critical',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: '2026-06-25T00:00:00Z', // future
        display_end: '2026-06-30T00:00:00Z',
        created_at: '2026-06-01T00:00:00Z',
      },
    ]

    const result = resolvePlaylist(mockScreen, announcements, [], now)
    expect(result.playlist.length).toBe(1)
    expect(result.chosen?.id).toBe('active')
  })

  it('respects zone-specific targeting vs target_all', () => {
    const announcements: Announcement[] = [
      {
        id: 'engineering-only',
        title: 'Engineering Complex Only',
        priority: 'critical',
        is_emergency: false,
        target_all: false,
        target_zones: ['Engineering'],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'library-specific',
        title: 'Library Quiet Hours',
        priority: 'routine',
        is_emergency: false,
        target_all: false,
        target_zones: ['Library'],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    const libraryResult = resolvePlaylist({ id: 's1', zone: 'Library' }, announcements, [])
    expect(libraryResult.playlist.map((p) => p.id)).toEqual(['library-specific'])

    const engineeringResult = resolvePlaylist({ id: 's2', zone: 'Engineering' }, announcements, [])
    expect(engineeringResult.playlist.map((p) => p.id)).toEqual(['engineering-only'])
  })

  it('emergency alerts instantly preempt and monopolize the playlist', () => {
    const standardNotices: Announcement[] = [
      {
        id: 'n1',
        title: 'Critical Campus Notice',
        priority: 'critical',
        is_emergency: false,
        target_all: true,
        target_zones: [],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    const emergencies: Announcement[] = [
      {
        id: 'em-911',
        title: 'Campus Weather Warning',
        priority: 'emergency',
        is_emergency: true,
        target_all: true,
        target_zones: [],
        display_start: null,
        display_end: null,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    const result = resolvePlaylist(mockScreen, standardNotices, emergencies)
    expect(result.isEmergency).toBe(true)
    expect(result.chosen?.id).toBe('em-911')
    expect(result.playlist.length).toBe(1)
    expect(result.playlist[0].id).toBe('em-911')
  })
})
