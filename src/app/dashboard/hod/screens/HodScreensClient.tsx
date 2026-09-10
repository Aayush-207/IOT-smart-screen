'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Eye, Tv, Signal, Clock, MapPin, RefreshCw, Layers, WifiOff } from 'lucide-react'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'
import { formatDuration } from '@/lib/dateUtils'

export interface ScreenContent {
  id?: string
  title: string
  body?: string
  attachment_url?: string | null
  display_start?: string | null
  display_end?: string | null
  priority?: string
  department_name?: string
}

export interface ScreenNode {
  id: string
  name: string
  location: string
  zone: string
  resolution: string
  orientation: 'landscape' | 'portrait'
  isOnline?: boolean
  contents: ScreenContent[]
}

/**
 * Self-contained Screen Node Card with hardware-accelerated GPU slide carousel
 * and clean 16:9 / 9:16 aspect ratio switcher
 */
function ScreenNodeCard({
  screen,
  departmentName,
  onInspect,
}: {
  screen: ScreenNode
  departmentName: string
  onInspect: (content: ScreenContent) => void
}) {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const contents = screen.contents || []
  const count = contents.length
  const hasMultiple = count > 1

  // Continuous loop track: clone first poster to the end
  const slides = count > 1 ? [...contents, contents[0]] : contents

  const [slideIndex, setSlideIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [syncKey, setSyncKey] = useState(0)

  // 4-second timed rotation
  useEffect(() => {
    if (count <= 1 || !screen.isOnline) return

    const timer = setInterval(() => {
      setIsTransitioning(true)
      setSlideIndex((prev) => prev + 1)
    }, 4000)

    return () => clearInterval(timer)
  }, [count, screen.isOnline, syncKey])

  // When transition to the cloned last slide finishes, jump back to index 0 with 0ms transition
  const handleTransitionEnd = () => {
    if (slideIndex === count) {
      setIsTransitioning(false)
      setSlideIndex(0)
    }
  }

  const handleSync = () => {
    setIsTransitioning(false)
    setSlideIndex(0)
    setSyncKey((prev) => prev + 1)
  }

  const activeIndex = count > 0 ? slideIndex % count : 0
  const currentContent = count > 0 ? contents[activeIndex] : null

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-300 dark:hover:border-white/20 transition-all card-hover">
      {/* Screen Top Details */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {screen.isOnline ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#00eaff] animate-pulse shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" />
            )}
            <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white truncate" title={screen.name}>
              {screen.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {screen.isOnline && hasMultiple && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
                <Layers className="w-3 h-3" /> {count} Posters
              </span>
            )}
            {screen.isOnline ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00eaff] dark:text-[#00eaff] bg-[#00eaff]/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
                <Signal className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
                <WifiOff className="w-3 h-3 text-neutral-400" /> Offline
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-[#7d8187] font-mono">
          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
          <span className="truncate">{screen.location} &bull; {screen.zone}</span>
        </div>
      </div>

      {/* Simulated Display Screen Frame with 16:9 / 9:16 Aspect Ratio Toggle */}
      <div className="p-4 sm:p-5 bg-neutral-100/70 dark:bg-black/40 flex-1 flex flex-col justify-center">
        {/* Aspect Ratio Switcher (clean 16:9 / 9:16 buttons) */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-[#7d8187] mb-2.5 px-1">
          <span className="text-[10px]">Aspect Ratio</span>
          <div className="flex items-center p-0.5 rounded-full border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] shadow-xs">
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`px-2.5 py-1 text-[10px] rounded-full transition-all cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-[#7d8187] dark:hover:text-white'
              }`}
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`px-2.5 py-1 text-[10px] rounded-full transition-all cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-[#7d8187] dark:hover:text-white'
              }`}
            >
              9:16
            </button>
          </div>
        </div>

        {/* Screen Display Frame */}
        <div
          className={`transition-all duration-300 relative rounded-xl bg-black border-2 border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between text-center text-white select-none mx-auto ${
            aspectRatio === '16:9'
              ? 'w-full aspect-[16/9]'
              : 'w-[180px] sm:w-[200px] aspect-[9/16]'
          }`}
        >
          {!screen.isOnline ? (
            /* Offline Display Screen */
            <div className="my-auto text-center space-y-1.5 z-10 p-4">
              <Tv className="w-8 h-8 text-neutral-600 mx-auto opacity-50" />
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                Node Offline
              </div>
              <p className="text-[8px] text-neutral-500 font-mono">
                Hardware display disconnected &bull; {screen.zone}
              </p>
            </div>
          ) : count === 0 ? (
            /* Standby / Idle Broadcast Screen */
            <div className="my-auto text-center space-y-1 z-10 p-3">
              <Tv className="w-6 h-6 text-neutral-600 mx-auto" />
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                CampusCast Standby
              </div>
              <p className="text-[8px] text-neutral-500 font-mono">
                Ready for rotation &bull; {screen.zone}
              </p>
            </div>
          ) : (
            /* Hardware-Accelerated Sliding Track */
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
              {slides.map((item, idx) => (
                <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden bg-black flex items-center justify-center">
                  {item.attachment_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.attachment_url}
                      alt={item.title || screen.name}
                      className="w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-3 text-center text-white">
                      <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 truncate">
                        {item.department_name || departmentName} &bull; {item.priority?.toUpperCase() || 'ANNOUNCEMENT'}
                      </div>
                      <div className="my-auto px-2">
                        <h4 className="text-xs font-semibold line-clamp-2 text-white">{item.title}</h4>
                        {item.body && <p className="text-[9px] text-neutral-300 line-clamp-2 mt-1">{item.body}</p>}
                      </div>
                      <div className="text-[7px] font-mono text-neutral-500 flex justify-between border-t border-white/10 pt-1 mt-auto">
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
          {screen.isOnline && hasMultiple && (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono text-[#00eaff] border border-[#00eaff]/40 shadow-md pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00eaff] animate-pulse" />
              <span>Poster {activeIndex + 1}/{count} (4s)</span>
            </div>
          )}

          {/* Carousel Progress Dots */}
          {screen.isOnline && hasMultiple && (
            <div className="absolute bottom-2.5 inset-x-0 z-20 flex justify-center items-center gap-1.5 pointer-events-none">
              {contents.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={`h-1 rounded-full transition-all duration-500 ease-out ${
                    dotIdx === activeIndex
                      ? 'w-4 bg-[#00eaff] shadow-sm'
                      : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Screen glare reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
        </div>
      </div>

      {/* Screen Content Metadata & Action Footer */}
      <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-[#212327] space-y-3 bg-white dark:bg-[#141414]">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Live Broadcast Content:
            </span>
            {screen.isOnline && hasMultiple && (
              <span className="text-[10px] font-mono text-[#00eaff] dark:text-[#00eaff] font-medium">
                Cycles every 4s
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate mt-0.5" title={screen.isOnline ? (currentContent?.title || 'Standby Rotation') : 'Offline (Disconnected)'}>
            {screen.isOnline ? (currentContent?.title || 'Standby Rotation') : 'Offline (Disconnected)'}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-[#7d8187] pt-1 border-t border-neutral-100 dark:border-[#212327]">
          <span suppressHydrationWarning className="flex items-center gap-1 truncate">
            <Clock className="w-3 h-3 text-[#af1591] shrink-0" />
            {screen.isOnline ? formatDuration(currentContent?.display_start, currentContent?.display_end) : 'Hardware Standby'}
          </span>
          <span className="shrink-0 text-[10px]">{aspectRatio === '16:9' ? '1672x941 (16:9)' : '941x1672 (9:16)'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!screen.isOnline}
            onClick={() =>
              onInspect(currentContent || { title: screen.name, body: 'Standby rotation' })
            }
            className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-800 dark:text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer btn-press disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{screen.isOnline ? 'Inspect' : 'Offline'}</span>
          </button>

          <button
            type="button"
            disabled={!screen.isOnline || !hasMultiple}
            onClick={handleSync}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-800 dark:text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer btn-press disabled:opacity-40 disabled:cursor-not-allowed"
            title="Sync Rotation Timer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function HodScreensClient({
  screens,
  departmentName,
}: {
  screens: ScreenNode[]
  departmentName: string
}) {
  const router = useRouter()
  const [inspectContent, setInspectContent] = useState<ScreenContent | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <div className="space-y-8 text-neutral-900 dark:text-white animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              {departmentName}
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">
              Hardware Node Network
            </span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">
            Department Display Screens
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-2xl mt-1.5 leading-relaxed">
            Real-time broadcast monitor for the active display node. Display nodes offline are isolated from the broadcast loop.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono inline-flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-sm btn-press"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Screen Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {screens.map((screen) => (
          <ScreenNodeCard
            key={screen.id}
            screen={screen}
            departmentName={departmentName}
            onInspect={(content) => setInspectContent(content)}
          />
        ))}
      </div>

      {/* Simulator Modal for Inspected Content */}
      {inspectContent && (
        <BillboardPreviewModal
          isOpen={!!inspectContent}
          onClose={() => setInspectContent(null)}
          title={inspectContent.title}
          body={inspectContent.body || 'Standby rotation mode active.'}
          priority={(inspectContent.priority as any) || 'routine'}
          departmentName={inspectContent.department_name || departmentName}
          attachmentUrl={inspectContent.attachment_url}
        />
      )}
    </div>
  )
}
