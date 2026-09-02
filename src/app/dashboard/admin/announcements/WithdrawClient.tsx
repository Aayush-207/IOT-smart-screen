'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus } from '@/lib/fleet'
import { priorityLabel } from '@/lib/priority'

export function WithdrawClient({ initialRows, actorId }: { initialRows: any[]; actorId: string }) {
  const [rows, setRows] = useState(initialRows)
  const [busy, setBusy] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'scheduled' | 'withdrawn' | 'expired'>('all')

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
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to withdraw announcement.')
    } finally {
      setBusy(null)
    }
  }

  const filtered = rows.filter((r) => {
    const disp = r.status === 'approved' ? announcementDisplayStatus(r) : r.status
    if (statusFilter !== 'all' && disp !== statusFilter) return false
    if (!query) return true
    const haystack = `${r.title} ${r.departments?.name || ''} ${r.body || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green">Broadcast Archives</span>
            <span className="text-xs font-mono text-[var(--mute)]">{rows.length} Total Registered</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Broadcasted Catalog &amp; Active Airtime
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-xl mt-1.5 leading-relaxed">
            Immutable publication ledger across campus screens. Withdrawing immediately evicts slides from display node caches.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas-stone)]/40">
          {(['all', 'live', 'scheduled', 'withdrawn', 'expired'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search broadcasted notices..."
            className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
          />
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <table className="research-table text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--hairline)] text-[var(--mute)] font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-2 font-semibold">Title</th>
              <th className="py-3 px-2 font-semibold">Department</th>
              <th className="py-3 px-2 font-semibold">Priority</th>
              <th className="py-3 px-2 font-semibold">Status</th>
              <th className="py-3 px-2 font-semibold">Display Window</th>
              <th className="py-3 px-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {filtered.map((r) => {
              const disp = r.status === 'approved' ? announcementDisplayStatus(r) : r.status
              return (
                <tr key={r.id} className="hover:bg-[var(--canvas-stone)]/30 transition-colors">
                  <td className="py-4 px-2">
                    <div className="font-medium text-xs text-[var(--ink)]">{r.title}</div>
                    {r.body && <div className="text-[11px] text-[var(--slate)] truncate max-w-xs mt-0.5">{r.body}</div>}
                  </td>
                  <td className="py-4 px-2 text-xs text-[var(--slate)] font-mono">{r.departments?.name || 'General'}</td>
                  <td className="py-4 px-2">
                    <span className="font-mono text-[10px] uppercase font-semibold text-[var(--slate)]">{priorityLabel(r.priority)}</span>
                  </td>
                  <td className="py-4 px-2">
                    <StatusBadge status={disp} />
                  </td>
                  <td className="py-4 px-2 text-xs text-[var(--mute)] font-mono">
                    {r.display_start ? new Date(r.display_start).toLocaleDateString() : 'Immediate'}
                    {r.display_end ? ` → ${new Date(r.display_end).toLocaleDateString()}` : ' (No expiry)'}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {r.status !== 'withdrawn' && (
                        <button
                          disabled={busy === r.id}
                          onClick={() => withdraw(r)}
                          className="text-xs text-rose-600 hover:underline font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {busy === r.id ? 'Evicting…' : 'Withdraw'}
                        </button>
                      )}
                      {r.attachment_url && (
                        <a
                          href={r.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="cohere-btn-secondary text-xs"
                        >
                          Visual &rarr;
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[var(--mute)]">
                  No announcements match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
