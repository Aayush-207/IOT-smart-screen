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
  Layers,
  Signal,
} from 'lucide-react'
import { deviceStatus, relativeTime, type DeviceStatus } from '@/lib/fleet'
import { logAudit } from '@/lib/audit'
import { PRIORITY_LABEL, type Priority } from '@/lib/priority'

const DOT_COLOR: Record<DeviceStatus, string> = {
  online: 'bg-emerald-400',
  stale: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

function VideoWallScreenCard({ screen, allAnnouncements, isEmergency, emergencyData, aspectMode, isBusy, busyType, onSimulatePing, onForceRefresh, onReboot }: any) {
  const getActiveContentsForScreen = () => {
    if (!allAnnouncements || allAnnouncements.length === 0) return []
    const matches = allAnnouncements.filter((a: any) => {
      if (a.target_all) return true
      if (Array.isArray(a.target_zones) && a.target_zones.length > 0) {
        return a.target_zones.some((z: string) => {
          const zoneStr = String(z || '').trim().toLowerCase()
          return (
            zoneStr === screen.name.toLowerCase() ||
            zoneStr === screen.zone?.toLowerCase() ||
            screen.name.toLowerCase().includes(zoneStr) ||
            screen.zone?.toLowerCase().includes(zoneStr)
          )
        })
      }
      return false
    })
    return matches
  }

  const contents = isEmergency ? [emergencyData] : getActiveContentsForScreen()
  const count = contents.length
  const hasMultiple = count > 1
  const slides = count > 1 ? [...contents, contents[0]] : contents

  const [slideIndex, setSlideIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)

  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setSlideIndex((prev: number) => prev + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [count])

  const handleTransitionEnd = () => {
    if (slideIndex === count) {
      setIsTransitioning(false)
      setSlideIndex(0)
    }
  }

  const activeIndex = count > 0 ? slideIndex % count : 0
  const currentItem = count > 0 ? contents[activeIndex] : null

  return (
    <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg overflow-hidden flex flex-col hover:border-neutral-300 dark:hover:border-white/30 transition-colors">
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLOR[screen._status as DeviceStatus]}`} />
          <Link href={`/dashboard/admin/fleet/${screen.id}`} className="font-normal text-neutral-900 dark:text-white hover:underline truncate" title={screen.name}>
            {screen.name}
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {hasMultiple && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
              <Layers className="w-3 h-3" /> {count}
            </span>
          )}
          <span className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] truncate">
            {screen.zone || screen.location || 'General'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-neutral-50 dark:bg-[#0a0a0a] flex-1 flex flex-col items-center justify-center">
        <div className={`w-full relative rounded-lg border-2 ${isEmergency ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-neutral-200 dark:border-[#212327] shadow-xl'} bg-black overflow-hidden flex flex-col justify-between text-center transition-all select-none ${aspectMode === '16:9' ? 'aspect-[16/9]' : 'aspect-[9/16]'}`}>
          
          {count === 0 ? (
            <div className="my-auto flex flex-col items-center p-2">
              <div className="text-[10px] text-neutral-500 dark:text-[#7d8187] font-mono italic">
                [Idle Standby Loop]
              </div>
            </div>
          ) : (
            <div
              onTransitionEnd={handleTransitionEnd}
              className="w-full h-full flex"
              style={{
                transform: `translate3d(-${slideIndex * 100}%, 0, 0)`,
                transition: isTransitioning ? 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {slides.map((item: any, idx: number) => (
                <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden flex flex-col">
                  {item.attachment_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.attachment_url}
                      alt={item.title || screen.name}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-3 text-center text-neutral-900 dark:text-white">
                      <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400">ONLINE</span>
                        </span>
                        <span className="truncate max-w-[120px]">
                          {isEmergency ? 'EMERGENCY' : PRIORITY_LABEL[item.priority as Priority] || 'Routine'}
                        </span>
                      </div>
                      <div className="my-auto py-2">
                        <h4 className="text-xs font-normal line-clamp-2 px-1 text-neutral-900 dark:text-white leading-snug">
                          {item.title}
                        </h4>
                        {item.body && (
                          <p className="text-[9px] text-neutral-600 dark:text-[#dadbdf] line-clamp-2 mt-1 px-2 font-normal leading-tight">
                            {item.body}
                          </p>
                        )}
                      </div>
                      <div className="text-[7px] font-mono text-neutral-500 dark:text-[#7d8187] flex justify-between border-t border-white/5 pt-1">
                        <span>CampusCast Engine</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasMultiple && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono text-emerald-400 border border-emerald-500/40 shadow-md pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Poster {activeIndex + 1}/{count} (4s)</span>
            </div>
          )}
          {hasMultiple && (
            <div className="absolute bottom-2 inset-x-0 z-20 flex justify-center items-center gap-1.5 pointer-events-none">
              {contents.map((_: any, dotIdx: number) => (
                <span
                  key={dotIdx}
                  className={`h-1 rounded-full transition-all duration-500 ease-out ${
                    dotIdx === activeIndex ? 'w-4 bg-emerald-400 shadow-sm' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
        </div>
      </div>

      <div className="px-3.5 py-2.5 border-t border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] flex items-center justify-between text-xs gap-1">
        <div className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] truncate" suppressHydrationWarning>
          Ping: {relativeTime(screen.last_seen_at)}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onSimulatePing(screen.id)} disabled={isBusy} title="Simulate Hardware Ping" className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white disabled:opacity-50 cursor-pointer transition-colors">
            <Radio className={`w-3 h-3 ${isBusy && busyType === 'ping' ? 'animate-ping text-neutral-900 dark:text-white' : ''}`} />
          </button>
          <button type="button" onClick={() => onForceRefresh(screen.id, screen.name)} disabled={isBusy} title="Force Sync Screen" className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white disabled:opacity-50 cursor-pointer transition-colors">
            <RefreshCw className={`w-3 h-3 ${isBusy && busyType === 'refresh' ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
          </button>
          <button type="button" onClick={() => onReboot(screen.id, screen.name)} disabled={isBusy} title="Reboot Node" className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 cursor-pointer transition-colors">
            <Power className={`w-3 h-3 ${isBusy && busyType === 'reboot' ? 'animate-pulse text-rose-600 dark:text-rose-400' : ''}`} />
          </button>
          <a href={`/kiosk.html?id=${screen.id}`} target="_blank" rel="noreferrer" title="Launch Kiosk Window" className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white cursor-pointer transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

export function VideoWallClient({
  initialScreens,
  activeEmergencies = [],
  allActiveAnnouncements = [],
  userId,
}: {
  initialScreens: any[]
  activeEmergencies?: any[]
  allActiveAnnouncements?: any[]
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
    <div className={`space-y-6 text-neutral-900 dark:text-white ${isFullscreen ? 'p-6 bg-white dark:bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen' : ''}`}>
      {/* Top Video Wall Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              Live Mesh Mirror
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">{counts.online} Nodes Broadcasting</span>
          </div>
          <h1 className="xai-display-section text-neutral-900 dark:text-white flex items-center gap-3">
            <Tv className="w-5 h-5 text-neutral-900 dark:text-white" /> Visual Screen Wall
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Multi-display mirror grid. View real-time output across all campus screen hardware simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center p-1 rounded-full border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414]">
            <button
              onClick={() => setAspectMode('16:9')}
              className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                aspectMode === '16:9'
                  ? 'bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] font-medium'
                  : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> 16:9
            </button>
            <button
              onClick={() => setAspectMode('9:16')}
              className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                aspectMode === '9:16'
                  ? 'bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] font-medium'
                  : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 9:16
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Toggle NOC Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-900 dark:text-white" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Wall'}</span>
          </button>
        </div>
      </div>

      {/* Active Global Override Banner */}
      {activeEmergencies.length > 0 && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/50 flex items-center justify-between gap-4 text-rose-600 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-rose-600 text-white shrink-0 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-rose-500 dark:text-rose-400">Emergency Broadcast Active</span>
              <p className="text-sm font-normal text-rose-900 dark:text-neutral-900 dark:text-white mt-0.5">
                &ldquo;{activeEmergencies[0].body || activeEmergencies[0].title}&rdquo;
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-rose-600 text-white px-3 py-1 rounded-full shrink-0">
            ALL SCREENS OVERRIDDEN
          </span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status and Zone Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badges */}
          <div className="flex items-center p-1 rounded-full border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] text-xs font-mono">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                statusFilter === 'all' ? 'bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] font-medium' : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white'
              }`}
            >
              All ({screens.length})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'online' ? 'bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] font-medium' : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online ({counts.online})
            </button>
            <button
              onClick={() => setStatusFilter('stale')}
              className={`px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'stale' ? 'bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] font-medium' : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Stale ({counts.stale})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === 'offline' ? 'bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] font-medium' : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-neutral-900 dark:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> Offline ({counts.offline})
            </button>
          </div>

          {/* Zone Dropdown */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-white dark:bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-full px-4 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-white font-mono"
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
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 dark:text-[#7d8187]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens or notices…"
            className="w-full bg-white dark:bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-full pl-8 pr-3.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-white font-mono"
          />
        </div>
      </div>

      {/* Live Video Wall Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center border border-neutral-200 dark:border-[#212327] rounded-lg bg-white dark:bg-[#141414] text-neutral-500 dark:text-[#7d8187]">
          <Monitor className="w-8 h-8 mx-auto mb-3 opacity-50 text-neutral-400 dark:text-neutral-500 dark:text-[#7d8187]" />
          <h3 className="text-sm font-normal text-neutral-900 dark:text-white">No Display Screens Found</h3>
          <p className="text-xs max-w-sm mx-auto mt-1 font-mono">
            No screens match the applied zone or status filter.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            aspectMode === '16:9'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {filtered.map((screen) => (
            <VideoWallScreenCard
              key={screen.id}
              screen={screen}
              allAnnouncements={allActiveAnnouncements}
              isEmergency={activeEmergencies.length > 0}
              emergencyData={activeEmergencies.length > 0 ? activeEmergencies[0] : null}
              aspectMode={aspectMode}
              isBusy={busyId === screen.id}
              busyType={busyType}
              onSimulatePing={handleSimulatePing}
              onForceRefresh={handleForceRefresh}
              onReboot={handleReboot}
            />
          ))}
        </div>
      )}
    </div>
  )
}
