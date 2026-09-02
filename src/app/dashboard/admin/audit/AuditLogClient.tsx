'use client'

import React, { useMemo, useState } from 'react'
import { Download } from 'lucide-react'

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
    if (act.includes('emergency')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold'
    if (act.includes('reject') || act.includes('withdrew')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
    if (act.includes('approve')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    if (act.includes('refresh') || act.includes('reboot')) return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
    return 'bg-[var(--canvas-inset)] text-[var(--mute)] border-[var(--hairline)]'
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green">Immutable Ledger</span>
            <span className="text-xs font-mono text-[var(--mute)]">{filtered.length} Events Tracked</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            System Event &amp; Compliance Audit
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-xl mt-1.5 leading-relaxed">
            Cryptographic, append-only operational record of all administrative authorizations, priority overrides, and hardware device mutations.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="cohere-btn-pill-outline flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[var(--cohere-action-blue)]" /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-stone)]/30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
          />
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
          >
            <option value="all">All Actors ({actors.length})</option>
            {actors.map((a: string) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)] capitalize"
          >
            <option value="all">All Actions ({actions.length})</option>
            {actions.map((act: string) => (
              <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <table className="research-table text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--hairline)] text-[var(--mute)] font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-2 font-semibold">Timestamp</th>
              <th className="py-3 px-2 font-semibold">Actor</th>
              <th className="py-3 px-2 font-semibold">Action</th>
              <th className="py-3 px-2 font-semibold">Target Entity</th>
              <th className="py-3 px-2 font-semibold">Details &amp; Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--canvas-stone)]/30 transition-colors">
                <td className="py-4 px-2 text-xs text-[var(--mute)] font-mono whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="py-4 px-2 text-xs font-mono text-[var(--ink)] font-medium">
                  {r.profiles?.email || <span className="text-[var(--mute)]">System / Engine</span>}
                </td>
                <td className="py-4 px-2">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider border ${getActionBadgeClass(r.action)}`}>
                    {r.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-4 px-2 text-xs text-[var(--slate)] font-mono">
                  {r.target_type && <span className="text-[10px] text-[var(--mute)] uppercase mr-1">{r.target_type}:</span>}
                  <span className="font-semibold text-[var(--ink)]">{r.target_label || r.target_id || '—'}</span>
                </td>
                <td className="py-4 px-2 text-xs text-[var(--slate)] max-w-xs truncate font-mono text-[11px]">
                  {r.metadata && Object.keys(r.metadata).length > 0
                    ? JSON.stringify(r.metadata)
                    : <span className="text-[var(--faint)]">—</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[var(--mute)]">
                  No log records match the applied criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
