'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
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
    { label: 'Severe Weather Alert', text: 'WEATHER WARNING: Severe storm warning active. Move to lowest interior floor or designated storm shelter.', severity: 'warning' as const },
    { label: 'Fire Evacuation', text: 'EMERGENCY EVACUATION: Fire alarm active. Please calmly evacuate the building through the nearest safe exit.', severity: 'critical' as const },
    { label: 'Power Outage Notice', text: 'UTILITY NOTICE: Main power substation outage. Backup emergency systems active. Classes suspended.', severity: 'warning' as const },
  ]

  const applyPreset = (preset: typeof EMERGENCY_PRESETS[0]) => {
    setMessage(preset.text)
    setSeverity(preset.severity)
  }

  return (
    <div className="max-w-4xl space-y-6 text-white">
      {/* Warning Banner */}
      <div className="border border-[#fa5252]/50 bg-[#fa5252]/15 text-[#fa5252] font-bold text-xs p-4 rounded-2xl flex items-center gap-3 shadow-md">
        <div className="p-2 rounded-xl bg-[#fa5252] text-white shrink-0 shadow-xs animate-bounce">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="font-extrabold uppercase tracking-wider text-[11px]">Emergency Broadcast Console</p>
          <p className="font-normal text-xs text-[#bdb8c0] mt-0.5">
            Sending a broadcast overrides all active slides across <b className="text-white">{screenCount} screens</b> campus-wide with zero delay.
          </p>
        </div>
      </div>

      {activeEmergencies.length > 0 && (
        <div className="sentry-card border-2 border-[#fa5252]/60 bg-[#fa5252]/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fa5252] animate-ping" />
                <h3 className="font-bold text-sm text-[#fa5252] uppercase tracking-wider">
                  {activeEmergencies.length === 1 ? '1 Active Emergency Broadcast Live' : `${activeEmergencies.length} Active Emergency Broadcasts Live`}
                </h3>
              </div>
              <ul className="mt-2 text-xs text-[#bdb8c0] space-y-1">
                {activeEmergencies.map((e) => (
                  <li key={e.id} className="font-medium">
                    &ldquo;{e.body || e.title}&rdquo; &bull; <span className="font-mono uppercase text-[#fa5252] font-bold">[{e.severity || 'critical'}]</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] font-mono text-[#8b8496]">
                Safety-net auto-expires in {EMERGENCY_MAX_HOURS} hours if not manually cleared.
              </p>
            </div>
            <ClearEmergencyButton actorId={userId} />
          </div>
        </div>
      )}

      {/* Preset Action Bar */}
      <div>
        <span className="sentry-mono-label text-[#8b8496] block mb-2">
          Emergency Quick-Load Templates:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EMERGENCY_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="p-3.5 text-left rounded-xl border border-[#362d59] hover:border-[#fa5252] bg-[#150f23] hover:bg-[#fa5252]/10 text-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between font-bold text-white group-hover:text-[#fa5252] mb-1">
                <span>{p.label}</span>
                <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${p.severity === 'critical' ? 'bg-[#fa5252] text-white' : 'bg-amber-500 text-black'}`}>
                  {p.severity}
                </span>
              </div>
              <p className="text-[11px] text-[#8b8496] line-clamp-1">{p.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Broadcast Form */}
      <div className="sentry-card p-6 space-y-5 border border-[#362d59]">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#bdb8c0]">
              Broadcast Message Text <span className="text-[#fa5252]">*</span>
            </label>
            <span className="text-[10px] font-mono text-[#8b8496]">{message.length}/200</span>
          </div>
          <textarea
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder='Type emergency message to display across all screens (e.g. "Campus lockdown in effect. Shelter in place immediately.")'
            className="sentry-input text-sm leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8b8496] mb-2">Severity Level</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  severity === 'critical'
                    ? 'bg-[#fa5252] text-white border-[#fa5252] shadow-md'
                    : 'border-[#362d59] text-[#fa5252] hover:bg-[#fa5252]/10'
                }`}
              >
                CRITICAL (Red Alert)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('warning')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  severity === 'warning'
                    ? 'bg-amber-500 text-black border-amber-500 shadow-md font-extrabold'
                    : 'border-[#362d59] text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                WARNING (Amber Alert)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8b8496] mb-2">Target Scope</label>
            <div className="px-3.5 py-2.5 bg-[#1f1633] border border-[#362d59] rounded-xl text-xs font-mono font-bold text-white flex items-center justify-between">
              <span>All Campus Screens ({screenCount})</span>
              <span className="text-[10px] text-[#fa5252] font-bold uppercase">Immediate Override</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!message.trim()}
          onClick={() => setConfirmOpen(true)}
          className="sentry-btn-secondary w-full py-3.5 bg-[#fa5252] text-white border-transparent font-extrabold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-lg tracking-wider uppercase flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> Arm &amp; Broadcast Emergency Alert
        </button>
      </div>

      {/* Safety Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150f23] rounded-2xl border-2 border-[#fa5252] p-6 w-full max-w-lg shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-[#fa5252]">
              <div className="p-2.5 rounded-xl bg-[#fa5252] text-white">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Safety Lock Confirmation</h3>
                <p className="text-xs text-[#8b8496]">This action will immediately override all campus screens.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#fa5252]/15 border border-[#fa5252]/40 rounded-xl text-xs text-white font-medium">
              &ldquo;{message}&rdquo;
            </div>

            <p className="text-xs text-[#bdb8c0]">
              To prevent accidental triggers, please type <b className="text-[#fa5252] font-mono tracking-widest">CONFIRM</b> below:
            </p>

            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className="sentry-input text-center font-mono font-bold tracking-widest text-sm"
            />

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setConfirmOpen(false); setConfirmText('') }}
                className="px-4 py-2 text-xs font-bold text-[#8b8496] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={confirmText !== 'CONFIRM' || sending}
                className="sentry-btn-secondary bg-[#fa5252] text-white border-transparent px-5 py-2.5 text-xs font-bold tracking-wider uppercase disabled:opacity-50 cursor-pointer shadow-md"
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
