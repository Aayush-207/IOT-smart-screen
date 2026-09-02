'use client'

import React, { useMemo, useState } from 'react'
import { Download, ScrollText } from 'lucide-react'

export function AuditLogClient({ rows }: { rows: any[] }) {
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [actor, setActor] = useState('all')
  const [action, setAction] = useState('all')

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
    const header = ['Timestamp', 'Actor', 'Action', 'Target Type', 'Target Label']
    const lines = filtered.map((r) => [
      new Date(r.created_at).toISOString(),
      r.profiles?.email || 'system',
      r.action,
      r.target_type || '',
      r.target_label || r.target_id || '',
    ])
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
    if (act.includes('emergency')) return 'border border-[#fa5252]/50 bg-[#fa5252]/15 text-[#fa5252] font-bold'
    if (act.includes('reject') || act.includes('withdrew')) return 'border border-[#fa5252]/40 bg-[#fa5252]/10 text-[#fa5252]'
    if (act.includes('approve')) return 'border border-[#c2ef4e]/40 bg-[#c2ef4e]/10 text-[#c2ef4e] font-bold'
    if (act.includes('refresh') || act.includes('reboot')) return 'border border-[#6a5fc1]/40 bg-[#6a5fc1]/20 text-[#a79df5]'
    return 'border border-[#362d59] bg-[#1f1633] text-[#bdb8c0]'
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">Audit Trail</span>
            <span className="text-xs font-mono text-[#8b8496]">{filtered.length} Events Tracked</span>
          </div>
          <h1 className="sentry-display-section text-white flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-[#c2ef4e]" /> System Activity &amp; Audit Log
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Append-only record of all approvals, emergency overrides, and screen configuration changes.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="sentry-btn-lime flex items-center gap-2 self-start md:self-auto shrink-0 text-xs"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl border border-[#362d59] bg-[#150f23] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="sentry-input text-xs"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="sentry-input text-xs"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="sentry-input text-xs"
          />
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="sentry-input text-xs"
          >
            <option value="all">All Actors ({actors.length})</option>
            {actors.map((a: string) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="sentry-input text-xs capitalize"
          >
            <option value="all">All Actions ({actions.length})</option>
            {actions.map((act: string) => (
              <option key={act} value={act}>
                {act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="sentry-card overflow-hidden">
        <table className="sentry-table text-left text-sm">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th className="text-right">Scope / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#362d59]">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[#1f1633]/60 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-[#8b8496]">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-bold text-white">
                  {r.profiles?.email || 'system'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold ${getActionBadgeClass(
                      r.action
                    )}`}
                  >
                    {r.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-white">
                  {r.target_label ? (
                    <span className="font-bold">{r.target_label}</span>
                  ) : (
                    <span className="font-mono text-[#8b8496]">{r.target_id || '—'}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs text-[#8b8496]">
                  {r.target_type || 'system'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-xs text-[#8b8496]">
                  No audit log entries match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
