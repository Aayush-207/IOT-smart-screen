'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Power, Pencil, Radio, ArrowLeft, Tv, ShieldCheck, Activity, Cpu, Layers } from 'lucide-react'
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
  const status = deviceStatus(screen.last_seen_at, screen.name)

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
    <div className="space-y-8 max-w-5xl pb-16 animate-fade-in-up">
      <Link
        href="/dashboard/admin/fleet"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#4c1d76]/20 bg-white text-xs font-mono text-[#4c1d76] hover:bg-[#f4eefe] transition-all shadow-xs btn-press font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet Infrastructure
      </Link>

      {/* Hero Header */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#4c1d76]/15 bg-gradient-to-br from-white via-white to-[#faf8ff] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-[0_12px_32px_rgba(76,29,118,0.08)] transition-all">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider bg-[#f4eefe] border border-[#4c1d76]/20 text-[#4c1d76] font-bold">
              {screen.zone || 'General Zone'}
            </span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {screen.name} &mdash; <span className="text-slate-500 font-normal">{screen.location}</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1.5">
            Node UUID: {screen.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/kiosk.html?id=${screen.id}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-[#4c1d76] hover:bg-[#39125b] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(76,29,118,0.25)] btn-press"
          >
            Launch Kiosk &rarr;
          </a>
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-xl border border-[#4c1d76]/20 bg-white hover:bg-[#f4eefe] text-slate-800 hover:text-[#4c1d76] text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs btn-press cursor-pointer"
            title="Edit Device Information"
          >
            <Pencil className="w-3.5 h-3.5 text-[#4c1d76]" /> Edit Metadata
          </button>
        </div>
      </div>

      {/* Screen Mirror & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Agent Console Screen Mirror */}
        <div className="lg:col-span-7 rounded-2xl border border-[#4c1d76]/15 bg-white p-6 flex flex-col justify-between shadow-sm hover:shadow-[0_12px_32px_rgba(76,29,118,0.08)] transition-all">
          <div className="flex items-center justify-between mb-4 border-b border-[#4c1d76]/10 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" /> Display Node Mirror
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-medium">Aspect: 16:9 (1672×941)</span>
          </div>

          <div className="aspect-[16/9] rounded-xl bg-slate-950 border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-center items-center text-center p-4 text-white relative ring-1 ring-black/40">
            {currentAnnouncement?.attachment_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAnnouncement.attachment_url} alt="Current content" className="max-h-36 object-contain rounded-lg mb-2" />
            ) : null}
            {currentAnnouncement ? (
              <div>
                <h4 className="text-sm font-semibold text-white line-clamp-2 px-2">{currentAnnouncement.title}</h4>
                {currentAnnouncement.body && (
                  <p className="text-[10px] text-purple-200/80 line-clamp-2 mt-1 px-4">{currentAnnouncement.body}</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-purple-300/70 font-mono space-y-1">
                <Tv className="w-6 h-6 text-purple-400 mx-auto opacity-70 mb-1" />
                <p>[Node Idle / Standby Loop]</p>
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3 text-[8px] text-purple-300/60 flex justify-between font-mono border-t border-purple-500/20 pt-1">
              <span>Stream Protocol: WebSocket / 5s Poll</span>
              <span>Node Active</span>
            </div>
            {/* Screen Glare reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
          </div>
        </div>

        {/* Right: Telemetry & Remote Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#4c1d76]/15 bg-gradient-to-br from-white via-white to-[#faf8ff] p-6 space-y-3 shadow-sm hover:shadow-[0_12px_32px_rgba(76,29,118,0.08)] transition-all">
            <h3 className="text-[10px] uppercase font-mono tracking-widest text-[#4c1d76] border-b border-[#4c1d76]/10 pb-2 font-bold">
              Hardware Telemetry
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Now Playing</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">{currentAnnouncement?.title || 'Idle Standby'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Last Heartbeat</span>
                <span className="font-mono text-slate-900 font-medium" suppressHydrationWarning>{relativeTime(screen.last_seen_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Firmware</span>
                <span className="font-mono text-slate-900 font-medium">{screen.firmware_version || 'v2.4.0-edge'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Native Canvas</span>
                <span className="font-mono text-slate-900 font-medium">1672 × 941 px (16:9)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Location Zone</span>
                <span className="font-semibold text-slate-900">{screen.zone || screen.location}</span>
              </div>
            </div>

            {screen.force_refresh_requested && (
              <div className="p-3 bg-[#f4eefe] border border-[#4c1d76]/25 rounded-xl text-xs text-[#4c1d76] font-mono font-medium">
                Forced synchronization queued &mdash; executing on next ping.
              </div>
            )}
            {screen.reboot_requested && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono font-medium">
                Hardware reboot queued &mdash; executing on next sync.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#4c1d76]/15 bg-white p-6 space-y-3 shadow-sm hover:shadow-[0_12px_32px_rgba(76,29,118,0.08)] transition-all">
            <h3 className="text-[10px] uppercase font-mono tracking-widest text-[#4c1d76] font-bold">
              Remote Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulatePing}
                disabled={!!loading}
                className="col-span-2 px-3 py-2.5 rounded-xl border border-[#4c1d76]/25 text-[#4c1d76] bg-[#f4eefe]/70 hover:bg-[#f4eefe] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs btn-press"
              >
                <Radio className={`w-3.5 h-3.5 ${loading === 'ping' ? 'animate-ping text-[#4c1d76]' : ''}`} /> Simulate Heartbeat (Ping)
              </button>
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={!!loading}
                className="px-3 py-2 rounded-xl border border-[#4c1d76]/15 bg-white hover:bg-[#f4eefe] text-slate-700 hover:text-[#4c1d76] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs btn-press"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading === 'refresh' ? 'animate-spin text-[#4c1d76]' : ''}`} /> Force Sync
              </button>
              <button
                type="button"
                onClick={handleReboot}
                disabled={!!loading}
                className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs btn-press"
              >
                <Power className={`w-3.5 h-3.5 ${loading === 'reboot' ? 'animate-pulse' : ''}`} /> Reboot Node
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-2xl border border-[#4c1d76]/15 bg-white p-6 shadow-sm hover:shadow-[0_12px_32px_rgba(76,29,118,0.08)] transition-all">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Device Audit &amp; Delivery Log</h3>
        {deliveries.length === 0 && auditRows.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No activity recorded yet for this device.</p>
        ) : (
          <div className="space-y-3 text-xs text-slate-600 font-mono text-[11px]">
            {[...deliveries.map((d: any) => ({
              date: d.last_confirmed_at,
              text: `${d.announcements?.title || 'Announcement'} — ${d.state || 'delivered'}`,
            })), ...auditRows.map((a: any) => ({
              date: a.created_at,
              text: `${a.action.replace(/_/g, ' ')} by ${a.profiles?.email || 'system'}`,
            }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-2.5 first:border-0 first:pt-0">
                  <span className="font-medium text-slate-900">{entry.text}</span>
                  <span className="text-[10px] text-slate-400">{new Date(entry.date).toLocaleString()}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#4c1d76]/20 p-6 w-full max-w-md space-y-4 shadow-[0_25px_60px_rgba(76,29,118,0.25)] animate-scale-in">
            <div className="flex items-center gap-3 pb-3 border-b border-[#4c1d76]/10">
              <div className="w-9 h-9 rounded-xl bg-[#f4eefe] border border-[#4c1d76]/20 flex items-center justify-center text-[#4c1d76] shrink-0">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Screen Node Metadata</h3>
                <p className="text-xs text-slate-500">Edit hardware node information and placement</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Screen Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Device name"
                  className="w-full px-3.5 py-2.5 bg-[#faf8ff] border border-[#4c1d76]/15 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Building Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full px-3.5 py-2.5 bg-[#faf8ff] border border-[#4c1d76]/15 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Campus Zone</label>
                <input
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Zone"
                  className="w-full px-3.5 py-2.5 bg-[#faf8ff] border border-[#4c1d76]/15 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/15 transition-all shadow-xs"
                />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-mono cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!!loading}
                className="px-5 py-2 rounded-xl bg-[#4c1d76] hover:bg-[#39125b] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(76,29,118,0.25)] transition-all"
              >
                {loading === 'rename' ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
