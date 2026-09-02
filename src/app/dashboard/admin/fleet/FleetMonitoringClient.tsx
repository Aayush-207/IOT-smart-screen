'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, RefreshCw, Power, Cpu, ExternalLink, Radio } from 'lucide-react'
import { deviceStatus, relativeTime, type DeviceStatus } from '@/lib/fleet'
import { logAudit } from '@/lib/audit'

const DOT_COLOR: Record<DeviceStatus, string> = {
  online: 'bg-[#c2ef4e] shadow-[0_0_8px_rgba(194,239,78,0.8)]',
  stale: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  offline: 'bg-[#4c445c]',
}

const CARD_BORDER_COLOR: Record<DeviceStatus, string> = {
  online: 'border-[#c2ef4e]/30 hover:border-[#c2ef4e] bg-[#150f23]',
  stale: 'border-amber-500/30 hover:border-amber-500 bg-[#150f23]',
  offline: 'border-[#362d59] hover:border-[#6a5fc1] bg-[#150f23]',
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

  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyType, setBusyType] = useState<'refresh' | 'reboot' | 'ping' | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'stale' | 'offline'>('all')

  const supabase = createClient()
  const router = useRouter()

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

  const filtered = useMemo(() => {
    return withStatus.filter((s) => {
      if (statusFilter !== 'all' && s._status !== statusFilter) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.zone && s.zone.toLowerCase().includes(q))
      )
    })
  }, [withStatus, statusFilter, query])

  const screensByZone = useMemo(() => {
    const grouped: Record<string, typeof withStatus> = {}
    filtered.forEach((s) => {
      const z = s.zone || s.location || 'General'
      if (!grouped[z]) grouped[z] = []
      grouped[z].push(s)
    })
    return grouped
  }, [filtered])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !location.trim()) return
    setSaving(true)
    try {
      const { data: newScreen, error } = await supabase
        .from('screens')
        .insert({
          name: name.trim(),
          location: location.trim(),
          zone: zone.trim() || location.trim(),
        })
        .select()
        .single()
      if (error) throw error

      await logAudit(supabase, {
        actorId: userId,
        action: 'registered_screen',
        targetType: 'screen',
        targetId: newScreen.id,
        targetLabel: newScreen.name,
      })

      setName('')
      setLocation('')
      setZone('')
      setRegisterOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to register screen')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSimulatePingInline = async (screenId: string) => {
    setBusyId(screenId)
    setBusyType('ping')
    try {
      await supabase.from('screens').update({ last_seen_at: new Date().toISOString() }).eq('id', screenId)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleForceRefreshInline = async (screenId: string, screenName: string) => {
    setBusyId(screenId)
    setBusyType('refresh')
    try {
      await supabase
        .from('screens')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', screenId)

      await logAudit(supabase, {
        actorId: userId,
        action: 'refreshed_screen',
        targetType: 'screen',
        targetId: screenId,
        targetLabel: screenName,
      })
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleRebootInline = async (screenId: string, screenName: string) => {
    if (!confirm(`Are you sure you want to reboot screen "${screenName}"?`)) return
    setBusyId(screenId)
    setBusyType('reboot')
    try {
      await logAudit(supabase, {
        actorId: userId,
        action: 'rebooted_screen',
        targetType: 'screen',
        targetId: screenId,
        targetLabel: screenName,
      })
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const onlineRate = withStatus.length > 0 ? Math.round((counts.online / withStatus.length) * 100) : 0

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59] mb-6 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">Hardware Telemetry</span>
            <span className="text-xs font-mono text-[#8b8496]">{withStatus.length} Registered Displays</span>
          </div>
          <h1 className="sentry-display-section text-white">
            Screens &amp; Hardware Fleet
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Monitor real-time heartbeats, verify active slide rotations, and remotely reboot displays across campus.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center p-1 rounded-lg border border-[#362d59] bg-[#150f23]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#c2ef4e] text-[#150f23]'
                  : 'text-[#bdb8c0] hover:text-white'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#c2ef4e] text-[#150f23]'
                  : 'text-[#bdb8c0] hover:text-white'
              }`}
            >
              Zone Matrix
            </button>
          </div>

          <button
            onClick={() => setRegisterOpen(true)}
            className="sentry-btn-lime"
          >
            <Plus className="w-4 h-4" /> Add Screen
          </button>
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="sentry-card p-5 space-y-1">
          <span className="sentry-mono-label text-[#8b8496]">Fleet Health</span>
          <div className="text-3xl font-extrabold text-white">{onlineRate}%</div>
          <p className="text-xs text-[#8b8496]">Real-time ping rate</p>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          className={`sentry-card p-5 text-left transition-all cursor-pointer space-y-1 border-[#c2ef4e]/30 ${
            statusFilter === 'online' ? 'border-[#c2ef4e] shadow-[0_0_12px_rgba(194,239,78,0.2)]' : ''
          }`}
        >
          <span className="sentry-mono-label text-[#c2ef4e]">Online</span>
          <div className="text-3xl font-extrabold text-[#c2ef4e]">{counts.online}</div>
          <p className="text-xs text-[#bdb8c0]">Heartbeat &lt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'stale' ? 'all' : 'stale')}
          className={`sentry-card p-5 text-left transition-all cursor-pointer space-y-1 border-amber-500/30 ${
            statusFilter === 'stale' ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : ''
          }`}
        >
          <span className="sentry-mono-label text-amber-400">Delayed Sync</span>
          <div className="text-3xl font-extrabold text-amber-400">{counts.stale}</div>
          <p className="text-xs text-[#bdb8c0]">Heartbeat &gt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          className={`sentry-card p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'offline' ? 'border-white' : ''
          }`}
        >
          <span className="sentry-mono-label text-[#8b8496]">Offline</span>
          <div className="text-3xl font-extrabold text-white">{counts.offline}</div>
          <p className="text-xs text-[#8b8496]">Heartbeat &gt; 10m</p>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#150f23] p-1 rounded-xl border border-[#362d59]">
          {(['all', 'online', 'stale', 'offline'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#c2ef4e] text-[#150f23]'
                  : 'text-[#8b8496] hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8496]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by screen or zone..."
            className="sentry-input pl-9 text-xs"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="sentry-card overflow-hidden">
          <table className="sentry-table text-left text-sm">
            <thead>
              <tr>
                <th>Screen Name</th>
                <th>Location / Zone</th>
                <th>Health Status</th>
                <th>Current Notice</th>
                <th>Last Heartbeat</th>
                <th className="text-right">Screen Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#362d59]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[#1f1633]/60 transition-colors">
                  <td className="px-5 py-3 font-bold text-white">
                    <Link href={`/dashboard/admin/fleet/${s.id}`} className="hover:text-[#c2ef4e] transition-colors">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[#bdb8c0] text-xs">
                    <div className="font-bold text-white">{s.location}</div>
                    <div className="text-[10px] text-[#8b8496] font-mono">{s.zone || 'General'}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <span className={`w-2 h-2 rounded-full ${DOT_COLOR[s._status as DeviceStatus]}`} />
                      <span className="capitalize text-white">{s._status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#bdb8c0] text-xs truncate max-w-xs">
                    {s.announcements?.title || <span className="text-[#8b8496] italic">Idle / Default Loop</span>}
                  </td>
                  <td className="px-5 py-3 text-[#8b8496] text-xs font-mono" suppressHydrationWarning>
                    {relativeTime(s.last_seen_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(s.id, `id-${s.id}`)}
                        title="Copy Screen UUID"
                        className="px-2 py-1 rounded-md hover:bg-[#1f1633] border border-[#362d59] text-[10px] font-mono text-[#8b8496] hover:text-white cursor-pointer"
                      >
                        {copiedId === `id-${s.id}` ? '✓ Copied' : 'UUID'}
                      </button>
                      <button
                        onClick={() => handleSimulatePingInline(s.id)}
                        disabled={busyId === s.id}
                        title="Simulate Hardware Heartbeat (Ping)"
                        className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Radio className={`w-3.5 h-3.5 ${busyId === s.id && busyType === 'ping' ? 'animate-ping text-[#c2ef4e]' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleForceRefreshInline(s.id, s.name)}
                        disabled={busyId === s.id}
                        title="Force Refresh Screen"
                        className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${busyId === s.id && busyType === 'refresh' ? 'animate-spin text-[#c2ef4e]' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRebootInline(s.id, s.name)}
                        disabled={busyId === s.id}
                        title="Reboot Device"
                        className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#fa5252] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Power className={`w-3.5 h-3.5 ${busyId === s.id && busyType === 'reboot' ? 'animate-pulse text-[#fa5252]' : ''}`} />
                      </button>
                      <a
                        href={`/kiosk.html?id=${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#c2ef4e] hover:underline font-bold inline-flex items-center gap-1 shrink-0 ml-1"
                      >
                        Kiosk <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#8b8496]">
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
            <div key={zoneName} className="sentry-card p-5 border-[#362d59] flex flex-col">
              <div className="flex items-center gap-2 border-b border-[#362d59] pb-3 mb-4">
                <div className="p-1.5 rounded bg-[#1f1633]">
                  <Cpu className="w-4 h-4 text-[#c2ef4e]" />
                </div>
                <h3 className="text-sm font-bold text-white">{zoneName}</h3>
                <span className="text-[10px] bg-[#1f1633] border border-[#362d59] text-[#bdb8c0] px-2 py-0.5 rounded-full font-mono font-bold">
                  {screens.length} {screens.length === 1 ? 'screen' : 'screens'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {screens.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 border rounded-xl flex flex-col justify-between transition-all duration-200 shadow-md ${
                      CARD_BORDER_COLOR[s._status as DeviceStatus]
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link href={`/dashboard/admin/fleet/${s.id}`} className="font-bold text-xs text-white hover:text-[#c2ef4e] truncate" title={s.name}>
                          {s.name}
                        </Link>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${DOT_COLOR[s._status as DeviceStatus]}`} />
                      </div>
                      
                      <div className="text-[10px] text-[#8b8496] truncate mb-2">{s.location}</div>

                      <div className="p-2 bg-[#1f1633] border border-[#362d59] rounded-lg text-[11px] text-[#bdb8c0] mb-3">
                        <div className="text-[9px] uppercase tracking-wider text-[#8b8496] font-bold mb-0.5">Now Playing</div>
                        <div className="truncate font-bold text-white">
                          {s.announcements?.title || <em className="text-[#8b8496] font-normal">Idle Loop</em>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between border-t border-[#362d59] pt-2.5 mt-1 text-[10px] text-[#8b8496]">
                        <span suppressHydrationWarning>Seen: {relativeTime(s.last_seen_at)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSimulatePingInline(s.id)}
                            disabled={busyId === s.id}
                            title="Simulate Heartbeat (Ping)"
                            className="p-1 rounded hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] disabled:opacity-50 cursor-pointer"
                          >
                            <Radio className={`w-3 h-3 ${busyId === s.id && busyType === 'ping' ? 'animate-ping text-[#c2ef4e]' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleForceRefreshInline(s.id, s.name)}
                            disabled={busyId === s.id}
                            title="Force Refresh"
                            className="p-1 rounded hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${busyId === s.id && busyType === 'refresh' ? 'animate-spin text-[#c2ef4e]' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleRebootInline(s.id, s.name)}
                            disabled={busyId === s.id}
                            title="Reboot Device"
                            className="p-1 rounded hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#fa5252] disabled:opacity-50 cursor-pointer"
                          >
                            <Power className={`w-3 h-3 ${busyId === s.id && busyType === 'reboot' ? 'animate-pulse text-[#fa5252]' : ''}`} />
                          </button>
                          <a
                            href={`/kiosk.html?id=${s.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] cursor-pointer"
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
            <div className="col-span-full py-12 text-center text-[#8b8496] sentry-card">
              No screens found matching search criteria.
            </div>
          )}
        </div>
      )}

      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150f23] rounded-2xl border border-[#362d59] p-6 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white mb-4">Register New Display</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Screen name (e.g. SCR-ENG-03)"
                className="sentry-input text-xs"
              />
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Engineering Lobby)"
                className="sentry-input text-xs"
              />
              <input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Zone (e.g. Engineering Wing)"
                className="sentry-input text-xs"
              />
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setRegisterOpen(false)} className="px-4 py-2 text-xs font-bold text-[#8b8496] hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="sentry-btn-lime text-xs cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving…' : 'Register Screen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
