'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, RefreshCw, Power, Cpu, ExternalLink, Radio, Loader2 } from 'lucide-react'
import { deviceStatus, relativeTime, type DeviceStatus } from '@/lib/fleet'
import { logAudit } from '@/lib/audit'

const DOT_COLOR: Record<DeviceStatus, string> = {
  online: 'bg-emerald-400',
  stale: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

const CARD_BORDER_COLOR: Record<DeviceStatus, string> = {
  online: 'border-emerald-500/20 hover:border-emerald-500/50 bg-[#141414]',
  stale: 'border-amber-500/20 hover:border-amber-500/50 bg-[#141414]',
  offline: 'border-[#212327] hover:border-white/30 bg-[#141414]',
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#212327] mb-6 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              Display Nodes
            </span>
            <span className="text-xs font-mono text-[#7d8187]">{withStatus.length} Active in Network</span>
          </div>
          <h1 className="xai-display-section text-white">
            Screens &amp; Hardware Fleet
          </h1>
          <p className="text-sm text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Monitor real-time heartbeats, verify active rotation loops, and trigger remote sync across campus displays.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center p-1 rounded-full border border-[#212327] bg-[#141414]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#0a0a0a] font-medium'
                  : 'text-[#dadbdf] hover:text-white'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-[#0a0a0a] font-medium'
                  : 'text-[#dadbdf] hover:text-white'
              }`}
            >
              Zone Matrix
            </button>
          </div>

          <button
            onClick={() => setRegisterOpen(true)}
            className="px-5 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Screen
          </button>
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 text-white">
        <div className="bg-[#141414] border border-[#212327] rounded-lg p-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">Fleet Health</span>
          <div className="text-3xl font-normal text-white">{onlineRate}%</div>
          <p className="text-xs text-[#7d8187] font-mono">Ping success rate</p>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          className={`bg-[#141414] border rounded-lg p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'online' ? 'border-emerald-400' : 'border-[#212327]'
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Online</span>
          <div className="text-3xl font-normal text-emerald-400">{counts.online}</div>
          <p className="text-xs text-[#7d8187] font-mono">Heartbeat &lt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'stale' ? 'all' : 'stale')}
          className={`bg-[#141414] border rounded-lg p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'stale' ? 'border-amber-400' : 'border-[#212327]'
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">Delayed Sync</span>
          <div className="text-3xl font-normal text-amber-400">{counts.stale}</div>
          <p className="text-xs text-[#7d8187] font-mono">Heartbeat &gt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          className={`bg-[#141414] border rounded-lg p-5 text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'offline' ? 'border-white' : 'border-[#212327]'
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">Offline</span>
          <div className="text-3xl font-normal text-white">{counts.offline}</div>
          <p className="text-xs text-[#7d8187] font-mono">Heartbeat &gt; 10m</p>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-[#141414] p-1 rounded-full border border-[#212327]">
          {(['all', 'online', 'stale', 'offline'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-[#0a0a0a] font-medium'
                  : 'text-[#7d8187] hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8187]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens or zones..."
            className="w-full bg-[#0a0a0a] border border-[#212327] rounded-full pl-8 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-[#141414] border border-[#212327] rounded-lg overflow-hidden">
          <table className="xai-table text-left text-sm">
            <thead>
              <tr>
                <th>Screen Node</th>
                <th>Location / Zone</th>
                <th>Health Status</th>
                <th>Current Notice</th>
                <th>Last Heartbeat</th>
                <th className="text-right">Screen Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212327]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-normal text-white">
                    <Link href={`/dashboard/admin/fleet/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[#dadbdf] text-xs">
                    <div className="text-white">{s.location}</div>
                    <div className="text-[10px] text-[#7d8187] font-mono">{s.zone || 'General'}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[s._status as DeviceStatus]}`} />
                      <span className="capitalize text-white">{s._status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#dadbdf] text-xs truncate max-w-xs">
                    {s.announcements?.title || <span className="text-[#7d8187] italic font-mono">[Idle Standby Loop]</span>}
                  </td>
                  <td className="px-5 py-3 text-[#7d8187] text-xs font-mono" suppressHydrationWarning>
                    {relativeTime(s.last_seen_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(s.id, `id-${s.id}`)}
                        title="Copy Screen UUID"
                        className="px-2 py-1 rounded-full hover:bg-white/10 border border-[#212327] text-[10px] font-mono text-[#7d8187] hover:text-white cursor-pointer"
                      >
                        {copiedId === `id-${s.id}` ? '✓ Copied' : 'UUID'}
                      </button>
                      <button
                        onClick={() => handleSimulatePingInline(s.id)}
                        disabled={busyId === s.id}
                        title="Simulate Hardware Heartbeat (Ping)"
                        className="p-1.5 rounded-full hover:bg-white/10 border border-[#212327] text-[#7d8187] hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Radio className={`w-3 h-3 ${busyId === s.id && busyType === 'ping' ? 'animate-ping text-white' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleForceRefreshInline(s.id, s.name)}
                        disabled={busyId === s.id}
                        title="Force Refresh Screen"
                        className="p-1.5 rounded-full hover:bg-white/10 border border-[#212327] text-[#7d8187] hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${busyId === s.id && busyType === 'refresh' ? 'animate-spin text-white' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRebootInline(s.id, s.name)}
                        disabled={busyId === s.id}
                        title="Reboot Device"
                        className="p-1.5 rounded-full hover:bg-rose-500/10 border border-[#212327] text-[#7d8187] hover:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Power className={`w-3 h-3 ${busyId === s.id && busyType === 'reboot' ? 'animate-pulse text-rose-400' : ''}`} />
                      </button>
                      <a
                        href={`/kiosk.html?id=${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-white hover:underline font-mono inline-flex items-center gap-1 shrink-0 ml-1"
                      >
                        Kiosk <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#7d8187]">
                    No screens match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Campus Map - Visual Grid Zone Planner */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Object.entries(screensByZone).map(([zoneName, screens]) => (
            <div key={zoneName} className="bg-[#141414] rounded-lg p-5 border border-[#212327] flex flex-col">
              <div className="flex items-center gap-2 border-b border-[#212327] pb-3 mb-4">
                <div className="p-1.5 rounded-full bg-white/5 border border-[#212327]">
                  <Cpu className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-normal text-white">{zoneName}</h3>
                <span className="text-[10px] bg-[#0a0a0a] border border-[#212327] text-[#7d8187] px-2 py-0.5 rounded-full font-mono">
                  {screens.length} {screens.length === 1 ? 'node' : 'nodes'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {screens.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 border rounded-lg flex flex-col justify-between transition-colors ${
                      CARD_BORDER_COLOR[s._status as DeviceStatus]
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link href={`/dashboard/admin/fleet/${s.id}`} className="font-normal text-xs text-white hover:underline truncate" title={s.name}>
                          {s.name}
                        </Link>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${DOT_COLOR[s._status as DeviceStatus]}`} />
                      </div>
                      
                      <div className="text-[10px] text-[#7d8187] truncate mb-2 font-mono">{s.location}</div>

                      <div className="p-2 bg-[#0a0a0a] border border-[#212327] rounded-md text-[11px] text-[#dadbdf] mb-3">
                        <div className="text-[9px] uppercase tracking-wider text-[#7d8187] font-mono mb-0.5">Now Playing</div>
                        <div className="truncate text-white">
                          {s.announcements?.title || <em className="text-[#7d8187] font-normal">[Standby Loop]</em>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between border-t border-[#212327] pt-2 mt-1 text-[10px] text-[#7d8187] font-mono">
                        <span suppressHydrationWarning>{relativeTime(s.last_seen_at)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSimulatePingInline(s.id)}
                            disabled={busyId === s.id}
                            title="Simulate Heartbeat"
                            className="p-1 rounded-full hover:bg-white/10 border border-[#212327] text-[#7d8187] hover:text-white disabled:opacity-50 cursor-pointer"
                          >
                            <Radio className={`w-3 h-3 ${busyId === s.id && busyType === 'ping' ? 'animate-ping text-white' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleForceRefreshInline(s.id, s.name)}
                            disabled={busyId === s.id}
                            title="Force Refresh"
                            className="p-1 rounded-full hover:bg-white/10 border border-[#212327] text-[#7d8187] hover:text-white disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${busyId === s.id && busyType === 'refresh' ? 'animate-spin text-white' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleRebootInline(s.id, s.name)}
                            disabled={busyId === s.id}
                            title="Reboot Node"
                            className="p-1 rounded-full hover:bg-rose-500/10 border border-[#212327] text-[#7d8187] hover:text-rose-400 disabled:opacity-50 cursor-pointer"
                          >
                            <Power className={`w-3 h-3 ${busyId === s.id && busyType === 'reboot' ? 'animate-pulse text-rose-400' : ''}`} />
                          </button>
                          <a
                            href={`/kiosk.html?id=${s.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-full hover:bg-white/10 border border-[#212327] text-[#7d8187] hover:text-white cursor-pointer"
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
        </div>
      )}

      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141414] rounded-xl border border-[#212327] p-6 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-sm font-normal text-white mb-4">Register Display Node</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Screen name (e.g. SCR-ENG-03)"
                className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Engineering Lobby)"
                className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
              <input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Zone (e.g. Engineering Wing)"
                className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
              <div className="flex gap-2.5 justify-end pt-2">
                <button type="button" onClick={() => setRegisterOpen(false)} className="px-4 py-1.5 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-1.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 cursor-pointer disabled:opacity-50 transition-colors inline-flex items-center gap-1.5">
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering…</span>
                    </>
                  ) : (
                    <span>Register Node</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
