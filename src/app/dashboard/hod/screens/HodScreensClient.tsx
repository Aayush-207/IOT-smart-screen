'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Tv,
  Clock,
  MapPin,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
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
 * Minimal, simple, and elegant Screen Node Card
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

  // 5-second timed rotation with smooth, luxurious 1300ms transition
  useEffect(() => {
    if (count <= 1 || !screen.isOnline) return

    const timer = setInterval(() => {
      setIsTransitioning(true)
      setSlideIndex((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(timer)
  }, [count, screen.isOnline, syncKey])

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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-slate-300 transition-all duration-200 flex flex-col justify-between shadow-2xs">
      {/* Screen Header Info */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                screen.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <h3
              className="text-sm font-semibold text-slate-900 truncate"
              title={screen.name}
            >
              {screen.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 pl-4">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">
              {screen.location} &bull; {screen.zone}
            </span>
          </div>
        </div>

        {/* Minimal status & aspect ratio switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {/* Sliding pill indicator */}
            <div
              className={`absolute inset-y-0.5 rounded-md bg-white shadow-2xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                aspectRatio === '16:9'
                  ? 'left-0.5 w-[calc(50%-2px)]'
                  : 'left-[calc(50%+1px)] w-[calc(50%-2px)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`relative z-10 px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-200 cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`relative z-10 px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-200 cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              9:16
            </button>
          </div>
        </div>
      </div>

      {/* Display Screen Frame with butter-smooth dimensions */}
      <div className="my-auto py-2 flex flex-col items-center justify-center min-h-[250px] sm:min-h-[270px]">
        <div
          className={`relative rounded-xl bg-slate-950 border border-slate-900 overflow-hidden shadow-xs flex flex-col justify-between text-center text-white select-none mx-auto transition-[width,height,max-width,max-height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            aspectRatio === '16:9'
              ? 'w-full max-w-[380px] h-[195px] sm:h-[214px]'
              : 'w-[145px] sm:w-[155px] h-[258px] sm:h-[275px]'
          }`}
        >
          {!screen.isOnline ? (
            /* Offline Display Screen */
            <div className="my-auto text-center space-y-1.5 z-10 p-4">
              <WifiOff className="w-5 h-5 text-slate-600 mx-auto" />
              <div className="text-[11px] text-slate-400 font-medium">
                Offline
              </div>
              <p className="text-[9px] text-slate-500">
                Disconnected from network
              </p>
            </div>
          ) : count === 0 ? (
            /* Standby / Idle Broadcast Screen */
            <div className="my-auto text-center space-y-1 z-10 p-4">
              <Tv className="w-5 h-5 text-slate-500 mx-auto" />
              <div className="text-[11px] text-slate-300 font-medium">
                Standby
              </div>
              <p className="text-[9px] text-slate-500">
                Awaiting broadcasts
              </p>
            </div>
          ) : (
            /* Hardware-Accelerated Sliding Track */
            <div
              onTransitionEnd={handleTransitionEnd}
              className="w-full h-full flex"
              style={{
                transform: `translate3d(-${slideIndex * 100}%, 0, 0)`,
                transition: isTransitioning
                  ? 'transform 1300ms cubic-bezier(0.25, 1, 0.5, 1)'
                  : 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {slides.map((item, idx) => (
                <div
                  key={idx}
                  className="w-full h-full shrink-0 relative overflow-hidden bg-black flex items-center justify-center"
                >
                  {item.attachment_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.attachment_url}
                      alt={item.title || screen.name}
                      className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-1000 ease-out"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-3.5 text-center text-white bg-slate-900">
                      <div className="text-[9px] font-medium uppercase tracking-wider text-slate-400 truncate">
                        {item.department_name || departmentName}
                      </div>
                      <div className="my-auto px-2">
                        <h4 className="text-xs font-medium line-clamp-2 text-white">
                          {item.title}
                        </h4>
                        {item.body && (
                          <p className="text-[9px] text-slate-300 line-clamp-2 mt-1">
                            {item.body}
                          </p>
                        )}
                      </div>
                      <div className="text-[8px] text-slate-500 flex justify-between border-t border-white/10 pt-1 mt-auto">
                        <span>CampusCast</span>
                        <span>{aspectRatio}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Indicators & Poster Count Just Below the Screen (Not on the screen) */}
        {screen.isOnline && count > 0 && (
          <div
            className={`flex items-center justify-between mt-3 px-1 text-xs text-slate-500 transition-[width,max-width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] mx-auto ${
              aspectRatio === '16:9' ? 'w-full max-w-[380px]' : 'w-[145px] sm:w-[155px]'
            }`}
          >
            {/* Dots representing current poster with smooth glide */}
            <div className="flex items-center gap-1.5">
              {contents.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                    dotIdx === activeIndex
                      ? 'w-5 bg-[#4c1d76] shadow-2xs'
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Poster count */}
            <span className="text-[11px] font-medium text-slate-500">
              {hasMultiple
                ? `${count} posters · ${activeIndex + 1} of ${count}`
                : '1 poster'}
            </span>
          </div>
        )}
      </div>

      {/* Screen Content Info & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Animated event title with visually stunning reveal */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            key={activeIndex}
            style={{
              animation: 'eventReveal 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div
              className="text-xs font-semibold text-slate-900 truncate tracking-tight flex items-center gap-1.5"
              title={
                screen.isOnline
                  ? currentContent?.title || 'Standby Rotation'
                  : 'Offline'
              }
            >
              {screen.isOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4c1d76] shrink-0" />
              )}
              <span className="truncate">
                {screen.isOnline
                  ? currentContent?.title || 'Standby Rotation'
                  : 'Offline'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate pl-3">
              <Clock className="w-3 h-3 shrink-0 text-[#4c1d76]/70" />
              <span suppressHydrationWarning className="truncate">
                {screen.isOnline
                  ? formatDuration(
                      currentContent?.display_start,
                      currentContent?.display_end
                    )
                  : 'Hardware Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {screen.isOnline && hasMultiple && (
            <button
              type="button"
              onClick={handleSync}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sync rotation timer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={!screen.isOnline}
            onClick={() =>
              onInspect(
                currentContent || {
                  title: screen.name,
                  body: 'Standby rotation',
                }
              )
            }
            className="px-3 py-1.5 rounded-lg bg-[#4c1d76] hover:bg-[#3b145c] text-white text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
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

  const onlineCount = screens.filter((s) => s.isOnline).length

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in-up pb-12 font-[family-name:var(--font-inter)]">
      <style>{`
        @keyframes eventReveal {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
            filter: blur(3px);
          }
          60% {
            opacity: 0.85;
            filter: blur(0.5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>

      {/* Lean, Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Display Screens
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {departmentName} &bull; {onlineCount} of {screens.length} screens online
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-500 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Screen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
