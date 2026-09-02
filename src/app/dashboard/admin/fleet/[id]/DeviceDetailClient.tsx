'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Power, Pencil, Radio, ArrowLeft, Clock } from 'lucide-react'
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
    <div className="space-y-8 max-w-5xl pb-16 text-white">
      <Link href="/dashboard/admin/fleet" className="sentry-btn-outline text-xs inline-flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Screens &amp; Fleet
      </Link>

      {/* Hero Header */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#362d59] bg-[#150f23] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">{screen.zone || 'General Zone'}</span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {screen.name} &mdash; <span className="text-[#bdb8c0] font-normal">{screen.location}</span>
          </h1>
          <p className="text-xs text-[#8b8496] font-mono mt-1.5">
            Display UUID: {screen.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/kiosk.html?id=${screen.id}`}
            target="_blank"
            rel="noreferrer"
            className="sentry-btn-lime text-xs"
          >
            Launch Kiosk &rarr;
          </a>
          <button
            onClick={() => setEditOpen(true)}
            className="sentry-btn-outline text-xs flex items-center gap-1.5"
            title="Edit Screen Information"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Metadata
          </button>
        </div>
      </div>

      {/* Screen Mirror & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Screen Mirror */}
        <div className="lg:col-span-7 sentry-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-[#362d59] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c2ef4e] animate-pulse" /> Live Display Output
            </span>
            <span className="text-[10px] font-mono text-[#8b8496]">Aspect: 16:9</span>
          </div>

          <div className="aspect-[16/9] rounded-xl bg-black border border-[#362d59] overflow-hidden flex flex-col justify-center items-center text-center p-4 text-white relative shadow-inner">
            {currentAnnouncement?.attachment_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAnnouncement.attachment_url} alt="Current content" className="max-h-36 object-contain rounded-lg mb-2" />
            ) : null}
            {currentAnnouncement ? (
              <div>
                <h4 className="text-sm font-bold text-white line-clamp-2 px-2">{currentAnnouncement.title}</h4>
                {currentAnnouncement.body && (
                  <p className="text-[10px] text-[#bdb8c0] line-clamp-2 mt-1 px-4">{currentAnnouncement.body}</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#8b8496] font-mono">
                [Display Idle &bull; Standby Rotation]
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3 text-[8px] text-[#8b8496] flex justify-between font-mono border-t border-white/10 pt-1">
              <span>Stream: WebSocket &bull; 5s Poll</span>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sentry-card p-6 space-y-3">
            <h3 className="sentry-mono-label text-[#8b8496] border-b border-[#362d59] pb-2">
              Hardware Telemetry
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#362d59]">
                <span className="text-[#8b8496]">Now Playing</span>
                <span className="font-bold text-white truncate max-w-[180px]">{currentAnnouncement?.title || 'Idle Standby'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#362d59]">
                <span className="text-[#8b8496]">Last Heartbeat</span>
                <span className="font-mono text-white" suppressHydrationWarning>{relativeTime(screen.last_seen_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#362d59]">
                <span className="text-[#8b8496]">Firmware</span>
                <span className="font-mono text-white">{screen.firmware_version || 'v2.4.0-edge'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8b8496]">Location Zone</span>
                <span className="font-bold text-white">{screen.zone || screen.location}</span>
              </div>
            </div>

            {screen.force_refresh_requested && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs text-amber-400 font-mono">
                Forced synchronization queued &mdash; executing on next ping.
              </div>
            )}
            {screen.reboot_requested && (
              <div className="p-3 bg-[#fa5252]/15 border border-[#fa5252]/40 rounded-lg text-xs text-[#fa5252] font-mono">
                Hardware reboot queued &mdash; executing on next sync.
              </div>
            )}
          </div>

          <div className="sentry-card p-6 space-y-3">
            <h3 className="sentry-mono-label text-[#8b8496]">
              Remote Controls
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulatePing}
                disabled={!!loading}
                className="sentry-btn-lime col-span-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${loading === 'ping' ? 'animate-ping' : ''}`} /> Simulate Heartbeat (Ping)
              </button>
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={!!loading}
                className="sentry-btn-secondary text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading === 'refresh' ? 'animate-spin text-[#c2ef4e]' : ''}`} /> Force Sync
              </button>
              <button
                type="button"
                onClick={handleReboot}
                disabled={!!loading}
                className="sentry-btn-secondary text-[#fa5252] border-[#fa5252]/40 hover:bg-[#fa5252]/10 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Power className={`w-3.5 h-3.5 ${loading === 'reboot' ? 'animate-pulse text-[#fa5252]' : ''}`} /> Reboot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="sentry-card p-6">
        <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#c2ef4e]" />
          <span>Screen Delivery &amp; Activity Log</span>
        </h3>
        {deliveries.length === 0 && auditRows.length === 0 ? (
          <p className="text-xs text-[#8b8496]">No activity recorded yet for this device.</p>
        ) : (
          <div className="space-y-3 text-xs text-[#bdb8c0] font-mono text-[11px]">
            {[...deliveries.map((d: any) => ({
              date: d.last_confirmed_at,
              text: `${d.announcements?.title || 'Announcement'} — ${d.state || 'delivered'}`,
            })), ...auditRows.map((a: any) => ({
              date: a.created_at,
              text: `${a.action.replace(/_/g, ' ')} by ${a.profiles?.email || 'system'}`,
            }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between border-t border-[#362d59] pt-2.5 first:border-0 first:pt-0">
                  <span className="font-bold text-white">{entry.text}</span>
                  <span className="text-[10px] text-[#8b8496]">{new Date(entry.date).toLocaleString()}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150f23] rounded-2xl border border-[#362d59] p-6 w-full max-w-md space-y-4 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white">Update Display Metadata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8b8496] block mb-1">Screen Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Screen name" className="sentry-input text-xs" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8b8496] block mb-1">Building Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="sentry-input text-xs" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8b8496] block mb-1">Campus Zone</label>
                <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" className="sentry-input text-xs" />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end pt-2">
              <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-xs font-bold text-[#8b8496] hover:text-white cursor-pointer">Cancel</button>
              <button onClick={handleRename} disabled={!!loading} className="sentry-btn-lime text-xs cursor-pointer disabled:opacity-50">
                {loading === 'rename' ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
