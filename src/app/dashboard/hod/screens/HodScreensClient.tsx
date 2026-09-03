'use client'

import React, { useState, useEffect } from 'react'
import { Monitor, Eye, Tv, Signal, Clock, MapPin, RefreshCw, Layers } from 'lucide-react'
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
}

export interface ScreenNode {
  id: string
  name: string
  location: string
  zone: string
  resolution: string
  orientation: 'landscape' | 'portrait'
  contents: ScreenContent[]
}

export function HodScreensClient({
  screens,
  departmentName,
}: {
  screens: ScreenNode[]
  departmentName: string
}) {
  const [previewContent, setPreviewContent] = useState<{
    content: ScreenContent
    screenName: string
  } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [slidesState, setSlidesState] = useState<Record<string, { current: number; previous: number | null }>>({})

  // Automated 4-second timed carousel rotation with slide-out-left animation
  useEffect(() => {
    const timer = setInterval(() => {
      setSlidesState((prev) => {
        const next = { ...prev }
        screens.forEach((s) => {
          if (s.contents && s.contents.length > 1) {
            const cur = prev[s.id]?.current ?? 0
            const nextIdx = (cur + 1) % s.contents.length
            next[s.id] = {
              current: nextIdx,
              previous: cur,
            }
          }
        })
        return next
      })
    }, 4000)

    return () => clearInterval(timer)
  }, [screens])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <div className="space-y-8 text-neutral-900 dark:text-white">
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
            Real-time broadcast monitor for the 3 active display nodes. Multiple announcements assigned to the same screen automatically cycle every 4 seconds with smooth slide-left transitions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono inline-flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Screen Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {screens.map((screen) => {
          const count = screen.contents?.length || 0
          const curIndex = count > 0 ? (slidesState[screen.id]?.current ?? 0) % count : 0
          const prevIndex =
            slidesState[screen.id]?.previous !== null && slidesState[screen.id]?.previous !== undefined
              ? slidesState[screen.id].previous! % count
              : null
          const content = count > 0 ? screen.contents[curIndex] : null
          const hasMultiple = count > 1

          return (
            <div
              key={screen.id}
              className="rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-300 dark:hover:border-white/20 transition-all"
            >
              {/* Screen Top Details */}
              <div className="p-5 border-b border-neutral-100 dark:border-white/5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white truncate" title={screen.name}>
                      {screen.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasMultiple && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
                        <Layers className="w-3 h-3" /> {count} Posters
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
                      <Signal className="w-3 h-3" /> Online
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{screen.location} &bull; {screen.zone}</span>
                </div>
              </div>

              {/* Simulated 16:9 Display Screen Frame */}
              <div className="p-5 bg-neutral-100/60 dark:bg-black/40 flex-1 flex flex-col justify-center">
                <div className="aspect-[16/9] w-full rounded-xl bg-black border-2 border-neutral-800 shadow-xl overflow-hidden relative flex flex-col justify-between text-center text-white">
                  {/* Active 4-second timed rotation indicator badge */}
                  {hasMultiple && (
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono text-emerald-400 border border-emerald-500/40 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Poster {curIndex + 1}/{count} (4s)</span>
                    </div>
                  )}

                  {/* Multi-Poster Screen Content with Slide-Out-Left / Slide-In-Right Animation */}
                  {count > 0 ? (
                    screen.contents.map((item, idx) => {
                      const isCurrent = idx === curIndex
                      const isPrevious = idx === prevIndex
                      const shouldRender = isCurrent || isPrevious

                      if (!shouldRender) return null

                      let animClass = ''
                      if (hasMultiple && prevIndex !== null) {
                        if (isCurrent) {
                          animClass = 'poster-slide-enter-right z-10'
                        } else if (isPrevious) {
                          animClass = 'poster-slide-exit-left z-0 pointer-events-none'
                        }
                      }

                      return (
                        <div
                          key={`${item.id || idx}-${idx === curIndex ? 'curr' : 'prev'}`}
                          className={`absolute inset-0 w-full h-full flex flex-col justify-between p-3 text-center text-white ${animClass}`}
                        >
                          {item.attachment_url ? (
                            /* Image Mode: Full Cover, zero text on screen with smooth transition */
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.attachment_url}
                              alt={item.title || screen.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            /* Text Notice Mode */
                            <>
                              <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 truncate relative z-10">
                                {departmentName} &bull; {item.priority?.toUpperCase() || 'ANNOUNCEMENT'}
                              </div>

                              <div className="my-auto relative z-10 px-2">
                                <h4 className="text-xs font-semibold line-clamp-2 text-white">
                                  {item.title}
                                </h4>
                                {item.body && (
                                  <p className="text-[9px] text-neutral-300 line-clamp-2 mt-1">
                                    {item.body}
                                  </p>
                                )}
                              </div>

                              <div className="text-[7px] font-mono text-neutral-500 flex justify-between border-t border-white/10 pt-1 mt-auto relative z-10">
                                <span>CampusCast Engine</span>
                                <span>{screen.resolution}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })
                  ) : (
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
                  )}

                  {/* Carousel Progress Dots at bottom */}
                  {hasMultiple && (
                    <div className="absolute bottom-2.5 inset-x-0 z-20 flex justify-center items-center gap-1.5 pointer-events-none">
                      {screen.contents.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            idx === curIndex
                              ? 'w-4 bg-emerald-400 shadow-sm'
                              : 'w-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Realistic screen glare reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
                </div>
              </div>

              {/* Screen Content Metadata & Action Footer */}
              <div className="p-5 border-t border-neutral-100 dark:border-white/5 space-y-3 bg-white dark:bg-[#141414]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Live Broadcast Content:
                    </span>
                    {hasMultiple && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        Cycles every 4s
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-neutral-900 dark:text-white truncate mt-0.5" title={content?.title || 'No active notice'}>
                    {content?.title || 'Standby Rotation'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-white/5">
                  <span suppressHydrationWarning className="flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                    {formatDuration(content?.display_start, content?.display_end)}
                  </span>
                  <span className="shrink-0 text-[10px] text-neutral-400">{screen.resolution}</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewContent({
                      content: content || { title: screen.name, body: 'Standby rotation' },
                      screenName: screen.name,
                    })
                  }
                  className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-800 dark:text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Current Poster</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Simulator Modal for Selected Screen / Active Poster */}
      {previewContent && (
        <BillboardPreviewModal
          isOpen={!!previewContent}
          onClose={() => setPreviewContent(null)}
          title={previewContent.content.title}
          body={previewContent.content.body || 'Standby rotation mode active.'}
          priority={(previewContent.content.priority as any) || 'routine'}
          departmentName={departmentName}
          attachmentUrl={previewContent.content.attachment_url}
        />
      )}
    </div>
  )
}
