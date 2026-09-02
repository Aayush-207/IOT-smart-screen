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
      <Link href="/dashboard/admin/fleet" className="px-4 py-1.5 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Screens &amp; Fleet
      </Link>

      {/* Hero Header */}
      <div className="p-6 md:p-8 rounded-lg border border-[#212327] bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              {screen.zone || 'General Zone'}
            </span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-white">
            {screen.name} &mdash; <span className="text-[#dadbdf] font-normal">{screen.location}</span>
          </h1>
          <p className="text-xs text-[#7d8187] font-mono mt-1.5">
            Node UUID: {screen.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/kiosk.html?id=${screen.id}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors"
          >
            Launch Kiosk &rarr;
          </a>
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Edit Screen Information"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Metadata
          </button>
        </div>
      </div>

      {/* Screen Mirror & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Screen Mirror */}
        <div className="lg:col-span-7 bg-[#141414] border border-[#212327] rounded-lg p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-[#212327] pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Display Output
            </span>
            <span className="text-[10px] font-mono text-[#7d8187]">Aspect: 16:9</span>
          </div>

          <div className="aspect-[16/9] rounded-lg bg-black border border-[#212327] overflow-hidden flex flex-col justify-center items-center text-center p-4 text-white relative shadow-inner">
            {currentAnnouncement?.attachment_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAnnouncement.attachment_url} alt="Current content" className="max-h-36 object-contain rounded-lg mb-2" />
            ) : null}
            {currentAnnouncement ? (
              <div>
                <h4 className="text-sm font-normal text-white line-clamp-2 px-2">{currentAnnouncement.title}</h4>
                {currentAnnouncement.body && (
                  <p className="text-[10px] text-[#dadbdf] line-clamp-2 mt-1 px-4">{currentAnnouncement.body}</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#7d8187] font-mono">
                [Display Idle &bull; Standby Rotation Loop]
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3 text-[8px] text-[#7d8187] flex justify-between font-mono border-t border-white/10 pt-1">
              <span>Stream: WebSocket &bull; 5s Poll</span>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#141414] border border-[#212327] rounded-lg p-6 space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187] border-b border-[#212327] pb-2">
              Hardware Telemetry
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#212327]">
                <span className="text-[#7d8187]">Now Playing</span>
                <span className="text-white truncate max-w-[180px]">{currentAnnouncement?.title || 'Idle Standby'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#212327]">
                <span className="text-[#7d8187]">Last Heartbeat</span>
                <span className="text-white" suppressHydrationWarning>{relativeTime(screen.last_seen_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#212327]">
                <span className="text-[#7d8187]">Firmware</span>
                <span className="text-white">{screen.firmware_version || 'v2.4.0-edge'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#7d8187]">Location Zone</span>
                <span className="text-white">{screen.zone || screen.location}</span>
              </div>
            </div>

            {screen.force_refresh_requested && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 font-mono">
                Forced synchronization queued &mdash; executing on next ping.
              </div>
            )}
            {screen.reboot_requested && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 font-mono">
                Hardware reboot queued &mdash; executing on next sync.
              </div>
            )}
          </div>

          <div className="bg-[#141414] border border-[#212327] rounded-lg p-6 space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">
              Remote Controls
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulatePing}
                disabled={!!loading}
                className="col-span-2 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${loading === 'ping' ? 'animate-ping' : ''}`} /> Simulate Heartbeat (Ping)
              </button>
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={!!loading}
                className="py-2 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading === 'refresh' ? 'animate-spin' : ''}`} /> Force Sync
              </button>
              <button
                type="button"
                onClick={handleReboot}
                disabled={!!loading}
                className="py-2 rounded-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Power className={`w-3.5 h-3.5 ${loading === 'reboot' ? 'animate-pulse' : ''}`} /> Reboot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-[#141414] border border-[#212327] rounded-lg p-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-[#7d8187] mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white" />
          <span>Screen Delivery &amp; Activity Log</span>
        </h3>
        {deliveries.length === 0 && auditRows.length === 0 ? (
          <p className="text-xs text-[#7d8187] font-mono">No activity recorded yet for this device.</p>
        ) : (
          <div className="space-y-3 text-xs text-[#dadbdf] font-mono text-[11px]">
            {[...deliveries.map((d: any) => ({
              date: d.last_confirmed_at,
              text: `${d.announcements?.title || 'Announcement'} — ${d.state || 'delivered'}`,
            })), ...auditRows.map((a: any) => ({
              date: a.created_at,
              text: `${a.action.replace(/_/g, ' ')} by ${a.profiles?.email || 'system'}`,
            }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between border-t border-[#212327] pt-2.5 first:border-0 first:pt-0">
                  <span className="text-white">{entry.text}</span>
                  <span className="text-[10px] text-[#7d8187]">{new Date(entry.date).toLocaleString()}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141414] rounded-xl border border-[#212327] p-6 w-full max-w-md space-y-4 shadow-2xl text-white">
            <h3 className="text-sm font-normal text-white">Update Display Node Metadata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-[#7d8187] block mb-1">Screen Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Screen name" className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-[#7d8187] block mb-1">Building Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-[#7d8187] block mb-1">Campus Zone</label>
                <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white" />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end pt-2">
              <button onClick={() => setEditOpen(false)} className="px-4 py-1.5 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono cursor-pointer">Cancel</button>
              <button onClick={handleRename} disabled={!!loading} className="px-5 py-1.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 cursor-pointer disabled:opacity-50 transition-colors">
                {loading === 'rename' ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
