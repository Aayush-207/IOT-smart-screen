'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Power,
  ExternalLink,
  Search,
  Radio,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tv,
} from 'lucide-react'
import { deviceStatus, relativeTime, type DeviceStatus } from '@/lib/fleet'
import { logAudit } from '@/lib/audit'
import { PRIORITY_LABEL, type Priority } from '@/lib/priority'

const DOT_COLOR: Record<DeviceStatus, string> = {
  online: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
  stale: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
  offline: 'bg-neutral-500',
}

export function VideoWallClient({
  initialScreens,
  activeEmergencies = [],
  userId,
}: {
  initialScreens: any[]
  activeEmergencies?: any[]
  userId: string
}) {
  const [screens] = useState(initialScreens)
  const [query, setQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'stale' | 'offline'>('all')
  const [aspectMode, setAspectMode] = useState<'16:9' | '9:16'>('16:9')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyType, setBusyType] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Live periodic refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  // Track fullscreen changes
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const screensWithStatus = useMemo(() => {
    return screens.map((s) => ({
      ...s,
      _status: deviceStatus(s.last_seen_at) as DeviceStatus,
    }))
  }, [screens])

  const zones = useMemo(() => {
    const zSet = new Set<string>()
    screens.forEach((s) => {
      if (s.zone) zSet.add(s.zone)
    })
    return Array.from(zSet).sort()
  }, [screens])

  const counts = useMemo(() => {
    const c: Record<DeviceStatus, number> = { online: 0, stale: 0, offline: 0 }
    screensWithStatus.forEach((s) => {
      c[s._status as DeviceStatus]++
    })
    return c
  }, [screensWithStatus])

  const healthRate = screens.length > 0 ? Math.round((counts.online / screens.length) * 100) : 0

  const filtered = screensWithStatus.filter((s) => {
    if (selectedZone !== 'all' && s.zone !== selectedZone) return false
    if (statusFilter !== 'all' && s._status !== statusFilter) return false
    if (!query) return true
    const haystack = `${s.name} ${s.location} ${s.zone || ''} ${s.announcements?.title || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  const handleSimulatePing = async (screenId: string) => {
    setBusyId(screenId)
    setBusyType('ping')
    try {
      const res = await fetch(`/api/screens/${screenId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      router.refresh()
    } catch (e: any) {
      console.error(e)
      alert('Failed to ping device: ' + e.message)
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleForceRefresh = async (screenId: string, screenName: string) => {
    setBusyId(screenId)
    setBusyType('refresh')
    try {
      const { error } = await supabase.from('screens').update({ force_refresh_requested: true }).eq('id', screenId)
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
      alert('Failed to request force sync.')
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const handleReboot = async (screenId: string, screenName: string) => {
    if (!confirm(`Reboot ${screenName}? Device will execute on next heartbeat.`)) return
    setBusyId(screenId)
    setBusyType('reboot')
    try {
      const { error } = await supabase.from('screens').update({ reboot_requested: true }).eq('id', screenId)
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
      alert('Failed to reboot device.')
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top NOC Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" /> NOC Display Wall
            </span>
            <span className="text-xs font-mono text-[var(--mute)]">Mesh Health: {healthRate}%</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              ● Live Sync 5s
            </span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Command Center Virtual Signage Wall
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-2xl mt-1.5 leading-relaxed">
            Real-time visual monitoring wall mirroring all digital signage screens campus-wide. Watch live announcement rotations, verify emergency override propagation, and execute remote hardware commands.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center p-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas-stone)]/40">
            <button
              onClick={() => setAspectMode('16:9')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                aspectMode === '16:9'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> 16:9 Landscape
            </button>
            <button
              onClick={() => setAspectMode('9:16')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                aspectMode === '9:16'
                  ? 'bg-[var(--cohere-near-black)] text-white shadow-xs'
                  : 'text-[var(--slate)] hover:text-[var(--ink)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 9:16 Portrait
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="cohere-btn-pill-outline text-xs flex items-center gap-1.5 cursor-pointer"
            title="Toggle NOC Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'NOC Wall View'}</span>
          </button>
        </div>
      </div>

      {/* Active Global Override Banner */}
      {activeEmergencies.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="cohere-mono-label text-rose-700 dark:text-rose-300 uppercase">Emergency Override Active</span>
              <p className="text-sm font-semibold text-[var(--ink)] mt-0.5">
                &ldquo;{activeEmergencies[0].body || activeEmergencies[0].title}&rdquo;
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-rose-600 text-white px-3 py-1 rounded-full shrink-0">
            ALL SCREENS OVERRIDDEN
          </span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status and Zone Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badges */}
          <div className="flex items-center p-1 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-inset)] text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                statusFilter === 'all' ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-2xs' : 'text-[var(--mute)]'
              }`}
            >
              All ({screens.length})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'online' ? 'bg-[var(--canvas-elevated)] text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-[var(--mute)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online ({counts.online})
            </button>
            <button
              onClick={() => setStatusFilter('stale')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'stale' ? 'bg-[var(--canvas-elevated)] text-amber-600 shadow-2xs' : 'text-[var(--mute)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Stale ({counts.stale})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'offline' ? 'bg-[var(--canvas-elevated)] text-neutral-400 shadow-2xs' : 'text-[var(--mute)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-neutral-400" /> Offline ({counts.offline})
            </button>
          </div>

          {/* Zone Dropdown */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-1.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#0070f3]"
          >
            <option value="all">All Campus Zones ({zones.length})</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens, locations, or titles…"
            className="pl-9 pr-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)] w-full"
          />
        </div>
      </div>

      {/* Live Video Wall Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center border border-[var(--hairline)] rounded-2xl bg-[var(--canvas-stone)]/30 text-[var(--slate)]">
          <Monitor className="w-8 h-8 mx-auto mb-3 text-[var(--mute)] opacity-50" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">No Display Nodes Found</h3>
          <p className="text-xs max-w-sm mx-auto mt-1">
            No screens match the applied zone or status filter.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            aspectMode === '16:9'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {filtered.map((screen) => {
            const current = screen.announcements
            const isEmergency = current?.is_emergency
            const isBusy = busyId === screen.id

            return (
              <div
                key={screen.id}
                className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Node Title Header */}
                <div className="px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--canvas-stone)]/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[screen._status as DeviceStatus]}`} />
                    <Link
                      href={`/dashboard/admin/fleet/${screen.id}`}
                      className="font-semibold text-[var(--ink)] hover:text-[#0070f3] truncate"
                      title={screen.name}
                    >
                      {screen.name}
                    </Link>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--mute)] shrink-0 ml-2">
                    {screen.zone || screen.location || 'General'}
                  </span>
                </div>

                {/* Simulated Screen Mirror Frame */}
                <div className="p-3 bg-[var(--canvas-inset)] flex-1 flex flex-col items-center justify-center">
                  <div
                    className={`w-full relative rounded-xl border-4 border-neutral-900 bg-black overflow-hidden flex flex-col justify-between p-3 text-center transition-all ${
                      aspectMode === '16:9' ? 'aspect-[16/9]' : 'aspect-[9/16]'
                    } ${
                      isEmergency
                        ? 'bg-radial from-rose-950 to-black text-rose-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'text-white'
                    }`}
                  >
                    {/* Top Screen Status Line */}
                    <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Node Live</span>
                      </span>
                      <span className="truncate max-w-[120px]">
                        {isEmergency
                          ? '🚨 EMERGENCY'
                          : current
                          ? PRIORITY_LABEL[current.priority as Priority] || 'Routine'
                          : 'STANDBY'}
                      </span>
                    </div>

                    {/* Content Display Body */}
                    <div className="my-auto py-2">
                      {current?.attachment_url && (
                        <div className="mb-2 max-h-16 flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={current.attachment_url}
                            alt="Visual"
                            className="max-h-16 object-contain rounded-md border border-white/10"
                          />
                        </div>
                      )}
                      {current ? (
                        <div>
                          <h4 className="text-xs font-bold line-clamp-2 px-1 text-white leading-snug">
                            {current.title}
                          </h4>
                          {current.body && (
                            <p className="text-[9px] text-neutral-300 line-clamp-2 mt-1 px-2 font-normal leading-tight">
                              {current.body}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-neutral-500 font-mono italic">
                          [Display Node Idle / Standby]
                        </div>
                      )}
                    </div>

                    {/* Bottom Screen Kiosk Sub-Bar */}
                    <div className="text-[7px] font-mono text-neutral-500 flex justify-between border-t border-white/5 pt-1">
                      <span>CampusCast Display Engine</span>
                      <span suppressHydrationWarning>{relativeTime(screen.last_seen_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Node Control Footer */}
                <div className="px-3.5 py-2.5 border-t border-[var(--hairline)] bg-[var(--canvas)] flex items-center justify-between text-xs gap-1">
                  <div className="text-[10px] font-mono text-[var(--mute)] truncate" suppressHydrationWarning>
                    Heartbeat: {relativeTime(screen.last_seen_at)}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSimulatePing(screen.id)}
                      disabled={isBusy}
                      title="Simulate Hardware Ping (Check-in)"
                      className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          isBusy && busyType === 'ping' ? 'animate-ping text-emerald-500' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForceRefresh(screen.id, screen.name)}
                      disabled={isBusy}
                      title="Force Sync / Refresh Screen"
                      className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-[#0070f3] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isBusy && busyType === 'refresh' ? 'animate-spin text-[#0070f3]' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReboot(screen.id, screen.name)}
                      disabled={isBusy}
                      title="Reboot Node"
                      className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-rose-600 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <Power
                        className={`w-3.5 h-3.5 ${
                          isBusy && busyType === 'reboot' ? 'animate-pulse text-rose-600' : ''
                        }`}
                      />
                    </button>
                    <a
                      href={`/kiosk.html?id=${screen.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Launch Kiosk Window"
                      className="p-1.5 rounded-lg hover:bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
