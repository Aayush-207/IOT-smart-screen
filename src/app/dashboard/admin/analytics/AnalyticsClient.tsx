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
  isEmbedded = false,
}: {
  announcements: any[]
  screens: any[]
  departments: any[]
  deliveries: any[]
  auditRows: any[]
  isEmbedded?: boolean
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
    const counts: Record<Priority, number> = {
      routine: 0,
      timesensitive: 0,
      critical: 0,
      emergency: 0,
    }
    announcements.forEach((a) => {
      const p = (a.priority || 'routine') as Priority
      if (counts[p] !== undefined) counts[p]++
    })
    return { counts }
  }, [announcements])

  // Status breakdown
  const statusStats = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0, draft: 0, withdrawn: 0 }
    announcements.forEach((a) => {
      const st = a.status as keyof typeof counts
      if (counts[st] !== undefined) counts[st]++
    })
    return counts
  }, [announcements])

  // Delivery confirmation metrics
  const deliveryStats = useMemo(() => {
    const states = { displaying: 0, pending: 0, delivered: 0, failed: 0 }
    deliveries.forEach((d) => {
      const s = d.status as keyof typeof states
      if (states[s] !== undefined) states[s]++
    })
    const total = deliveries.length
    const rate = total > 0 ? Math.round(((states.displaying + states.delivered) / total) * 100) : 100
    return { states, total, rate }
  }, [deliveries])

  // Department publication volume
  const departmentStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; approved: number }> = {}
    departments.forEach((d) => {
      map[d.id] = { name: d.name, total: 0, approved: 0 }
    })
    announcements.forEach((a) => {
      if (a.department_id && map[a.department_id]) {
        map[a.department_id].total++
        if (a.status === 'approved') map[a.department_id].approved++
      }
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [departments, announcements])

  // Estimated daily foot traffic reached across online screens
  const estimatedDailyReach = useMemo(() => {
    let total = 0
    screens.forEach((s) => {
      const status = deviceStatus(s.last_seen_at)
      if (status !== 'offline') {
        const zoneKey = (s.zone || s.location || '').toLowerCase()
        let match = 2000
        for (const [k, v] of Object.entries(ZONE_REACH_WEIGHT)) {
          if (zoneKey.includes(k)) {
            match = v
            break
          }
        }
        total += match
      }
    })
    return total
  }, [screens])

  // Top audit actions
  const auditActionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    auditRows.forEach((r) => {
      counts[r.action] = (counts[r.action] || 0) + 1
    })
    return Object.entries(counts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [auditRows])

  return (
    <div className={`space-y-6 max-w-6xl text-neutral-900 dark:text-white ${isEmbedded ? '' : 'pb-16'}`}>
      {/* Header */}
      {isEmbedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-[#212327]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
                Campus Telemetry
              </span>
              <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">Live Network Analytics</span>
            </div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Analytics &amp; Hardware Telemetry
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-[#141414] p-1 rounded-full border border-neutral-200 dark:border-[#212327] text-xs font-mono shadow-xs">
              {(['all', '30d', '7d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-full uppercase transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-xs'
                      : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
                Mesh Telemetry
              </span>
              <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">5s Heartbeat Cycle</span>
            </div>
            <h1 className="xai-display-section text-neutral-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-neutral-900 dark:text-white" /> Screen Analytics &amp; Telemetry
            </h1>
            <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
              Real-time display node availability, estimated daily campus reach, publication approval rates, and delivery verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-[#141414] p-1 rounded-full border border-neutral-200 dark:border-[#212327] text-xs font-mono">
              {(['all', '30d', '7d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-full uppercase transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium'
                      : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Screen Uptime */}
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Node Availability</span>
            <div className="p-1.5 rounded-full bg-white/5 border border-neutral-200 dark:border-[#212327] text-emerald-400">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-normal text-neutral-900 dark:text-white">{screenStats.uptime}%</span>
            <span className="text-xs font-mono text-emerald-400">
              {screenStats.counts.online}/{screenStats.total} Online
            </span>
          </div>
          <div className="mt-3 w-full bg-neutral-50 dark:bg-[#0a0a0a] h-1.5 rounded-full overflow-hidden flex border border-neutral-200 dark:border-[#212327]">
            <div
              className="bg-emerald-400 h-full transition-all"
              style={{ width: `${(screenStats.counts.online / (screenStats.total || 1)) * 100}%` }}
            />
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `${(screenStats.counts.stale / (screenStats.total || 1)) * 100}%` }}
            />
            <div
              className="bg-neutral-600 h-full transition-all"
              style={{ width: `${(screenStats.counts.offline / (screenStats.total || 1)) * 100}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {screenStats.counts.online} Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {screenStats.counts.stale} Stale
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> {screenStats.counts.offline} Offline
            </span>
          </div>
        </div>

        {/* Estimated Daily Reach */}
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Estimated Reach</span>
            <div className="p-1.5 rounded-full bg-white/5 border border-neutral-200 dark:border-[#212327] text-neutral-900 dark:text-white">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-normal text-neutral-900 dark:text-white">
              {estimatedDailyReach.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">views/day</span>
          </div>
          <p className="mt-3 text-xs text-neutral-500 dark:text-[#7d8187] flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            <span>Across {screens.length} active zones</span>
          </p>
        </div>

        {/* Delivery Verification Rate */}
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Delivery Sync</span>
            <div className="p-1.5 rounded-full bg-white/5 border border-neutral-200 dark:border-[#212327] text-neutral-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-normal text-neutral-900 dark:text-white">{deliveryStats.rate}%</span>
            <span className="text-xs font-mono text-neutral-900 dark:text-white">Verified</span>
          </div>
          <p className="mt-3 text-xs text-neutral-500 dark:text-[#7d8187] flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-neutral-500 dark:text-[#7d8187]" />
            <span>{deliveryStats.states.displaying} currently displaying</span>
          </p>
        </div>

        {/* Total Publications */}
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Total Notices</span>
            <div className="p-1.5 rounded-full bg-white/5 border border-neutral-200 dark:border-[#212327] text-neutral-900 dark:text-white">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-normal text-neutral-900 dark:text-white">{announcements.length}</span>
            <span className="text-xs font-mono text-emerald-400">
              {statusStats.approved} Live
            </span>
          </div>
          <p className="mt-3 text-xs text-neutral-500 dark:text-[#7d8187] flex items-center gap-1 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>{statusStats.pending} pending HOD</span>
          </p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Tier Distribution */}
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Priority Mix</span>
              <h3 className="text-sm font-normal text-neutral-900 dark:text-white mt-0.5">Announcement Priority Breakdown</h3>
            </div>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">{announcements.length} Submissions</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Critical */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Critical ({priorityStats.counts.critical})
                </span>
                <span className="text-neutral-500 dark:text-[#7d8187]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.critical / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-neutral-50 dark:bg-[#0a0a0a] h-1.5 rounded-full overflow-hidden border border-neutral-200 dark:border-[#212327]">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
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
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Time-Sensitive ({priorityStats.counts.timesensitive})
                </span>
                <span className="text-neutral-500 dark:text-[#7d8187]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.timesensitive / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-neutral-50 dark:bg-[#0a0a0a] h-1.5 rounded-full overflow-hidden border border-neutral-200 dark:border-[#212327]">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
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
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Routine ({priorityStats.counts.routine})
                </span>
                <span className="text-neutral-500 dark:text-[#7d8187]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.routine / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-neutral-50 dark:bg-[#0a0a0a] h-1.5 rounded-full overflow-hidden border border-neutral-200 dark:border-[#212327]">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
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

          <p className="text-xs text-neutral-500 dark:text-[#7d8187] leading-relaxed pt-2 border-t border-neutral-200 dark:border-[#212327] font-mono">
            Emergency broadcasts preempt all rotation timers. Routine notices cycle in deterministic 10-second intervals.
          </p>
        </div>

        {/* Operational Activity */}
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Operations</span>
              <h3 className="text-sm font-normal text-neutral-900 dark:text-white mt-0.5">Recent System Invocations</h3>
            </div>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">{auditRows.length} Logged Events</span>
          </div>

          <div className="space-y-2 pt-2">
            {auditActionCounts.map(({ action, count }) => (
              <div
                key={action}
                className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-xs font-mono"
              >
                <span className="text-neutral-900 dark:text-white capitalize">
                  {action.replace(/_/g, ' ')}
                </span>
                <span className="text-neutral-900 dark:text-white bg-white/5 px-2 py-0.5 rounded-full border border-white/20">
                  {count} calls
                </span>
              </div>
            ))}
            {auditActionCounts.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-500 dark:text-[#7d8187] font-mono">No activity recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Department Activity Leaderboard */}
      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-[#212327] flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5 inline-flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3" /> Campus Units
            </span>
            <h3 className="text-sm font-normal text-neutral-900 dark:text-white">Department Submissions</h3>
          </div>
          <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">Ranked by throughput</span>
        </div>

        <table className="xai-table text-left text-xs">
          <thead>
            <tr>
              <th>Department</th>
              <th className="text-center">Total Submissions</th>
              <th className="text-center">Authorized &amp; Live</th>
              <th className="text-right">Pass Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-[#212327]">
            {departmentStats.map((d) => {
              const rate = d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0
              return (
                <tr key={d.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-normal text-neutral-900 dark:text-white">
                    {d.name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-neutral-600 dark:text-[#dadbdf]">
                    {d.total}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                    {d.approved}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-neutral-900 dark:text-white">
                    {rate}%
                  </td>
                </tr>
              )
            })}
            {departmentStats.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-neutral-500 dark:text-[#7d8187]">
                  No departments recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
