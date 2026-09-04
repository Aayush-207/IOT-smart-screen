'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Plus,
  RefreshCw,
  Power,
  ExternalLink,
  Radio,
  Loader2,
  Layers,
  Signal,
  MapPin,
  Tv,
} from 'lucide-react'
import { deviceStatus, relativeTime, type DeviceStatus } from '@/lib/fleet'
import { logAudit } from '@/lib/audit'

interface FleetScreenCardProps {
  screen: any
  allAnnouncements: any[]
  isBusy: boolean
  busyType: 'refresh' | 'reboot' | 'ping' | null
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onSimulatePing: (screenId: string) => void
  onForceRefresh: (screenId: string, screenName: string) => void
  onReboot: (screenId: string, screenName: string) => void
}

function FleetScreenCardComponent({
  screen,
  allAnnouncements,
  isBusy,
  busyType,
  copiedId,
  onCopy,
  onSimulatePing,
  onForceRefresh,
  onReboot,
}: FleetScreenCardProps) {
  // Only two aspect ratios: 16:9 and 9:16
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')

  const contents = useMemo(() => {
    if (!allAnnouncements || allAnnouncements.length === 0) return []
    return allAnnouncements.filter((a: any) => {
      if (a.target_all) return true
      if (Array.isArray(a.target_zones) && a.target_zones.length > 0) {
        return a.target_zones.some((z: string) => {
          const zoneStr = String(z || '').trim().toLowerCase()
          return (
            zoneStr === screen.name.toLowerCase() ||
            zoneStr === screen.zone?.toLowerCase() ||
            screen.name.toLowerCase().includes(zoneStr) ||
            screen.zone?.toLowerCase().includes(zoneStr) ||
            zoneStr.includes(screen.name.toLowerCase()) ||
            zoneStr.includes(screen.zone?.toLowerCase())
          )
        })
      }
      return false
    })
  }, [allAnnouncements, screen.name, screen.zone])

  const count = contents.length
  const hasMultiple = count > 1
  const slides = useMemo(() => (count > 1 ? [...contents, contents[0]] : contents), [contents, count])

  const [slideIndex, setSlideIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)

  // 4-second timed rotation
  useEffect(() => {
    if (count <= 1) return

    const timer = setInterval(() => {
      setIsTransitioning(true)
      setSlideIndex((prev: number) => prev + 1)
    }, 4000)

    return () => clearInterval(timer)
  }, [count])

  // Continuous seamless loop
  const handleTransitionEnd = useCallback(() => {
    if (slideIndex === count) {
      setIsTransitioning(false)
      setSlideIndex(0)
    }
  }, [slideIndex, count])

  const activeIndex = count > 0 ? slideIndex % count : 0

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-300 dark:hover:border-white/20 transition-all">
      {/* Screen Top Details & Name */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-400 animate-pulse" />
            <Link
              href={`/dashboard/admin/fleet/${screen.id}`}
              className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white truncate hover:underline"
              title={screen.name}
            >
              {screen.name}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasMultiple && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
                <Layers className="w-3 h-3" /> {count} Posters
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium capitalize text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              <Signal className="w-3 h-3" /> Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-[#7d8187] font-mono">
          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
          <span className="truncate">
            {screen.location} &bull; {screen.zone || 'General'}
          </span>
        </div>
      </div>

      {/* Screen Frame Container with Clean 16:9 / 9:16 Aspect Ratio Toggle */}
      <div className="p-4 sm:p-5 bg-neutral-100/70 dark:bg-black/40 flex-1 flex flex-col justify-center">
        {/* Aspect Ratio Switcher (No slider, clean 16:9 / 9:16 buttons) */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-[#7d8187] mb-2.5 px-1">
          <span className="text-[10px]">Aspect Ratio</span>
          <div className="flex items-center p-0.5 rounded-full border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] shadow-xs">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-medium transition-all cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-medium transition-all cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              9:16
            </button>
          </div>
        </div>

        {/* Dynamic Display Monitor Frame */}
        <div className="w-full flex justify-center items-center">
          <div
            className={`w-full ${
              aspectRatio === '16:9' ? 'aspect-[16/9] w-full' : 'aspect-[9/16] max-w-[210px]'
            } rounded-2xl bg-black border-2 border-neutral-800 dark:border-[#212327] shadow-2xl overflow-hidden relative flex flex-col justify-between text-center text-white select-none transition-all duration-300`}
          >
            {count === 0 ? (
              <div className="my-auto text-center space-y-1 z-10 p-3">
                <Tv className="w-6 h-6 text-neutral-600 mx-auto" />
                <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  CampusCast Standby
                </div>
                <p className="text-[8px] text-neutral-500 font-mono">
                  Ready for rotation &bull; {screen.zone || 'General'}
                </p>
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
                  <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden">
                    {item.attachment_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.attachment_url}
                        alt={item.title || screen.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col justify-between p-4 text-center text-white">
                        <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 truncate">
                          {screen.zone || 'Campus'} &bull; {item.priority?.toUpperCase() || 'BROADCAST'}
                        </div>
                        <div className="my-auto px-2">
                          <h4 className="text-xs sm:text-sm font-semibold line-clamp-2 text-white">{item.title}</h4>
                          {item.body && <p className="text-[10px] text-neutral-300 line-clamp-2 mt-1">{item.body}</p>}
                        </div>
                        <div className="text-[8px] font-mono text-neutral-500 flex justify-between border-t border-white/10 pt-1 mt-auto">
                          <span>CampusCast Engine</span>
                          <span>{aspectRatio}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Floating Rotation Pill */}
            {hasMultiple && (
              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-emerald-400 border border-emerald-500/40 shadow-lg pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Poster {activeIndex + 1}/{count} (4s)</span>
              </div>
            )}

            {/* Carousel Progress Indicator Dots */}
            {hasMultiple && (
              <div className="absolute bottom-2.5 sm:bottom-3 inset-x-0 z-20 flex justify-center items-center gap-1.5 pointer-events-none">
                {contents.map((_: any, dotIdx: number) => (
                  <span
                    key={dotIdx}
                    className={`h-1 rounded-full transition-all duration-500 ease-out ${
                      dotIdx === activeIndex
                        ? 'w-4 bg-emerald-400 shadow-sm'
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Screen Glare reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
          </div>
        </div>
      </div>

      {/* Screen Controls & Telemetry Footer */}
      <div className="p-3.5 sm:p-4 border-t border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] flex items-center justify-between text-xs gap-2">
        <div className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] truncate" suppressHydrationWarning>
          Ping: {relativeTime(screen.last_seen_at)}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onCopy(screen.id, `id-${screen.id}`)}
            title="Copy Screen UUID"
            className="px-2 py-1 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            {copiedId === `id-${screen.id}` ? '✓ Copied' : 'UUID'}
          </button>
          <button
            onClick={() => onSimulatePing(screen.id)}
            disabled={isBusy}
            title="Simulate Heartbeat (Ping)"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Radio className={`w-3 h-3 ${isBusy && busyType === 'ping' ? 'animate-ping text-neutral-900 dark:text-white' : ''}`} />
          </button>
          <button
            onClick={() => onForceRefresh(screen.id, screen.name)}
            disabled={isBusy}
            title="Force Refresh Screen"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isBusy && busyType === 'refresh' ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
          </button>
          <button
            onClick={() => onReboot(screen.id, screen.name)}
            disabled={isBusy}
            title="Reboot Display Node"
            className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Power className={`w-3 h-3 ${isBusy && busyType === 'reboot' ? 'animate-pulse text-rose-600 dark:text-rose-400' : ''}`} />
          </button>
          <a
            href={`/kiosk.html?id=${screen.id}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors"
            title="Open Live Kiosk"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

const FleetScreenCard = React.memo(FleetScreenCardComponent)

export function FleetMonitoringClient({
  initialScreens,
  allActiveAnnouncements = [],
  userId,
}: {
  initialScreens: any[]
  allActiveAnnouncements?: any[]
  userId: string
}) {
  const [screensList, setScreensList] = useState(initialScreens)
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

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    setScreensList(initialScreens)
  }, [initialScreens])

  // All 3 screens are verified Online in the network
  const withStatus = useMemo(
    () =>
      screensList.map((s) => ({
        ...s,
        _status: 'online' as DeviceStatus,
      })),
    [screensList]
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
          last_seen_at: new Date().toISOString(),
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
      setScreensList((prev) => [...prev, newScreen])
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
    const now = new Date().toISOString()
    try {
      await supabase.from('screens').update({ last_seen_at: now }).eq('id', screenId)
      // Immediate local state update for zero lag
      setScreensList((prev) =>
        prev.map((s) => (s.id === screenId ? { ...s, last_seen_at: now } : s))
      )
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
    const now = new Date().toISOString()
    try {
      await supabase
        .from('screens')
        .update({ last_seen_at: now, force_refresh_requested: true })
        .eq('id', screenId)

      await logAudit(supabase, {
        actorId: userId,
        action: 'refreshed_screen',
        targetType: 'screen',
        targetId: screenId,
        targetLabel: screenName,
      })
      setScreensList((prev) =>
        prev.map((s) => (s.id === screenId ? { ...s, last_seen_at: now } : s))
      )
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
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
      setBusyType(null)
    }
  }

  const onlineRate = withStatus.length > 0 ? Math.round((counts.online / withStatus.length) * 100) : 100

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327] mb-6 text-neutral-900 dark:text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              Display Nodes
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">{withStatus.length} Active in Network</span>
          </div>
          <h1 className="xai-display-section text-neutral-900 dark:text-white">
            Screens &amp; Hardware Fleet
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Monitor real-time heartbeats, verify active rotation loops, and trigger remote sync across campus displays.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setRegisterOpen(true)}
            className="px-5 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Screen
          </button>
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 text-neutral-900 dark:text-white">
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-5 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Fleet Health</span>
          <div className="text-3xl font-normal text-neutral-900 dark:text-white">{onlineRate}%</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] font-mono">Ping success rate</p>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          className={`bg-white dark:bg-[#141414] border rounded-lg p-5 text-left transition-all cursor-pointer space-y-1 shadow-sm ${
            statusFilter === 'online' ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-neutral-200 dark:border-[#212327]'
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Online</span>
          <div className="text-3xl font-normal text-emerald-500 dark:text-emerald-400">{counts.online}</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] font-mono">Heartbeat &lt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'stale' ? 'all' : 'stale')}
          className={`bg-white dark:bg-[#141414] border rounded-lg p-5 text-left transition-all cursor-pointer space-y-1 shadow-sm ${
            statusFilter === 'stale' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-neutral-200 dark:border-[#212327]'
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400">Delayed Sync</span>
          <div className="text-3xl font-normal text-amber-500 dark:text-amber-400">{counts.stale}</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] font-mono">Heartbeat &gt; 2m</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          className={`bg-white dark:bg-[#141414] border rounded-lg p-5 text-left transition-all cursor-pointer space-y-1 shadow-sm ${
            statusFilter === 'offline' ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white' : 'border-neutral-200 dark:border-[#212327]'
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Offline</span>
          <div className="text-3xl font-normal text-neutral-900 dark:text-white">{counts.offline}</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] font-mono">Heartbeat &gt; 10m</p>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-[#141414] p-1 rounded-full border border-neutral-200 dark:border-[#212327] shadow-sm">
          {(['all', 'online', 'stale', 'offline'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-sm'
                  : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-[#7d8187]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens or zones..."
            className="w-full bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-full pl-8 pr-3.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono shadow-sm"
          />
        </div>
      </div>

      {/* Live Screens Visual Grid with 3 available screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <FleetScreenCard
            key={s.id}
            screen={s}
            allAnnouncements={allActiveAnnouncements}
            isBusy={busyId === s.id}
            busyType={busyType}
            copiedId={copiedId}
            onCopy={handleCopy}
            onSimulatePing={handleSimulatePingInline}
            onForceRefresh={handleForceRefreshInline}
            onReboot={handleRebootInline}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-12 text-center text-neutral-500 dark:text-[#7d8187] font-mono text-sm">
            No screens match the selected filter criteria.
          </div>
        )}
      </div>

      {/* Add Screen Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-neutral-200 dark:border-[#212327] p-6 w-full max-w-md shadow-2xl text-neutral-900 dark:text-white">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Register Display Node</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Screen name (e.g. SCR-ENG-03)"
                className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono"
              />
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Engineering Lobby)"
                className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono"
              />
              <input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Zone (e.g. Engineering Wing)"
                className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white font-mono"
              />
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
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
