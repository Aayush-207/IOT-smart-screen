'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { logAudit } from '@/lib/audit'

export function ClearEmergencyButton({
  actorId,
  className = '',
}: {
  actorId: string
  className?: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const clear = async () => {
    if (!confirm('Clear the active emergency and resume normal rotation on all screens?')) return
    setBusy(true)
    try {
      const nowIso = new Date().toISOString()
      const { data: active, error: qErr } = await supabase
        .from('announcements')
        .select('id, title')
        .eq('is_emergency', true)
        .eq('status', 'approved')
        .or(`display_end.is.null,display_end.gt.${nowIso}`)
      if (qErr) throw qErr

      if (!active || active.length === 0) {
        alert('No active emergency to clear.')
        return
      }

      const ids = active.map((a) => a.id)
      const { error: uErr } = await supabase
        .from('announcements')
        .update({ display_end: nowIso, updated_at: nowIso })
        .in('id', ids)
      if (uErr) throw uErr

      for (const a of active) {
        await logAudit(supabase, {
          actorId,
          action: 'cleared_emergency_broadcast',
          targetType: 'broadcast',
          targetId: a.id,
          targetLabel: a.title,
        })
      }
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to clear emergency.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={clear}
      disabled={busy}
      className={
        className ||
        'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 cursor-pointer shadow-sm'
      }
    >
      <ShieldCheck className="w-4 h-4" />
      {busy ? 'Clearing…' : 'Clear Emergency & Resume'}
    </button>
  )
}
