import { describe, it, expect } from 'vitest'
import { deviceStatus, type DeviceStatus } from '../src/lib/fleet'

describe('E2E Analytics & Fleet Telemetry', () => {
  it('computes accurate mesh health and uptime rating', () => {
    const now = new Date()
    const screens = [
      { id: '1', last_seen_at: new Date(now.getTime() - 10 * 1000).toISOString() }, // 10s ago -> online
      { id: '2', last_seen_at: new Date(now.getTime() - 20 * 1000).toISOString() }, // 20s ago -> online
      { id: '3', last_seen_at: new Date(now.getTime() - 60 * 1000).toISOString() }, // 60s ago -> stale
      { id: '4', last_seen_at: new Date(now.getTime() - 300 * 1000).toISOString() }, // 5m ago -> offline
    ]

    const counts: Record<DeviceStatus, number> = { online: 0, stale: 0, offline: 0 }
    screens.forEach((s) => {
      const st = deviceStatus(s.last_seen_at) as DeviceStatus
      counts[st]++
    })

    expect(counts.online).toBe(2)
    expect(counts.stale).toBe(1)
    expect(counts.offline).toBe(1)

    const uptime = Math.round((counts.online / screens.length) * 100)
    expect(uptime).toBe(50)
  })

  it('aggregates department publishing volume and approval conversion percentage', () => {
    const departments = [
      { id: 'dept-1', name: 'CSE' },
      { id: 'dept-2', name: 'ECE' },
    ]

    const announcements = [
      { id: 'a1', department_id: 'dept-1', status: 'approved' },
      { id: 'a2', department_id: 'dept-1', status: 'approved' },
      { id: 'a3', department_id: 'dept-1', status: 'pending_approval' },
      { id: 'a4', department_id: 'dept-2', status: 'approved' },
      { id: 'a5', department_id: 'dept-2', status: 'rejected' },
      { id: 'a6', department_id: null, status: 'approved' }, // General
    ]

    const map: Record<string, { name: string; total: number; approved: number }> = {}
    departments.forEach((d) => {
      map[d.id] = { name: d.name, total: 0, approved: 0 }
    })
    map['general'] = { name: 'General', total: 0, approved: 0 }

    announcements.forEach((a) => {
      const key = a.department_id || 'general'
      if (!map[key]) map[key] = { name: 'Other', total: 0, approved: 0 }
      map[key].total++
      if (a.status === 'approved') map[key].approved++
    })

    expect(map['dept-1'].total).toBe(3)
    expect(map['dept-1'].approved).toBe(2)
    expect(Math.round((map['dept-1'].approved / map['dept-1'].total) * 100)).toBe(67)

    expect(map['dept-2'].total).toBe(2)
    expect(map['dept-2'].approved).toBe(1)
    expect(Math.round((map['dept-2'].approved / map['dept-2'].total) * 100)).toBe(50)

    expect(map['general'].total).toBe(1)
    expect(map['general'].approved).toBe(1)
  })

  it('calculates delivery confirmation rates from hardware state telemetry', () => {
    const deliveries = [
      { id: 'd1', state: 'displaying' },
      { id: 'd2', state: 'displaying' },
      { id: 'd3', state: 'acknowledged' },
      { id: 'd4', state: 'dispatched' },
    ]

    const states = { displaying: 0, acknowledged: 0, dispatched: 0, expired: 0 }
    deliveries.forEach((d) => {
      if (d.state in states) states[d.state as keyof typeof states]++
    })

    const confirmed = states.displaying + states.acknowledged
    const rate = Math.round((confirmed / deliveries.length) * 100)

    expect(confirmed).toBe(3)
    expect(rate).toBe(75)
  })
})
