'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Power, Pencil, Radio } from 'lucide-react'
import { deviceStatus, relativeTime } from '@/lib/fleet'
import { StatusBadge } from '@/components/StatusBadge'
import { logAudit } from '@/lib/audit'

export function DeviceDetailClient({
  screen,
  deliveries,
  auditRows,
  userId,
}: {
  screen: any
  deliveries: any[]
  auditRows: any[]
  userId: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(screen.name)
  const [location, setLocation] = useState(screen.location)
  const [zone, setZone] = useState(screen.zone || '')

  const supabase = createClient()
  const router = useRouter()
  const status = deviceStatus(screen.last_seen_at)

  const handleForceRefresh = async () => {
    setLoading('refresh')
    try {
      const { error } = await supabase.from('screens').update({ force_refresh_requested: true }).eq('id', screen.id)
      if (error) throw error
      await logAudit(supabase, { actorId: userId, action: 'force_refresh_device', targetType: 'screen', targetId: screen.id, targetLabel: screen.name })
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to request refresh.')
    } finally {
      setLoading(null)
    }
  }

  const handleReboot = async () => {
    if (!confirm(`Request a reboot of ${screen.name}? The device applies this the next time it checks in.`)) return
    setLoading('reboot')
    try {
      const { error } = await supabase.from('screens').update({ reboot_requested: true }).eq('id', screen.id)
      if (error) throw error
      await logAudit(supabase, { actorId: userId, action: 'rebooted_device', targetType: 'screen', targetId: screen.id, targetLabel: screen.name })
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to request reboot.')
    } finally {
      setLoading(null)
    }
  }

  const handleSimulatePing = async () => {
    setLoading('ping')
    try {
      const res = await fetch(`/api/screens/${screen.id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      router.refresh()
    } catch (e: any) {
      console.error(e)
      alert('Failed to simulate device ping: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  const handleRename = async () => {
    setLoading('rename')
    try {
      const { error } = await supabase.from('screens').update({ name, location, zone: zone || location }).eq('id', screen.id)
      if (error) throw error
      await logAudit(supabase, { actorId: userId, action: 'renamed_device', targetType: 'screen', targetId: screen.id, targetLabel: name })
      setEditOpen(false)
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to update device.')
    } finally {
      setLoading(null)
    }
  }

  const currentAnnouncement = screen.announcements

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      <Link href="/dashboard/admin/fleet" className="cohere-btn-secondary text-xs inline-flex items-center gap-1.5">
        &larr; Back to Fleet Infrastructure
      </Link>

      {/* Hero Header */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border-light)] bg-[var(--canvas)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green">{screen.zone || 'General Zone'}</span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {screen.name} &mdash; <span className="text-[var(--slate)] font-normal">{screen.location}</span>
          </h1>
          <p className="text-xs text-[var(--mute)] font-mono mt-1.5">
            Node UUID: {screen.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/kiosk.html?id=${screen.id}`}
            target="_blank"
            rel="noreferrer"
            className="cohere-btn-primary text-xs"
          >
            Launch Kiosk &rarr;
          </a>
          <button
            onClick={() => setEditOpen(true)}
            className="cohere-btn-pill-outline text-xs flex items-center gap-1.5"
            title="Edit Device Information"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Metadata
          </button>
        </div>
      </div>

      {/* Screen Mirror & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Agent Console Screen Mirror */}
        <div className="lg:col-span-7 agent-console-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Display Node Mirror
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Aspect: 16:9</span>
          </div>

          <div className="aspect-[16/9] rounded-xl bg-black border border-white/10 overflow-hidden flex flex-col justify-center items-center text-center p-4 text-white relative">
            {currentAnnouncement?.attachment_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAnnouncement.attachment_url} alt="Current content" className="max-h-36 object-contain rounded-lg mb-2" />
            ) : null}
            {currentAnnouncement ? (
              <div>
                <h4 className="text-sm font-semibold text-white line-clamp-2 px-2">{currentAnnouncement.title}</h4>
                {currentAnnouncement.body && (
                  <p className="text-[10px] text-neutral-300 line-clamp-2 mt-1 px-4">{currentAnnouncement.body}</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-neutral-500 font-mono">
                [Node Idle / Standby Loop]
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3 text-[8px] text-neutral-500 flex justify-between font-mono border-t border-white/5 pt-1">
              <span>Stream Protocol: WebSocket / 5s Poll</span>
              <span>Node Active</span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Remote Control */}
        <div className="lg:col-span-5 space-y-6">
          <div className="cohere-card-stone p-6 space-y-3">
            <h3 className="cohere-mono-label text-[var(--mute)] border-b border-[var(--hairline)] pb-2">
              Hardware Telemetry
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--hairline)]">
                <span className="text-[var(--slate)]">Now Playing</span>
                <span className="font-semibold text-[var(--ink)] truncate max-w-[180px]">{currentAnnouncement?.title || 'Idle Standby'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--hairline)]">
                <span className="text-[var(--slate)]">Last Heartbeat</span>
                <span className="font-mono text-[var(--ink)]" suppressHydrationWarning>{relativeTime(screen.last_seen_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--hairline)]">
                <span className="text-[var(--slate)]">Firmware</span>
                <span className="font-mono text-[var(--ink)]">{screen.firmware_version || 'v2.4.0-edge'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--slate)]">Location Zone</span>
                <span className="font-semibold text-[var(--ink)]">{screen.zone || screen.location}</span>
              </div>
            </div>

            {screen.force_refresh_requested && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-700 dark:text-amber-400 font-mono">
                Forced synchronization queued &mdash; executing on next ping.
              </div>
            )}
            {screen.reboot_requested && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-400 font-mono">
                Hardware reboot queued &mdash; executing on next sync.
              </div>
            )}
          </div>

          <div className="cohere-card-stone p-6 space-y-3">
            <h3 className="cohere-mono-label text-[var(--mute)]">
              Remote Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulatePing}
                disabled={!!loading}
                className="cohere-btn-pill-outline col-span-2 text-xs flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                <Radio className={`w-3.5 h-3.5 ${loading === 'ping' ? 'animate-ping text-emerald-500' : ''}`} /> Simulate Device Heartbeat (Ping)
              </button>
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={!!loading}
                className="cohere-btn-pill-outline text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading === 'refresh' ? 'animate-spin text-[#1863dc]' : ''}`} /> Force Sync
              </button>
              <button
                type="button"
                onClick={handleReboot}
                disabled={!!loading}
                className="cohere-btn-pill-outline border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Power className={`w-3.5 h-3.5 ${loading === 'reboot' ? 'animate-pulse' : ''}`} /> Reboot Node
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="cohere-card-stone p-6">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--ink)] mb-4">Device Audit &amp; Delivery Log</h3>
        {deliveries.length === 0 && auditRows.length === 0 ? (
          <p className="text-xs text-[var(--mute)]">No activity recorded yet for this device.</p>
        ) : (
          <div className="space-y-3 text-xs text-[var(--slate)] font-mono text-[11px]">
            {[...deliveries.map((d: any) => ({
              date: d.last_confirmed_at,
              text: `${d.announcements?.title || 'Announcement'} — ${d.state || 'delivered'}`,
            })), ...auditRows.map((a: any) => ({
              date: a.created_at,
              text: `${a.action.replace(/_/g, ' ')} by ${a.profiles?.email || 'system'}`,
            }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between border-t border-[var(--hairline)] pt-2.5 first:border-0 first:pt-0">
                  <span className="font-medium text-[var(--ink)]">{entry.text}</span>
                  <span className="text-[10px] text-[var(--mute)]">{new Date(entry.date).toLocaleString()}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--canvas)] rounded-2xl border border-[var(--hairline)] p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold text-[var(--ink)]">Update Screen Node Metadata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--mute)] block mb-1">Screen Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Device name" className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--mute)] block mb-1">Building Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--mute)] block mb-1">Campus Zone</label>
                <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]" />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end pt-2">
              <button onClick={() => setEditOpen(false)} className="cohere-btn-secondary text-xs">Cancel</button>
              <button onClick={handleRename} disabled={!!loading} className="cohere-btn-primary text-xs">
                {loading === 'rename' ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
