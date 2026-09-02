'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus } from '@/lib/fleet'
import { priorityLabel } from '@/lib/priority'
import { Search, Ban } from 'lucide-react'

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
    <div className="space-y-8 max-w-6xl pb-16 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              Broadcast Directory
            </span>
            <span className="text-xs font-mono text-[#7d8187]">{rows.length} Total Notices</span>
          </div>
          <h1 className="xai-display-section text-white">
            Broadcast Catalog &amp; Active Content
          </h1>
          <p className="text-sm text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Review all scheduled, live, and historical notices across campus screens. Take down notices immediately if needed.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8187]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalog by title..."
            className="w-full bg-[#0a0a0a] border border-[#212327] rounded-full pl-8 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 bg-[#141414] p-1 rounded-full border border-[#212327] w-fit">
        {(['all', 'live', 'scheduled', 'expired', 'withdrawn'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-white text-[#0a0a0a] font-medium'
                : 'text-[#7d8187] hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="bg-[#141414] border border-[#212327] rounded-lg overflow-hidden">
        <table className="xai-table text-left text-sm">
          <thead>
            <tr>
              <th>Notice Title &amp; Details</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Display Schedule</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#212327]">
            {filtered.map((r) => {
              const disp = r.status === 'approved' ? announcementDisplayStatus(r) : r.status
              const isWithdrawn = r.status === 'withdrawn'
              return (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-normal text-xs text-white">{r.title}</div>
                    {r.body && <div className="text-[11px] text-[#7d8187] truncate max-w-xs mt-0.5 font-mono">{r.body}</div>}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#7d8187] font-mono">
                    {r.departments?.name || 'General'}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-full border border-white/20 text-white bg-white/5 text-[10px] uppercase">
                      {priorityLabel(r.priority)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={disp} />
                  </td>
                  <td className="px-5 py-4 text-xs text-[#7d8187] font-mono">
                    {r.display_start ? new Date(r.display_start).toLocaleDateString() : 'Immediate'}
                    {r.display_end ? ` → ${new Date(r.display_end).toLocaleDateString()}` : ' (Continuous)'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isWithdrawn ? (
                      <span className="text-[11px] text-[#7d8187] italic font-mono">Withdrawn</span>
                    ) : (
                      <button
                        onClick={() => withdraw(r)}
                        disabled={busy === r.id}
                        className="px-3 py-1 rounded-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {busy === r.id ? 'Taking down…' : 'Take Down'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#7d8187]">
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
