'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus } from '@/lib/fleet'
import { priorityLabel } from '@/lib/priority'
import {
  Search,
  Ban,
  Loader2,
  Eye,
  X,
  Image as ImageIcon,
  Clock,
  MapPin,
  Monitor,
  User,
  AlertTriangle,
  Calendar,
} from 'lucide-react'

export function WithdrawClient({ initialRows, actorId, hideHeader = false }: { initialRows: any[]; actorId: string; hideHeader?: boolean }) {
  const [rows, setRows] = useState(initialRows)
  const [busy, setBusy] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'scheduled' | 'withdrawn' | 'expired'>('all')
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const withdraw = async (row: any) => {
    if (!confirm(`Are you sure you want to withdraw "${row.title}" from every screen immediately?`)) return
    setBusy(row.id)
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (error) throw error
      await logAudit(supabase, {
        actorId,
        action: 'withdrew_announcement',
        targetType: 'announcement',
        targetId: row.id,
        targetLabel: row.title,
      })
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'withdrawn' } : r)))
    } catch (e) {
      console.error(e)
      alert('Failed to withdraw announcement.')
    } finally {
      setBusy(null)
    }
  }

  // Count per status category for filter tabs
  const statusCounts = useMemo(() => {
    const c = { all: rows.length, live: 0, scheduled: 0, expired: 0, withdrawn: 0 }
    rows.forEach((r) => {
      const disp = r.status === 'approved' ? announcementDisplayStatus(r) : r.status
      if (disp in c) {
        c[disp as keyof typeof c]++
      }
    })
    return c
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const disp = r.status === 'approved' ? announcementDisplayStatus(r) : r.status
      if (statusFilter !== 'all' && disp !== statusFilter) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      const zones = Array.isArray(r.target_zones) ? r.target_zones.join(' ') : ''
      const haystack = `${r.title} ${r.departments?.name || ''} ${r.body || ''} ${r.profiles?.email || ''} ${zones}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, statusFilter, query])

  const formatScheduleDuration = (start?: string | null, end?: string | null) => {
    if (!start && !end) return { label: 'Continuous', dates: 'No expiration date' }
    if (start && !end) {
      const s = new Date(start)
      const sDay = String(s.getDate()).padStart(2, '0')
      const sMonth = String(s.getMonth() + 1).padStart(2, '0')
      const sYear = s.getFullYear()
      return {
        label: 'Permanent',
        dates: `From ${sDay}/${sMonth}/${sYear}`,
      }
    }
    if (start && end) {
      const s = new Date(start)
      const e = new Date(end)
      const diffMs = e.getTime() - s.getTime()
      if (isNaN(diffMs)) return { label: 'Custom', dates: '' }
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      const label = diffDays >= 1 ? `${diffDays} ${diffDays === 1 ? 'day' : 'days'}` : `${Math.max(1, diffHours)} hrs`
      const sDay = String(s.getDate()).padStart(2, '0')
      const sMonth = String(s.getMonth() + 1).padStart(2, '0')
      const eDay = String(e.getDate()).padStart(2, '0')
      const eMonth = String(e.getMonth() + 1).padStart(2, '0')
      return {
        label,
        dates: `${sDay}/${sMonth} → ${eDay}/${eMonth}`,
      }
    }
    return { label: 'Indefinite', dates: '' }
  }

  return (
    <div className={`text-slate-900 animate-fade-in-up ${hideHeader ? '' : 'space-y-8 max-w-7xl pb-16'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 ">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-slate-200  text-slate-900  bg-slate-100 ">
                Broadcast Directory
              </span>
              <span className="text-xs font-mono text-slate-500 ">{rows.length} Total Notices</span>
            </div>
            <h1 className="xai-display-section text-slate-900 ">
              Broadcast Catalog &amp; Content Registry
            </h1>
            <p className="text-sm text-slate-600  max-w-2xl mt-1.5 leading-relaxed">
              Manage scheduled, live, and historical notices across campus screens. Review targeting, inspect visual media, and trigger instantaneous takedowns.
            </p>
          </div>

          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 " />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, department, or zone..."
              className="w-full bg-white  border border-slate-200  rounded-full pl-9 pr-4 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono shadow-sm"
            />
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 " />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, department, or zone..."
              className="w-full bg-white  border border-slate-200  rounded-full pl-9 pr-4 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Filter Tabs with Counters */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white  p-1.5 rounded-full border border-slate-200  w-fit shadow-sm">
        {(['all', 'live', 'scheduled', 'expired', 'withdrawn'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1 rounded-full text-xs font-mono capitalize transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              statusFilter === st
                ? 'bg-[#121826] text-white   font-medium shadow-xs'
                : 'text-slate-500  hover:text-slate-900 '
            }`}
          >
            <span>{st}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === st
                  ? 'bg-slate-700 text-white  '
                  : 'bg-slate-100  text-slate-600 '
              }`}
            >
              {statusCounts[st]}
            </span>
          </button>
        ))}
      </div>

      {/* Structured, Spacious & Uncluttered Table */}
      <div className="bg-white  border border-slate-200  rounded-2xl overflow-hidden shadow-sm card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200  bg-slate-50/80  text-[11px] font-mono uppercase tracking-wider text-slate-500 ">
                <th className="px-6 py-4 font-medium w-[30%]">Notice &amp; Visual Poster</th>
                <th className="px-6 py-4 font-medium w-[22%]">Target Screens / Zones</th>
                <th className="px-6 py-4 font-medium w-[16%]">Status &amp; Priority</th>
                <th className="px-6 py-4 font-medium w-[18%]">Schedule &amp; Duration</th>
                <th className="px-6 py-4 font-medium w-[14%] text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 ">
              {filtered.map((r) => {
                const disp = r.status === 'approved' ? announcementDisplayStatus(r) : r.status
                const isWithdrawn = r.status === 'withdrawn'
                const schedule = formatScheduleDuration(r.display_start, r.display_end)
                const zones = Array.isArray(r.target_zones) ? r.target_zones : []

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60  transition-colors">
                    {/* Notice & Visual Poster */}
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        {r.attachment_url ? (
                          <div
                            onClick={() => setPreviewPoster({ url: r.attachment_url, title: r.title })}
                            className="relative group shrink-0 rounded-xl overflow-hidden border border-slate-200  shadow-sm cursor-pointer hover:ring-2 hover:ring-[#00eaff] transition-all bg-black"
                            title="Click to preview poster"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.attachment_url}
                              alt={r.title}
                              className="w-20 h-12 sm:w-24 sm:h-14 object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-12 sm:w-24 sm:h-14 shrink-0 rounded-xl border border-slate-200  bg-slate-100  flex flex-col items-center justify-center text-slate-400  p-1 text-center">
                            <ImageIcon className="w-4 h-4 mb-0.5 opacity-50" />
                            <span className="text-[9px] font-mono">Text Notice</span>
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-slate-900  truncate" title={r.title}>
                              {r.title}
                            </h3>
                            {r.is_emergency && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#ef2045]  bg-[#ef2045]/10 border border-[#ef2045]/20 px-2 py-0.2 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> Emergency
                              </span>
                            )}
                          </div>

                          {r.body && (
                            <p className="text-xs text-slate-600  line-clamp-1 leading-relaxed">
                              {r.body}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 ">
                            <span className="truncate">{r.departments?.name || 'Campus Wide'}</span>
                            {r.profiles?.email && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate max-w-[140px]" title={r.profiles.email}>
                                  {r.profiles.email}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target Screens & Zones */}
                    <td className="px-6 py-5 text-xs">
                      {r.target_all ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100  border border-slate-200  font-mono text-slate-700 ">
                          <Monitor className="w-3.5 h-3.5 text-[#00eaff]" />
                          <span>All Displays in Network</span>
                        </div>
                      ) : zones.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {zones.map((z: string, zIdx: number) => (
                              <span
                                key={zIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100  border border-slate-200  text-[10px] font-mono text-slate-700 "
                              >
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                {z}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400  font-mono text-xs italic">
                          Default Rotation
                        </span>
                      )}
                    </td>

                    {/* Status & Priority */}
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div>
                          <StatusBadge status={disp} />
                        </div>
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full border border-slate-200  text-slate-600  bg-slate-100  text-[10px] uppercase font-mono">
                            {priorityLabel(r.priority)} Priority
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Schedule & Duration */}
                    <td className="px-6 py-5 text-xs font-mono" suppressHydrationWarning>
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00eaff]  bg-[#00eaff]/10 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> {schedule.label}
                        </span>
                        <div className="text-[11px] text-slate-500 " suppressHydrationWarning>
                          {schedule.dates}
                        </div>
                      </div>
                    </td>

                    {/* Action / Moderation */}
                    <td className="px-6 py-5 text-right">
                      {isWithdrawn ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] text-slate-500  font-mono bg-slate-100  border border-slate-200 ">
                          Withdrawn
                        </span>
                      ) : (
                        <button
                          onClick={() => withdraw(r)}
                          disabled={busy === r.id}
                          className="px-3.5 py-1.5 rounded-full border border-[#ef2045]/30 text-[#ef2045]  hover:bg-[#ffeaea]  text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                        >
                          {busy === r.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Taking down…</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Take Down</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-xs text-slate-500  font-mono">
                    No announcements match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Poster Preview Modal */}
      {previewPoster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPoster(null)}
        >
          <div
            className="bg-white  rounded-2xl border border-slate-200  overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200  flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#00eaff]" />
                <h3 className="font-semibold text-sm text-slate-900  truncate">
                  {previewPoster.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPoster(null)}
                className="p-1 rounded-full hover:bg-slate-100  text-slate-500 hover:text-slate-900  transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPoster.url}
                alt={previewPoster.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
