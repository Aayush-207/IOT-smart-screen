'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, RefreshCw, Power, Cpu, ExternalLink, Radio } from 'lucide-react'
import { deviceStatus, relativeTime, type DeviceStatus } from '@/lib/fleet'
import { logAudit } from '@/lib/audit'

const DOT_COLOR: Record<DeviceStatus, string> = {
  online: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]',
  stale: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]',
  offline: 'bg-neutral-400',
}

const CARD_BORDER_COLOR: Record<DeviceStatus, string> = {
  online: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.02]',
  stale: 'border-amber-500/20 hover:border-amber-500/40 bg-amber-500/[0.02]',
  offline: 'border-neutral-500/10 hover:border-neutral-500/25 bg-neutral-500/[0.01]',
}

export function FleetMonitoringClient({
  initialScreens,
  userId,
}: {
  initialScreens: any[]
  userId: string
}) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [query, setQuery] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [zone, setZone] = useState('')
  const [saving, setSaving] = useState(false)

  // Track loader states for inline actions
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyType, setBusyType] = useState<'refresh' | 'reboot' | 'ping' | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Live refresh so heartbeats update automatically without a manual reload.
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(interval)
  }, [router])

  const withStatus = useMemo(
    () => initialScreens.map((s) => ({ ...s, _status: deviceStatus(s.last_seen_at) })),
    [initialScreens]
  )

  const counts = useMemo(() => {
    const c = { online: 0, stale: 0, offline: 0 }
    withStatus.forEach((s) => c[s._status as DeviceStatus]++)
    return c
  }, [withStatus])

  const onlineRate = withStatus.length > 0
    ? Math.round((counts.online / withStatus.length) * 100)
    : 0

  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'stale' | 'offline'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = withStatus.filter((s) => {
    if (statusFilter !== 'all' && s._status !== statusFilter) return false
    if (!query) return true
    const haystack = `${s.name} ${s.location} ${s.zone || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  // Group filtered devices by zone for Map View
  const screensByZone = useMemo(() => {
    const zonesMap: Record<string, typeof filtered> = {}
    filtered.forEach((s) => {
      const z = s.zone || 'General Area'
      if (!zonesMap[z]) zonesMap[z] = []
      zonesMap[z].push(s)
    })
    return zonesMap
  }, [filtered])

  const handleForceRefreshInline = async (screenId: string, screenName: string) => {
    setBusyId(screenId)
    setBusyType('refresh')
    try {
      const { error } = await supabase
        .from('screens')
        .update({ force_refresh_requested: true })
        .eq('id', screenId)
      if (error) throw error
      await logAudit(supabase, {
        actorId: userId,
        action: 'force_refresh_device',
        targetType: 'screen',
        targetId: screenId,
        targetLabel: screenName,
      })
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to request refresh.')
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleRebootInline = async (screenId: string, screenName: string) => {
    if (!confirm(`Request a reboot of ${screenName}? The device applies this on its next check-in.`)) return
    setBusyId(screenId)
    setBusyType('reboot')
    try {
      const { error } = await supabase
        .from('screens')
        .update({ reboot_requested: true })
        .eq('id', screenId)
      if (error) throw error
      await logAudit(supabase, {
        actorId: userId,
        action: 'rebooted_device',
        targetType: 'screen',
        targetId: screenId,
        targetLabel: screenName,
      })
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to request reboot.')
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleSimulatePingInline = async (screenId: string) => {
    setBusyId(screenId)
    setBusyType('ping')
    try {
      const res = await fetch(`/api/screens/${screenId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      router.refresh()
    } catch (e: any) {
      console.error(e)
      alert('Failed to simulate ping: ' + e.message)
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('screens').insert({ name, location, zone: zone || location })
      if (error) throw error
      setRegisterOpen(false)
      setName('')
      setLocation('')
      setZone('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to register screen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)] mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green">Hardware Telemetry</span>
            <span className="text-xs font-mono text-[var(--mute)]">Auto-Refresh 5s</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Device Fleet Infrastructure
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-xl mt-1.5 leading-relaxed">
            Monitor real-time display node heartbeats, dispatch forced synchronization commands, and manage physical hardware zones.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center p-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas-stone)]/40">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              Zone Matrix
            </button>
          </div>

          <button
            onClick={() => setRegisterOpen(true)}
            className="cohere-btn-primary"
          >
            <Plus className="w-4 h-4" /> Register Node
          </button>
        </div>
      </div>

      {/* Fleet Telemetry Stats Bar (Soft Stone Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="cohere-card-stone p-5 space-y-1">
          <span className="cohere-mono-label text-[var(--mute)]">Mesh Health</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{onlineRate}%</div>
          <p className="text-xs text-[var(--slate)]">Continuous ping rate</p>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          className={`cohere-card-stone p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'online' ? 'border-[#003c33] dark:border-emerald-500' : ''
          }`}
        >
          <span className="cohere-mono-label text-[var(--cohere-deep-green)] dark:text-emerald-400">Online</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{counts.online}</div>
          <p className="text-xs text-[var(--slate)]">Heartbeat &lt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'stale' ? 'all' : 'stale')}
          className={`cohere-card-stone p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'stale' ? 'border-amber-500' : ''
          }`}
        >
          <span className="cohere-mono-label text-amber-700 dark:text-amber-400">Stale</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{counts.stale}</div>
          <p className="text-xs text-[var(--slate)]">Heartbeat &gt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          className={`cohere-card-stone p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'offline' ? 'border-neutral-500' : ''
          }`}
        >
          <span className="cohere-mono-label text-[var(--mute)]">Offline</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{counts.offline}</div>
          <p className="text-xs text-[var(--slate)]">Heartbeat &gt; 10m</p>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--canvas-inset)] p-1 rounded-xl border border-[var(--hairline)]">
          {(['all', 'online', 'stale', 'offline'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-2xs border border-[var(--hairline)]'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by device, building, or zone..."
            className="pl-9 pr-3.5 py-1.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/20 w-full transition-all"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="geist-card whisper-shadow overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--mute)] text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Device Name</th>
                <th className="px-5 py-3 font-semibold">Location / Zone</th>
                <th className="px-5 py-3 font-semibold">Health Status</th>
                <th className="px-5 py-3 font-semibold">Current Content</th>
                <th className="px-5 py-3 font-semibold">Last Heartbeat</th>
                <th className="px-5 py-3 font-semibold text-right">Device Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--canvas-inset)]/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[var(--ink)]">
                    <Link href={`/dashboard/admin/fleet/${s.id}`} className="hover:text-[#0070f3] transition-colors">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--body)] text-xs">
                    <div>{s.location}</div>
                    <div className="text-[10px] text-[var(--mute)] font-mono">{s.zone || 'General'}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className={`w-2 h-2 rounded-full ${DOT_COLOR[s._status as DeviceStatus]}`} />
                      <span className="capitalize">{s._status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--body)] text-xs truncate max-w-xs">
                    {s.announcements?.title || <span className="text-[var(--faint)] italic">Idle / No Content</span>}
                  </td>
                  <td className="px-5 py-3 text-[var(--mute)] text-xs font-mono" suppressHydrationWarning>
                    {relativeTime(s.last_seen_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(s.id, `id-${s.id}`)}
                        title="Copy Device UUID"
                        className="px-2 py-1 rounded-md hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[10px] font-mono text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        {copiedId === `id-${s.id}` ? '✓ Copied' : 'UUID'}
                      </button>
                      <button
                        onClick={() => handleSimulatePingInline(s.id)}
                        disabled={busyId === s.id}
                        title="Simulate Hardware Heartbeat (Ping)"
                        className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Radio className={`w-3.5 h-3.5 ${busyId === s.id && busyType === 'ping' ? 'animate-ping text-emerald-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleForceRefreshInline(s.id, s.name)}
                        disabled={busyId === s.id}
                        title="Force Refresh Screen"
                        className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-[#0070f3] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${busyId === s.id && busyType === 'refresh' ? 'animate-spin text-[#0070f3]' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRebootInline(s.id, s.name)}
                        disabled={busyId === s.id}
                        title="Reboot Device"
                        className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-rose-600 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Power className={`w-3.5 h-3.5 ${busyId === s.id && busyType === 'reboot' ? 'animate-pulse text-rose-600' : ''}`} />
                      </button>
                      <a
                        href={`/kiosk.html?id=${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0070f3] hover:underline font-semibold inline-flex items-center gap-1 shrink-0 ml-1"
                      >
                        Kiosk <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[var(--mute)]">
                    No screens match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Campus Map - Visual Grid Zone Planner */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(screensByZone).map(([zoneName, screens]) => (
            <div key={zoneName} className="geist-card p-5 whisper-shadow border-[var(--hairline)] flex flex-col">
              <div className="flex items-center gap-2 border-b border-[var(--hairline)] pb-3 mb-4">
                <div className="p-1.5 rounded bg-[var(--canvas-inset)]">
                  <Cpu className="w-4 h-4 text-[var(--mute)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--ink)]">{zoneName}</h3>
                <span className="text-[10px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] px-2 py-0.5 rounded-full font-geist-mono font-semibold">
                  {screens.length} {screens.length === 1 ? 'device' : 'devices'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {screens.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 border rounded-xl flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                      CARD_BORDER_COLOR[s._status as DeviceStatus]
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link href={`/dashboard/admin/fleet/${s.id}`} className="font-semibold text-xs text-[var(--ink)] hover:underline truncate" title={s.name}>
                          {s.name}
                        </Link>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${DOT_COLOR[s._status as DeviceStatus]}`} />
                      </div>
                      
                      <div className="text-[10px] text-[var(--mute)] truncate mb-2">{s.location}</div>

                      <div className="p-2 bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-lg text-[11px] text-[var(--body)] mb-3">
                        <div className="text-[9px] uppercase tracking-wider text-[var(--mute)] font-semibold mb-0.5">Now Playing</div>
                        <div className="truncate font-medium text-[var(--ink)]">
                          {s.announcements?.title || <em className="text-[var(--faint)] font-normal">Idle Rotation</em>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between border-t border-[var(--hairline-soft)] pt-2.5 mt-1 text-[10px] text-[var(--mute)]">
                        <span suppressHydrationWarning>Seen: {relativeTime(s.last_seen_at)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSimulatePingInline(s.id)}
                            disabled={busyId === s.id}
                            title="Simulate Heartbeat (Ping)"
                            className="p-1 rounded hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 cursor-pointer"
                          >
                            <Radio className={`w-3 h-3 ${busyId === s.id && busyType === 'ping' ? 'animate-ping text-emerald-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleForceRefreshInline(s.id, s.name)}
                            disabled={busyId === s.id}
                            title="Force Refresh"
                            className="p-1 rounded hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-[#0070f3] disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${busyId === s.id && busyType === 'refresh' ? 'animate-spin text-[#0070f3]' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleRebootInline(s.id, s.name)}
                            disabled={busyId === s.id}
                            title="Reboot Device"
                            className="p-1 rounded hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                          >
                            <Power className={`w-3 h-3 ${busyId === s.id && busyType === 'reboot' ? 'animate-pulse text-rose-600' : ''}`} />
                          </button>
                          <a
                            href={`/kiosk.html?id=${s.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                            title="Open Kiosk"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(screensByZone).length === 0 && (
            <div className="col-span-full py-12 text-center text-[var(--mute)] geist-card whisper-shadow">
              No screens or zones found matching search criteria.
            </div>
          )}
        </div>
      )}

      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-md floating-shadow">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Register New Screen</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Device name (e.g. SCR-ENG-03)"
                className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:outline-none focus:border-[#0070f3]"
              />
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Eng Lobby)"
                className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:outline-none focus:border-[#0070f3]"
              />
              <input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Zone (defaults to location)"
                className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:outline-none focus:border-[#0070f3]"
              />
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setRegisterOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--mute)] cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--ink)] text-[var(--canvas)] rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer">
                  {saving ? 'Saving…' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
