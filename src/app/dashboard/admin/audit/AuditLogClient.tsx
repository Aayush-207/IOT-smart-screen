'use client'

import React, { useMemo, useState } from 'react'
import { Download, ScrollText, Eye, X, Image as ImageIcon, Clock, Calendar } from 'lucide-react'

export function AuditLogClient({ rows }: { rows: any[] }) {
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [actor, setActor] = useState('all')
  const [action, setAction] = useState('all')
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title: string } | null>(null)

  const actors = useMemo(() => Array.from(new Set(rows.map((r) => r.profiles?.email).filter(Boolean))), [rows])
  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))), [rows])

  const filtered = rows.filter((r) => {
    const date = new Date(r.created_at)
    if (from && date < new Date(from)) return false
    if (to && date > new Date(`${to}T23:59:59`)) return false
    if (actor !== 'all' && r.profiles?.email !== actor) return false
    if (action !== 'all' && r.action !== action) return false
    if (query) {
      const haystack = `${r.action} ${r.profiles?.email || ''} ${r.target_label || ''} ${r.target_type || ''}`.toLowerCase()
      if (!haystack.includes(query.toLowerCase())) return false
    }
    return true
  })

  const exportCsv = () => {
    const header = ['Timestamp', 'Actor', 'Action', 'Target Type', 'Target Label', 'Poster URL', 'Duration']
    const lines = filtered.map((r) => {
      const dur = formatDuration(r.announcement?.display_start, r.announcement?.display_end)
      return [
        new Date(r.created_at).toISOString(),
        r.profiles?.email || 'system',
        r.action,
        r.target_type || '',
        r.target_label || r.target_id || '',
        r.announcement?.attachment_url || '',
        dur ? `${dur.primary} (${dur.secondary})` : '—',
      ]
    })
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campuscast-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getActionBadgeClass = (act: string) => {
    if (act.includes('emergency')) return 'border border-[#ef2045]/40 bg-[#ef2045]/10 text-[#ef2045] '
    if (act.includes('reject') || act.includes('withdrew') || act.includes('delete'))
      return 'border border-[#ef2045]/30 text-[#ef2045]  bg-[#ef2045]/10'
    if (act.includes('approve'))
      return 'border border-[#00eaff]/40 text-[#00eaff]  bg-[#00eaff]/10'
    if (act.includes('refresh') || act.includes('reboot') || act.includes('registered'))
      return 'border border-sky-500/30 text-sky-600  bg-sky-500/10'
    return 'border border-slate-200  bg-slate-100  text-slate-600 '
  }

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start && !end) return null
    if (start && !end) return { primary: 'Permanent', secondary: 'Indefinite display' }
    if (start && end) {
      const s = new Date(start)
      const e = new Date(end)
      const diffMs = e.getTime() - s.getTime()
      if (isNaN(diffMs)) return null
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      const label = diffDays >= 1 ? `${diffDays} ${diffDays === 1 ? 'day' : 'days'}` : `${Math.max(1, diffHours)} hrs`
      const sDay = String(s.getDate()).padStart(2, '0')
      const sMonth = String(s.getMonth() + 1).padStart(2, '0')
      const eDay = String(e.getDate()).padStart(2, '0')
      const eMonth = String(e.getMonth() + 1).padStart(2, '0')
      return {
        primary: label,
        secondary: `${sDay}/${sMonth} → ${eDay}/${eMonth}`,
      }
    }
    return null
  }

  return (
    <div className="space-y-6 max-w-7xl pb-16 text-slate-900  animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 ">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-slate-200  text-slate-900  bg-slate-100 ">
              Append-Only Ledger
            </span>
            <span className="text-xs font-mono text-slate-500 ">{filtered.length} Events Tracked</span>
          </div>
          <h1 className="xai-display-section text-slate-900  flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-slate-900 " /> System Activity &amp; Audit Log
          </h1>
          <p className="text-sm text-slate-600  max-w-xl mt-1.5 leading-relaxed">
            Append-only telemetry of all approvals, emergency overrides, display changes, and poster broadcast records.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="px-5 py-2 rounded-full bg-[#121826] text-white   text-xs font-medium hover:bg-[#121826]/90  transition-colors flex items-center gap-2 self-start md:self-auto shrink-0 cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl border border-slate-200  bg-white  shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="bg-slate-50  border border-slate-200  rounded-lg px-3 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-50  border border-slate-200  rounded-lg px-3 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-slate-50  border border-slate-200  rounded-lg px-3 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono"
          />
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="bg-slate-50  border border-slate-200  rounded-lg px-3 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono"
          >
            <option value="all">All Actors ({actors.length})</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="bg-slate-50  border border-slate-200  rounded-lg px-3 py-2 text-xs text-slate-900  focus:outline-none focus:border-[#121826]  font-mono"
          >
            <option value="all">All Actions ({actions.length})</option>
            {actions.map((act) => (
              <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Well-Structured and Fully-Aligned Audit Log Table */}
      <div className="bg-white  border border-slate-200  rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200  bg-slate-50  text-[11px] font-mono uppercase tracking-wider text-slate-500 ">
                <th className="px-5 py-3.5 font-medium w-[17%]">Timestamp</th>
                <th className="px-5 py-3.5 font-medium w-[18%]">Actor</th>
                <th className="px-5 py-3.5 font-medium w-[14%]">Action</th>
                <th className="px-5 py-3.5 font-medium w-[21%]">Target Resource</th>
                <th className="px-5 py-3.5 font-medium w-[15%] text-center">Poster Visual</th>
                <th className="px-5 py-3.5 font-medium w-[15%]">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 ">
              {filtered.map((r) => {
                const durationInfo = formatDuration(r.announcement?.display_start, r.announcement?.display_end)
                const posterUrl = r.announcement?.attachment_url

                return (
                  <tr key={r.id} className="hover:bg-slate-50  transition-colors">
                    {/* Timestamp */}
                    <td className="px-5 py-3.5 text-xs text-slate-500  font-mono whitespace-nowrap" suppressHydrationWarning>
                      <div suppressHydrationWarning>{new Date(r.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 " suppressHydrationWarning>{new Date(r.created_at).toLocaleTimeString()}</div>
                    </td>

                    {/* Actor */}
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-900  truncate max-w-[180px]">
                      <div className="truncate" title={r.profiles?.email || 'system'}>
                        {r.profiles?.email || <span className="text-slate-500  italic">System Daemon</span>}
                      </div>
                      {r.profiles?.role && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                          Role: {r.profiles.role}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-xs font-mono whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${getActionBadgeClass(r.action)}`}>
                        {r.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Target / Identifier */}
                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-medium text-slate-900  truncate max-w-[200px]" title={r.target_label || r.target_id || ''}>
                        {r.target_label || r.target_id || '—'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500  uppercase tracking-wider">
                          {r.target_type || 'Unknown'}
                        </span>
                      </div>
                      {r.metadata && typeof r.metadata === 'object' && 'reason' in r.metadata && (
                        <div className="text-[10px] text-[#ef2045]  font-mono mt-1">
                          Reason: &ldquo;{String((r.metadata as any).reason)}&rdquo;
                        </div>
                      )}
                    </td>

                    {/* Poster Visual */}
                    <td className="px-5 py-3.5 text-center">
                      {posterUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPoster({ url: posterUrl, title: r.target_label || 'Poster Visual' })}
                          className="relative group inline-block mx-auto rounded-lg overflow-hidden border border-slate-200  shadow-sm hover:ring-2 hover:ring-[#00eaff] transition-all cursor-pointer"
                          title="Click to view full poster"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={posterUrl}
                            alt={r.target_label || 'Poster'}
                            className="w-16 h-10 object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400  font-mono italic">
                          No Poster
                        </span>
                      )}
                    </td>

                    {/* Display Duration */}
                    <td className="px-5 py-3.5 text-xs font-mono">
                      {durationInfo ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00eaff]  bg-[#00eaff]/10 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> {durationInfo.primary}
                          </span>
                          <div className="text-[10px] text-slate-500 ">
                            {durationInfo.secondary}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400  text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500  font-mono">
                    No audit log records match the applied criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Poster Preview Lightbox Modal */}
      {previewPoster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPoster(null)}
        >
          <div
            className="bg-white  rounded-2xl border border-slate-200  overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col"
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
