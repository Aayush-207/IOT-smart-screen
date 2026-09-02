'use client'

import React, { useMemo, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Users,
  Radio,
  Layers,
  Building2,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Download,
} from 'lucide-react'
import { deviceStatus, type DeviceStatus } from '@/lib/fleet'
import { type Priority } from '@/lib/priority'

// Estimated daily foot traffic / student reach index per zone
const ZONE_REACH_WEIGHT: Record<string, number> = {
  library: 2400,
  engineering: 1800,
  auditorium: 3500,
  cafeteria: 4200,
  canteen: 4200,
  hostel: 1500,
  quad: 3100,
  main: 4500,
  entrance: 5000,
}

export function AnalyticsClient({
  announcements,
  screens,
  departments,
  deliveries,
  auditRows,
}: {
  announcements: any[]
  screens: any[]
  departments: any[]
  deliveries: any[]
  auditRows: any[]
}) {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d'>('all')

  // Screen health computation
  const screenStats = useMemo(() => {
    const counts: Record<DeviceStatus, number> = { online: 0, stale: 0, offline: 0 }
    screens.forEach((s) => {
      const status = deviceStatus(s.last_seen_at) as DeviceStatus
      counts[status]++
    })
    const total = screens.length
    const uptime = total > 0 ? Math.round((counts.online / total) * 100) : 0
    return { counts, total, uptime }
  }, [screens])

  // Announcement priority breakdown
  const priorityStats = useMemo(() => {
    const counts: Record<Priority, number> = { emergency: 0, critical: 0, timesensitive: 0, routine: 0 }
    announcements.forEach((a) => {
      if (a.priority && a.priority in counts) {
        counts[a.priority as Priority]++
      }
    })
    const total = announcements.length
    return { counts, total }
  }, [announcements])

  // Status breakdown
  const statusStats = useMemo(() => {
    const counts = { approved: 0, pending: 0, draft: 0, rejected: 0, expired: 0 }
    announcements.forEach((a) => {
      if (a.status === 'approved') counts.approved++
      else if (a.status === 'pending_approval') counts.pending++
      else if (a.status === 'draft') counts.draft++
      else if (a.status === 'rejected') counts.rejected++
      else if (a.status === 'expired') counts.expired++
    })
    return counts
  }, [announcements])

  // Estimated daily impression reach
  const estimatedDailyReach = useMemo(() => {
    let reach = 0
    screens.forEach((s) => {
      const status = deviceStatus(s.last_seen_at)
      if (status !== 'offline') {
        const zoneKey = (s.zone || s.location || 'main').toLowerCase()
        const matched = Object.keys(ZONE_REACH_WEIGHT).find((k) => zoneKey.includes(k))
        reach += matched ? ZONE_REACH_WEIGHT[matched] : 1200
      }
    })
    return reach
  }, [screens])

  // Delivery state machine stats
  const deliveryStats = useMemo(() => {
    const states = { displaying: 0, acknowledged: 0, dispatched: 0, expired: 0 }
    deliveries.forEach((d) => {
      if (d.state in states) states[d.state as keyof typeof states]++
    })
    const confirmed = states.displaying + states.acknowledged
    const total = deliveries.length
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0
    return { states, total, rate }
  }, [deliveries])

  // Department activity breakdown
  const departmentStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; approved: number }> = {}
    departments.forEach((d) => {
      map[d.id] = { name: d.name, total: 0, approved: 0 }
    })
    map['general'] = { name: 'General / Campus-Wide', total: 0, approved: 0 }

    announcements.forEach((a) => {
      const key = a.department_id || 'general'
      if (!map[key]) map[key] = { name: 'Other', total: 0, approved: 0 }
      map[key].total++
      if (a.status === 'approved') map[key].approved++
    })

    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [departments, announcements])

  // Top audit actions
  const auditActionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    auditRows.forEach((r) => {
      counts[r.action] = (counts[r.action] || 0) + 1
    })
    return Object.entries(counts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [auditRows])

  const exportSummary = () => {
    const csv = [
      ['Metric', 'Value'],
      ['Total Displays', screenStats.total],
      ['Online Displays', screenStats.counts.online],
      ['Stale Displays', screenStats.counts.stale],
      ['Offline Displays', screenStats.counts.offline],
      ['Fleet Uptime Rate', `${screenStats.uptime}%`],
      ['Estimated Daily Audience Reach', estimatedDailyReach],
      ['Total Announcements', announcements.length],
      ['Approved Announcements', statusStats.approved],
      ['Pending Approvals', statusStats.pending],
      ['Critical Announcements', priorityStats.counts.critical],
      ['Time-Sensitive Announcements', priorityStats.counts.timesensitive],
      ['Routine Announcements', priorityStats.counts.routine],
      ['Delivery Verification Rate', `${deliveryStats.rate}%`],
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campuscast-telemetry-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Intelligence Center
            </span>
            <span className="text-xs font-mono text-[var(--mute)]">Telemetry Node Online</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Campus Broadcast &amp; Fleet Intelligence
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-2xl mt-1.5 leading-relaxed">
            Real-time analytics covering broadcast reach, department publication velocity, delivery verification rates, and physical screen node uptime.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center p-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas-stone)]/40 text-xs">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              7 Days
            </button>
          </div>

          <button
            type="button"
            onClick={exportSummary}
            className="cohere-btn-pill-outline text-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--link)]" /> Export Telemetry CSV
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fleet Health Card */}
        <div className="p-5 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="cohere-mono-label text-[var(--mute)]">Mesh Health</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--ink)]">{screenStats.uptime}%</span>
            <span className="text-xs font-mono text-emerald-600 font-semibold">
              {screenStats.counts.online}/{screenStats.total} Online
            </span>
          </div>
          <div className="mt-3 w-full bg-[var(--canvas-inset)] h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(screenStats.counts.online / (screenStats.total || 1)) * 100}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${(screenStats.counts.stale / (screenStats.total || 1)) * 100}%` }}
            />
            <div
              className="bg-neutral-400 h-full transition-all"
              style={{ width: `${(screenStats.counts.offline / (screenStats.total || 1)) * 100}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[var(--mute)]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {screenStats.counts.online} Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {screenStats.counts.stale} Stale
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> {screenStats.counts.offline} Offline
            </span>
          </div>
        </div>

        {/* Estimated Daily Reach */}
        <div className="p-5 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="cohere-mono-label text-[var(--mute)]">Estimated Reach</span>
            <div className="p-2 rounded-xl bg-[var(--link)]/10 text-[var(--link)]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--ink)]">
              {estimatedDailyReach.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[var(--slate)]">views/day</span>
          </div>
          <p className="mt-3 text-xs text-[var(--slate)] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Aggregated across {screens.length} active campus zones</span>
          </p>
        </div>

        {/* Delivery Verification Rate */}
        <div className="p-5 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="cohere-mono-label text-[var(--mute)]">Delivery Rate</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--ink)]">{deliveryStats.rate}%</span>
            <span className="text-xs font-mono text-cyan-600 font-semibold">Verified</span>
          </div>
          <p className="mt-3 text-xs text-[var(--slate)] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--mute)]" />
            <span>{deliveryStats.states.displaying} currently displaying on nodes</span>
          </p>
        </div>

        {/* Total Publications */}
        <div className="p-5 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="cohere-mono-label text-[var(--mute)]">Total Notices</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--ink)]">{announcements.length}</span>
            <span className="text-xs font-mono text-emerald-600 font-semibold">
              {statusStats.approved} Live
            </span>
          </div>
          <p className="mt-3 text-xs text-[var(--slate)] flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
            <span>{statusStats.pending} pending governance approval</span>
          </p>
        </div>
      </div>

      {/* Two Column Section: Priority Distribution & Audit Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tier Distribution */}
        <div className="p-6 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="cohere-mono-label text-[var(--mute)]">Priority Mix</span>
              <h3 className="text-base font-bold text-[var(--ink)] mt-0.5">Broadcast Priority Distribution</h3>
            </div>
            <span className="text-xs font-mono text-[var(--mute)]">{announcements.length} Submissions</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Critical */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" /> Critical ({priorityStats.counts.critical})
                </span>
                <span className="font-mono text-[var(--mute)]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.critical / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-[var(--canvas-inset)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      announcements.length > 0
                        ? (priorityStats.counts.critical / announcements.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Time-sensitive */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Time-Sensitive ({priorityStats.counts.timesensitive})
                </span>
                <span className="font-mono text-[var(--mute)]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.timesensitive / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-[var(--canvas-inset)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      announcements.length > 0
                        ? (priorityStats.counts.timesensitive / announcements.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Routine */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[var(--link)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--link)]" /> Routine ({priorityStats.counts.routine})
                </span>
                <span className="font-mono text-[var(--mute)]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.routine / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-[var(--canvas-inset)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--link)] h-full rounded-full transition-all"
                  style={{
                    width: `${
                      announcements.length > 0
                        ? (priorityStats.counts.routine / announcements.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--slate)] leading-relaxed pt-2 border-t border-[var(--hairline)]">
            Emergency and critical broadcasts preempt all rotation timers across matching zones. Routine content rotates in 10-second intervals.
          </p>
        </div>

        {/* Audit Velocity / Operational Activity */}
        <div className="p-6 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="cohere-mono-label text-[var(--mute)]">Operations</span>
              <h3 className="text-base font-bold text-[var(--ink)] mt-0.5">Administrative Mutation Stream</h3>
            </div>
            <span className="text-xs font-mono text-[var(--mute)]">{auditRows.length} Logged Events</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {auditActionCounts.map(({ action, count }) => (
              <div
                key={action}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-stone)]/30 text-xs"
              >
                <span className="font-mono font-medium text-[var(--ink)] capitalize">
                  {action.replace(/_/g, ' ')}
                </span>
                <span className="font-mono font-bold text-[var(--link)] bg-[var(--link)]/10 px-2 py-0.5 rounded-md">
                  {count} calls
                </span>
              </div>
            ))}
            {auditActionCounts.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--mute)]">No audit activity recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Department Activity Leaderboard */}
      <div className="p-6 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="cohere-chip-green flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3" /> Academic &amp; Administrative Units
            </span>
            <h3 className="text-base font-bold text-[var(--ink)]">Department Publishing Leaderboard</h3>
          </div>
          <span className="text-xs font-mono text-[var(--mute)]">Sorted by submission volume</span>
        </div>

        <div className="overflow-x-auto border border-[var(--hairline)] rounded-xl">
          <table className="research-table text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--canvas-stone)]/40 text-[var(--mute)] font-mono text-[10px] uppercase">
                <th className="py-3 px-4 font-semibold">Department Unit</th>
                <th className="py-3 px-4 font-semibold text-center">Total Submissions</th>
                <th className="py-3 px-4 font-semibold text-center">Approved &amp; Live</th>
                <th className="py-3 px-4 font-semibold text-right">Approval Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {departmentStats.map((d) => {
                const rate = d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0
                return (
                  <tr key={d.name} className="hover:bg-[var(--canvas-stone)]/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">
                      {d.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[var(--ink)]">
                      {d.total}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-600 font-semibold">
                      {d.approved}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--ink)]">
                      {rate}%
                    </td>
                  </tr>
                )
              })}
              {departmentStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[var(--mute)]">
                    No departments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
