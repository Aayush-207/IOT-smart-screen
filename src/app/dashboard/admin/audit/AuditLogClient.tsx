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
    if (act.includes('emergency')) return 'border border-rose-500/50 bg-rose-950/30 text-rose-400'
    if (act.includes('reject') || act.includes('withdrew')) return 'border border-rose-500/30 text-rose-400 bg-rose-950/20'
    if (act.includes('approve')) return 'border border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
    if (act.includes('refresh') || act.includes('reboot')) return 'border border-white/20 text-white bg-white/5'
    return 'border border-[#212327] bg-[#0a0a0a] text-[#7d8187]'
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              Append-Only Ledger
            </span>
            <span className="text-xs font-mono text-[#7d8187]">{filtered.length} Events Tracked</span>
          </div>
          <h1 className="xai-display-section text-white flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-white" /> System Activity &amp; Audit Log
          </h1>
          <p className="text-sm text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Append-only telemetry of all approvals, emergency overrides, and display configuration changes.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="px-5 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 self-start md:self-auto shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-lg border border-[#212327] bg-[#141414] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
          />
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
          >
            <option value="all">All Actors ({actors.length})</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
          >
            <option value="all">All Actions ({actions.length})</option>
            {actions.map((act) => (
              <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#212327] rounded-lg overflow-hidden">
        <table className="xai-table text-left text-sm">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target Identifier / Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#212327]">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-xs text-[#7d8187] font-mono whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-xs text-white font-mono">
                  {r.profiles?.email || <span className="text-[#7d8187]">System Daemon</span>}
                </td>
                <td className="px-5 py-3 text-xs font-mono">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono ${getActionBadgeClass(r.action)}`}>
                    {r.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#7d8187] font-mono uppercase">
                  {r.target_type || '—'}
                </td>
                <td className="px-5 py-3 text-xs font-normal text-white">
                  <div>{r.target_label || r.target_id || '—'}</div>
                  {r.metadata && typeof r.metadata === 'object' && 'reason' in r.metadata && (
                    <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                      Reason: &ldquo;{String((r.metadata as any).reason)}&rdquo;
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-xs text-[#7d8187] font-mono">
                  No audit log records match the applied criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
