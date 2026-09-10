'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { ClearEmergencyButton } from '@/components/ClearEmergencyButton'

const EMERGENCY_MAX_HOURS = 4

export function EmergencyBroadcastClient({
  userId,
  screenCount,
  activeEmergencies = [],
}: {
  userId: string
  screenCount: number
  activeEmergencies?: any[]
}) {
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<'critical' | 'warning'>('critical')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleSend = async () => {
    if (confirmText !== 'CONFIRM') return
    setSending(true)
    try {
      const now = new Date()
      const end = new Date(now.getTime() + EMERGENCY_MAX_HOURS * 60 * 60 * 1000)

      const { data: announcement, error } = await supabase
        .from('announcements')
        .insert({
          title: `Emergency: ${message.slice(0, 60)}`,
          body: message,
          priority: 'emergency',
          target_all: true,
          status: 'approved',
          is_emergency: true,
          severity,
          display_start: now.toISOString(),
          display_end: end.toISOString(),
          submitted_by: userId,
          reviewed_by: userId,
          reviewed_at: now.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      await logAudit(supabase, {
        actorId: userId,
        action: 'emergency_broadcast',
        targetType: 'announcement',
        targetId: announcement.id,
        targetLabel: announcement.title,
        metadata: { severity, message, screenCount },
      })

      setMessage('')
      setConfirmOpen(false)
      setConfirmText('')
      router.refresh()
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Failed to dispatch emergency broadcast.')
    } finally {
      setSending(false)
    }
  }

  const EMERGENCY_PRESETS = [
    { label: 'Campus Lockdown', text: 'SECURITY ALERT: Campus Lockdown in effect. Shelter in place immediately, lock doors, and stay away from windows.', severity: 'critical' as const },
    { label: 'Severe Weather Warning', text: 'WEATHER WARNING: Severe storm warning active. Move to lowest interior floor or designated storm shelter.', severity: 'warning' as const },
    { label: 'Building Evacuation', text: 'EMERGENCY EVACUATION: Alarm active. Please calmly evacuate the building through the nearest safe exit.', severity: 'critical' as const },
    { label: 'Power / Network Outage', text: 'FACILITIES NOTICE: Campus power outage. Backup systems active. Awaiting restoration.', severity: 'warning' as const },
  ]

  const applyPreset = (preset: typeof EMERGENCY_PRESETS[0]) => {
    setMessage(preset.text)
    setSeverity(preset.severity)
  }

  return (
    <div className="max-w-4xl space-y-6 text-neutral-900 dark:text-white">
      {/* Warning Banner */}
      <div className="border border-[#ef2045]/40 bg-rose-950/30 text-[#ef2045] text-xs p-4 rounded-lg flex items-center gap-3">
        <div className="p-2 rounded-full bg-[#ef2045] text-white shrink-0 animate-bounce">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <p className="font-mono uppercase tracking-wider text-[11px] text-[#ef2045]">Emergency Override Gateway</p>
          <p className="text-xs text-neutral-600 dark:text-[#dadbdf] mt-0.5">
            Dispatching an emergency broadcast overrides all active slides across <b className="text-neutral-900 dark:text-white font-mono">{screenCount} nodes</b> campus-wide with sub-second latency.
          </p>
        </div>
      </div>

      {activeEmergencies.length > 0 && (
        <div className="bg-white dark:bg-[#141414] border border-[#ef2045]/60 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#ef2045] animate-ping" />
                <h3 className="font-mono text-xs text-[#ef2045] uppercase tracking-wider">
                  {activeEmergencies.length === 1 ? '1 Active Emergency Broadcast Live' : `${activeEmergencies.length} Active Emergency Broadcasts Live`}
                </h3>
              </div>
              <ul className="mt-2 text-xs text-neutral-600 dark:text-[#dadbdf] space-y-1">
                {activeEmergencies.map((e) => (
                  <li key={e.id} className="font-normal">
                    &ldquo;{e.body || e.title}&rdquo; &bull; <span className="font-mono uppercase text-[#ef2045]">[{e.severity || 'critical'}]</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">
                Safety-net auto-expires in {EMERGENCY_MAX_HOURS} hours if not manually cleared.
              </p>
            </div>
            <ClearEmergencyButton actorId={userId} />
          </div>
        </div>
      )}

      {/* Preset Action Bar */}
      <div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187] block mb-2">
          Emergency Quick-Load Templates:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EMERGENCY_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="p-3.5 text-left rounded-lg border border-neutral-200 dark:border-[#212327] hover:border-[#ef2045]/40 bg-white dark:bg-[#141414] hover:bg-rose-950/20 text-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-neutral-900 dark:text-white group-hover:text-[#ef2045] mb-1">
                <span className="font-normal text-xs">{p.label}</span>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-mono ${p.severity === 'critical' ? 'bg-[#ef2045] text-white' : 'border border-[#af1591]/40 text-[#af1591] bg-[#af1591]/10'}`}>
                  {p.severity}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-[#7d8187] line-clamp-1 font-mono">{p.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Broadcast Form */}
      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-6 space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-[#dadbdf]">
              Broadcast Message Text <span className="text-[#ef2045]">*</span>
            </label>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">{message.length}/200</span>
          </div>
          <textarea
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder='Type emergency message to broadcast across all screens (e.g. "Campus lockdown in effect. Shelter in place immediately.")'
            className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-white leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#7d8187] mb-2">Severity Tier</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`py-2 px-3 rounded-full text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                  severity === 'critical'
                    ? 'bg-[#ef2045] text-white border-[#ef2045]'
                    : 'border-neutral-200 dark:border-[#212327] text-[#ef2045] hover:border-[#ef2045]/30'
                }`}
              >
                CRITICAL (Red)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('warning')}
                className={`py-2 px-3 rounded-full text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                  severity === 'warning'
                    ? 'bg-[#af1591] text-black border-[#af1591] font-medium'
                    : 'border-neutral-200 dark:border-[#212327] text-[#af1591] hover:border-[#af1591]/30'
                }`}
              >
                WARNING (Amber)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-[#7d8187] mb-2">Target Scope</label>
            <div className="px-3.5 py-2 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg text-xs font-mono text-neutral-900 dark:text-white flex items-center justify-between">
              <span>All Mesh Displays ({screenCount})</span>
              <span className="text-[10px] text-[#ef2045] uppercase">Immediate Override</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!message.trim()}
          onClick={() => setConfirmOpen(true)}
          className="w-full py-3 rounded-full bg-[#ef2045] hover:bg-[#ef2045] text-white font-mono uppercase tracking-wider text-xs disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> Arm &amp; Broadcast Emergency Alert
        </button>
      </div>

      {/* Safety Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#ef2045]/60 p-6 w-full max-w-lg shadow-2xl space-y-4 text-neutral-900 dark:text-white">
            <div className="flex items-center gap-3 text-[#ef2045]">
              <div className="p-2 rounded-full bg-[#ef2045] text-white">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-normal">Safety Lock Confirmation</h3>
                <p className="text-xs text-neutral-500 dark:text-[#7d8187] font-mono">This action will immediately override all campus screens.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/30 border border-[#ef2045]/40 rounded-lg text-xs text-neutral-900 dark:text-white">
              &ldquo;{message}&rdquo;
            </div>

            <p className="text-xs text-neutral-600 dark:text-[#dadbdf]">
              To prevent accidental triggers, please type <b className="text-[#ef2045] font-mono tracking-widest">CONFIRM</b> below:
            </p>

            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3.5 py-2 text-center font-mono tracking-widest text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#ef2045]"
            />

            <div className="flex gap-2.5 justify-end pt-2 border-t border-neutral-200 dark:border-[#212327]">
              <button
                type="button"
                onClick={() => { setConfirmOpen(false); setConfirmText('') }}
                className="px-4 py-1.5 rounded-full border border-white/20 text-neutral-900 dark:text-white hover:bg-white/5 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={confirmText !== 'CONFIRM' || sending}
                className="px-5 py-1.5 rounded-full bg-[#ef2045] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#ef2045] disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting…</span>
                  </>
                ) : (
                  <span>Execute Emergency Broadcast</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
