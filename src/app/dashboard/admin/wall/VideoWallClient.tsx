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
  online: 'bg-[#c2ef4e] shadow-[0_0_8px_rgba(194,239,78,0.8)]',
  stale: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  offline: 'bg-[#4c445c]',
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

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const withStatus = useMemo(() => {
    return screens.map((s) => ({
      ...s,
      _status: deviceStatus(s.last_seen_at),
    }))
  }, [screens])

  const counts = useMemo(() => {
    const c = { online: 0, stale: 0, offline: 0 }
    withStatus.forEach((s) => {
      c[s._status as DeviceStatus]++
    })
    return c
  }, [withStatus])

  const zones = useMemo(() => {
    const set = new Set<string>()
    screens.forEach((s) => {
      if (s.zone) set.add(s.zone)
      else if (s.location) set.add(s.location)
    })
    return Array.from(set).sort()
  }, [screens])

  const filtered = useMemo(() => {
    return withStatus.filter((s) => {
      if (statusFilter !== 'all' && s._status !== statusFilter) return false
      if (selectedZone !== 'all' && s.zone !== selectedZone && s.location !== selectedZone) {
        return false
      }
      if (!query.trim()) return true
      const q = query.toLowerCase()
      const title = s.announcements?.title?.toLowerCase() || ''
      const loc = s.location?.toLowerCase() || ''
      const name = s.name?.toLowerCase() || ''
      const zone = s.zone?.toLowerCase() || ''
      return name.includes(q) || loc.includes(q) || zone.includes(q) || title.includes(q)
    })
  }, [withStatus, statusFilter, selectedZone, query])

  const handleSimulatePing = async (screenId: string) => {
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

  const handleForceRefresh = async (screenId: string, screenName: string) => {
    setBusyId(screenId)
    setBusyType('refresh')
    try {
      await supabase.from('screens').update({ last_seen_at: new Date().toISOString() }).eq('id', screenId)
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

  const handleReboot = async (screenId: string, screenName: string) => {
    if (!confirm(`Reboot screen "${screenName}"?`)) return
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

  return (
    <div className={`space-y-6 text-white ${isFullscreen ? 'p-6 bg-[#1f1633] min-h-screen' : ''}`}>
      {/* Top Video Wall Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">Real-time Stream</span>
            <span className="text-xs font-mono text-[#8b8496]">{counts.online} Screens Broadcasting</span>
          </div>
          <h1 className="sentry-display-section text-white flex items-center gap-3">
            <Tv className="w-6 h-6 text-[#c2ef4e]" /> Live Visual Screen Wall
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Multi-display mirror grid. View real-time visual output across all campus TVs and kiosks simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center p-1 rounded-lg border border-[#362d59] bg-[#150f23]">
            <button
              onClick={() => setAspectMode('16:9')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                aspectMode === '16:9'
                  ? 'bg-[#c2ef4e] text-[#150f23]'
                  : 'text-[#8b8496] hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> 16:9 Horizontal
            </button>
            <button
              onClick={() => setAspectMode('9:16')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                aspectMode === '9:16'
                  ? 'bg-[#c2ef4e] text-[#150f23]'
                  : 'text-[#8b8496] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 9:16 Vertical
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="sentry-btn-outline text-xs flex items-center gap-1.5 cursor-pointer"
            title="Toggle NOC Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-[#c2ef4e]" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Wall'}</span>
          </button>
        </div>
      </div>

      {/* Active Global Override Banner */}
      {activeEmergencies.length > 0 && (
        <div className="p-4 rounded-xl bg-[#fa5252]/15 border border-[#fa5252]/50 flex items-center justify-between gap-4 text-[#fa5252]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#fa5252] text-white shrink-0 animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="sentry-mono-label text-[#fa5252]">Emergency Override Active</span>
              <p className="text-sm font-bold text-white mt-0.5">
                &ldquo;{activeEmergencies[0].body || activeEmergencies[0].title}&rdquo;
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-[#fa5252] text-white px-3 py-1 rounded-full shrink-0">
            ALL SCREENS OVERRIDDEN
          </span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status and Zone Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badges */}
          <div className="flex items-center p-1 rounded-xl border border-[#362d59] bg-[#150f23] text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                statusFilter === 'all' ? 'bg-[#c2ef4e] text-[#150f23]' : 'text-[#8b8496] hover:text-white'
              }`}
            >
              All ({screens.length})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'online' ? 'bg-[#c2ef4e] text-[#150f23]' : 'text-[#8b8496] hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#c2ef4e]" /> Online ({counts.online})
            </button>
            <button
              onClick={() => setStatusFilter('stale')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'stale' ? 'bg-[#c2ef4e] text-[#150f23]' : 'text-[#8b8496] hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Stale ({counts.stale})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'offline' ? 'bg-[#c2ef4e] text-[#150f23]' : 'text-[#8b8496] hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#4c445c]" /> Offline ({counts.offline})
            </button>
          </div>

          {/* Zone Dropdown */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="sentry-input text-xs"
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8496]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens, locations, or titles…"
            className="sentry-input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Live Video Wall Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center border border-[#362d59] rounded-2xl bg-[#150f23] text-[#8b8496]">
          <Monitor className="w-8 h-8 mx-auto mb-3 opacity-50 text-[#8b8496]" />
          <h3 className="text-sm font-bold text-white">No Display Screens Found</h3>
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
                className="sentry-card overflow-hidden shadow-lg flex flex-col"
              >
                {/* Node Title Header */}
                <div className="px-4 py-2.5 border-b border-[#362d59] bg-[#1f1633]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[screen._status as DeviceStatus]}`} />
                    <Link
                      href={`/dashboard/admin/fleet/${screen.id}`}
                      className="font-bold text-white hover:text-[#c2ef4e] truncate"
                      title={screen.name}
                    >
                      {screen.name}
                    </Link>
                  </div>
                  <span className="text-[10px] font-mono text-[#8b8496] shrink-0 ml-2">
                    {screen.zone || screen.location || 'General'}
                  </span>
                </div>

                {/* Simulated Screen Mirror Frame */}
                <div className="p-3 bg-[#140e21] flex-1 flex flex-col items-center justify-center">
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
                    <div className="text-[8px] font-mono uppercase tracking-widest text-[#8b8496] flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c2ef4e] animate-pulse" />
                        <span className="text-[#c2ef4e] font-bold">LIVE DISPLAY</span>
                      </span>
                      <span className="truncate max-w-[120px] font-bold">
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
                            <p className="text-[9px] text-[#bdb8c0] line-clamp-2 mt-1 px-2 font-normal leading-tight">
                              {current.body}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#8b8496] font-mono italic">
                          [Screen Idle &bull; Standby]
                        </div>
                      )}
                    </div>

                    {/* Bottom Screen Kiosk Sub-Bar */}
                    <div className="text-[7px] font-mono text-[#8b8496] flex justify-between border-t border-white/5 pt-1">
                      <span>CampusCast Display Engine</span>
                      <span suppressHydrationWarning>{relativeTime(screen.last_seen_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Node Control Footer */}
                <div className="px-3.5 py-2.5 border-t border-[#362d59] bg-[#150f23] flex items-center justify-between text-xs gap-1">
                  <div className="text-[10px] font-mono text-[#8b8496] truncate" suppressHydrationWarning>
                    Heartbeat: {relativeTime(screen.last_seen_at)}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSimulatePing(screen.id)}
                      disabled={isBusy}
                      title="Simulate Hardware Ping (Check-in)"
                      className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          isBusy && busyType === 'ping' ? 'animate-ping text-[#c2ef4e]' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForceRefresh(screen.id, screen.name)}
                      disabled={isBusy}
                      title="Force Sync / Refresh Screen"
                      className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isBusy && busyType === 'refresh' ? 'animate-spin text-[#c2ef4e]' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReboot(screen.id, screen.name)}
                      disabled={isBusy}
                      title="Reboot Node"
                      className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#fa5252] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <Power
                        className={`w-3.5 h-3.5 ${
                          isBusy && busyType === 'reboot' ? 'animate-pulse text-[#fa5252]' : ''
                        }`}
                      />
                    </button>
                    <a
                      href={`/kiosk.html?id=${screen.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Launch Kiosk Window"
                      className="p-1.5 rounded-lg hover:bg-[#1f1633] border border-[#362d59] text-[#8b8496] hover:text-[#c2ef4e] cursor-pointer transition-colors"
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
