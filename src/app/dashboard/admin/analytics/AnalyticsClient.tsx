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
    <div className="space-y-8 max-w-6xl pb-16 text-white">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">Network Telemetry</span>
            <span className="text-xs font-mono text-[#8b8496]">5s Heartbeat Stream</span>
          </div>
          <h1 className="sentry-display-section text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#c2ef4e]" /> Screen Analytics &amp; Telemetry
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Real-time screen fleet health, estimated daily campus reach, publication approval rates, and delivery verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#150f23] p-1 rounded-xl border border-[#362d59] text-xs font-bold">
            {(['all', '30d', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-[#c2ef4e] text-[#150f23]'
                    : 'text-[#8b8496] hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Screen Uptime */}
        <div className="sentry-card p-5 border-[#c2ef4e]/30">
          <div className="flex items-center justify-between">
            <span className="sentry-mono-label text-[#c2ef4e]">Screen Uptime</span>
            <div className="p-2 rounded-xl bg-[#c2ef4e]/10 text-[#c2ef4e]">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{screenStats.uptime}%</span>
            <span className="text-xs font-mono text-[#c2ef4e] font-bold">
              {screenStats.counts.online}/{screenStats.total} Online
            </span>
          </div>
          <div className="mt-3 w-full bg-[#1f1633] h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-[#c2ef4e] h-full transition-all"
              style={{ width: `${(screenStats.counts.online / (screenStats.total || 1)) * 100}%` }}
            />
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `${(screenStats.counts.stale / (screenStats.total || 1)) * 100}%` }}
            />
            <div
              className="bg-[#4c445c] h-full transition-all"
              style={{ width: `${(screenStats.counts.offline / (screenStats.total || 1)) * 100}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#8b8496]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c2ef4e]" /> {screenStats.counts.online} Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {screenStats.counts.stale} Stale
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4c445c]" /> {screenStats.counts.offline} Offline
            </span>
          </div>
        </div>

        {/* Estimated Daily Reach */}
        <div className="sentry-card p-5">
          <div className="flex items-center justify-between">
            <span className="sentry-mono-label text-[#8b8496]">Estimated Reach</span>
            <div className="p-2 rounded-xl bg-[#6a5fc1]/20 text-[#a79df5]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {estimatedDailyReach.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[#8b8496]">views/day</span>
          </div>
          <p className="mt-3 text-xs text-[#8b8496] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#c2ef4e]" />
            <span>Across {screens.length} active campus zones</span>
          </p>
        </div>

        {/* Delivery Verification Rate */}
        <div className="sentry-card p-5">
          <div className="flex items-center justify-between">
            <span className="sentry-mono-label text-[#8b8496]">Delivery Sync</span>
            <div className="p-2 rounded-xl bg-[#c2ef4e]/10 text-[#c2ef4e]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{deliveryStats.rate}%</span>
            <span className="text-xs font-mono text-[#c2ef4e] font-bold">Verified</span>
          </div>
          <p className="mt-3 text-xs text-[#8b8496] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#8b8496]" />
            <span>{deliveryStats.states.displaying} currently displaying</span>
          </p>
        </div>

        {/* Total Publications */}
        <div className="sentry-card p-5">
          <div className="flex items-center justify-between">
            <span className="sentry-mono-label text-[#8b8496]">Total Notices</span>
            <div className="p-2 rounded-xl bg-[#fa7faa]/10 text-[#fa7faa]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{announcements.length}</span>
            <span className="text-xs font-mono text-[#c2ef4e] font-bold">
              {statusStats.approved} Live
            </span>
          </div>
          <p className="mt-3 text-xs text-[#8b8496] flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>{statusStats.pending} pending HOD approval</span>
          </p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tier Distribution */}
        <div className="sentry-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="sentry-mono-label text-[#8b8496]">Priority Mix</span>
              <h3 className="text-base font-bold text-white mt-0.5">Announcement Priority Breakdown</h3>
            </div>
            <span className="text-xs font-mono text-[#8b8496]">{announcements.length} Submissions</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Critical */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#fa5252] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#fa5252]" /> Critical ({priorityStats.counts.critical})
                </span>
                <span className="font-mono text-[#8b8496]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.critical / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-[#1f1633] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#fa5252] h-full rounded-full transition-all"
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
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Time-Sensitive ({priorityStats.counts.timesensitive})
                </span>
                <span className="font-mono text-[#8b8496]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.timesensitive / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-[#1f1633] h-2 rounded-full overflow-hidden">
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
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#c2ef4e] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#c2ef4e]" /> Routine ({priorityStats.counts.routine})
                </span>
                <span className="font-mono text-[#8b8496]">
                  {announcements.length > 0
                    ? Math.round((priorityStats.counts.routine / announcements.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-[#1f1633] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#c2ef4e] h-full rounded-full transition-all"
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

          <p className="text-xs text-[#8b8496] leading-relaxed pt-2 border-t border-[#362d59]">
            Emergency and critical broadcasts preempt all rotation timers. Routine posts rotate in 10-second intervals.
          </p>
        </div>

        {/* Operational Activity */}
        <div className="sentry-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="sentry-mono-label text-[#8b8496]">Operations</span>
              <h3 className="text-base font-bold text-white mt-0.5">Recent Admin Actions</h3>
            </div>
            <span className="text-xs font-mono text-[#8b8496]">{auditRows.length} Logged Events</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {auditActionCounts.map(({ action, count }) => (
              <div
                key={action}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#362d59] bg-[#1f1633] text-xs"
              >
                <span className="font-mono font-bold text-white capitalize">
                  {action.replace(/_/g, ' ')}
                </span>
                <span className="font-mono font-bold text-[#c2ef4e] bg-[#c2ef4e]/10 px-2 py-0.5 rounded-md border border-[#c2ef4e]/30">
                  {count} calls
                </span>
              </div>
            ))}
            {auditActionCounts.length === 0 && (
              <div className="py-8 text-center text-xs text-[#8b8496]">No activity recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Department Activity Leaderboard */}
      <div className="sentry-card overflow-hidden">
        <div className="p-5 border-b border-[#362d59] flex items-center justify-between">
          <div>
            <span className="sentry-chip-green flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3" /> Campus Departments
            </span>
            <h3 className="text-base font-bold text-white">Department Submissions</h3>
          </div>
          <span className="text-xs font-mono text-[#8b8496]">Ranked by volume</span>
        </div>

        <table className="sentry-table text-left text-xs">
          <thead>
            <tr>
              <th>Department</th>
              <th className="text-center">Total Submissions</th>
              <th className="text-center">Approved &amp; Live</th>
              <th className="text-right">Approval Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#362d59]">
            {departmentStats.map((d) => {
              const rate = d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0
              return (
                <tr key={d.name} className="hover:bg-[#1f1633]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {d.name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[#bdb8c0]">
                    {d.total}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[#c2ef4e] font-bold">
                    {d.approved}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {rate}%
                  </td>
                </tr>
              )
            })}
            {departmentStats.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-[#8b8496]">
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
