'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { ClearEmergencyButton } from '@/components/ClearEmergencyButton'

// Blueprint Part 15: an emergency stays up until manually cleared, or a hard
// 4-hour safety-net auto-expiry, whichever comes first.
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
        action: 'sent_emergency_broadcast',
        targetType: 'broadcast',
        targetId: announcement.id,
        targetLabel: message.slice(0, 80),
        metadata: { severity },
      })

      setMessage('')
      setConfirmOpen(false)
      setConfirmText('')
      router.push('/dashboard/admin/audit')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to send emergency broadcast.')
    } finally {
      setSending(false)
    }
  }

  const EMERGENCY_PRESETS = [
    { label: 'Campus Lockdown', text: 'SECURITY ALERT: Campus Lockdown in effect. Shelter in place immediately, lock doors, and stay away from windows.', severity: 'critical' as const },
    { label: 'Severe Weather Alert', text: 'WEATHER WARNING: Severe storm warning active. Move to lowest interior floor or storm shelter immediately.', severity: 'warning' as const },
    { label: 'Fire Evacuation', text: 'EMERGENCY EVACUATION: Fire alarm active. Please calmly evacuate the building through nearest exit.', severity: 'critical' as const },
    { label: 'Power / Grid Failure', text: 'UTILITY NOTICE: Main power substation outage. Backup emergency power active. Classes suspended.', severity: 'warning' as const },
  ]

  const applyPreset = (preset: typeof EMERGENCY_PRESETS[0]) => {
    setMessage(preset.text)
    setSeverity(preset.severity)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Warning Banner */}
      <div className="border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-xs p-4 rounded-2xl flex items-center gap-3 shadow-xs">
        <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-xs animate-bounce">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="font-extrabold uppercase tracking-wider text-[11px]">Emergency Broadcast System Active</p>
          <p className="font-normal text-xs opacity-90 mt-0.5">
            Sending a broadcast overrides all scheduled content across <b>{screenCount} screens</b> campus-wide with zero delay.
          </p>
        </div>
      </div>

      {activeEmergencies.length > 0 && (
        <div className="geist-card border-2 border-rose-500/50 bg-rose-500/5 p-5 whisper-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <h3 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {activeEmergencies.length === 1 ? '1 Active Emergency Broadcast Live' : `${activeEmergencies.length} Active Emergency Broadcasts Live`}
                </h3>
              </div>
              <ul className="mt-2 text-xs text-[var(--body)] space-y-1">
                {activeEmergencies.map((e) => (
                  <li key={e.id} className="font-medium">
                    &ldquo;{e.body || e.title}&rdquo; &bull; <span className="font-mono uppercase text-rose-600 font-bold">[{e.severity || 'critical'}]</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] font-mono text-[var(--mute)]">
                Hard safety-net auto-expires in {EMERGENCY_MAX_HOURS} hours if not manually cancelled.
              </p>
            </div>
            <ClearEmergencyButton actorId={userId} />
          </div>
        </div>
      )}

      {/* Preset Action Bar */}
      <div>
        <span className="text-[10px] font-mono uppercase font-bold text-[var(--mute)] tracking-wider block mb-2">
          Emergency Quick-Load Templates:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EMERGENCY_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="p-3 text-left rounded-xl border border-[var(--hairline)] hover:border-rose-500/50 bg-[var(--canvas-elevated)] hover:bg-rose-500/5 text-xs transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between font-bold text-[var(--ink)] group-hover:text-rose-600 mb-1">
                <span>{p.label}</span>
                <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${p.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {p.severity}
                </span>
              </div>
              <p className="text-[11px] text-[var(--mute)] line-clamp-1">{p.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Broadcast Form */}
      <div className="geist-card p-6 whisper-shadow space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Broadcast Message Content <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] font-mono text-[var(--mute)]">{message.length}/200</span>
          </div>
          <textarea
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder='Type emergency message to display across all screens (e.g. "Campus lockdown in effect. Shelter in place immediately.")'
            className="w-full p-3.5 bg-[var(--canvas-inset)] border border-rose-500/30 rounded-xl text-sm font-medium text-[var(--ink)] focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition-all leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mute)] mb-2">Severity Level</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  severity === 'critical'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/30'
                    : 'border-[var(--hairline)] text-rose-600 hover:bg-rose-500/10'
                }`}
              >
                CRITICAL (Red Alert)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('warning')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  severity === 'warning'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/30'
                    : 'border-[var(--hairline)] text-amber-600 hover:bg-amber-500/10'
                }`}
              >
                WARNING (Amber Alert)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mute)] mb-2">Broadcast Scope</label>
            <div className="px-3.5 py-2.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-xl text-xs font-mono font-medium text-[var(--body)] flex items-center justify-between">
              <span>All Campus Screens ({screenCount})</span>
              <span className="text-[10px] text-rose-600 font-bold uppercase">Locked (Global Override)</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!message.trim()}
          onClick={() => setConfirmOpen(true)}
          className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-rose-600/20 tracking-wider uppercase flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> Arm &amp; Broadcast Emergency Alert
        </button>
      </div>

      {/* Safety Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--canvas-elevated)] rounded-2xl border-2 border-rose-600 p-6 w-full max-w-lg floating-shadow space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Safety Lock Confirmation</h3>
                <p className="text-xs text-[var(--mute)]">This action will immediately override all displays.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              &ldquo;{message}&rdquo;
            </div>

            <p className="text-xs text-[var(--body)]">
              To prevent accidental triggers, please type <b className="text-rose-600 font-mono tracking-widest">CONFIRM</b> below:
            </p>

            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className="w-full px-3.5 py-2.5 bg-[var(--canvas-inset)] border border-rose-500/40 rounded-xl text-sm font-mono font-bold text-center tracking-widest text-[var(--ink)] focus:outline-none focus:border-rose-600"
            />

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setConfirmOpen(false); setConfirmText('') }}
                className="px-4 py-2 text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={confirmText !== 'CONFIRM' || sending}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase disabled:opacity-50 transition-all cursor-pointer shadow-md"
              >
                {sending ? 'Transmitting…' : 'Execute Emergency Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
