'use client'

import React, { useState } from 'react'
import { Monitor, Eye, Tv, Signal, Clock, MapPin, RefreshCw } from 'lucide-react'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'
import { formatDuration } from '@/lib/dateUtils'

interface ScreenNode {
  id: string
  name: string
  location: string
  zone: string
  resolution: string
  orientation: 'landscape' | 'portrait'
  activeContent: {
    title: string
    body?: string
    attachment_url?: string | null
    display_start?: string | null
    display_end?: string | null
    priority?: string
  } | null
}

export function HodScreensClient({
  screens,
  departmentName,
}: {
  screens: ScreenNode[]
  departmentName: string
}) {
  const [selectedScreen, setSelectedScreen] = useState<ScreenNode | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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
            Real-time feed for the 3 active display nodes. Monitor the physical hardware status, target zones, and live content broadcasted to each screen.
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
          const content = screen.activeContent
          const hasImage = Boolean(content?.attachment_url)

          return (
            <div
              key={screen.id}
              className="rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-300 dark:hover:border-white/20 transition-all"
            >
              {/* Screen Top Details */}
              <div className="p-5 border-b border-neutral-100 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                      {screen.name}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Signal className="w-3 h-3" /> 100% ONLINE
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{screen.location} &bull; {screen.zone}</span>
                </div>
              </div>

              {/* Simulated 16:9 Display Screen Frame */}
              <div className="p-5 bg-neutral-100/60 dark:bg-black/40 flex-1 flex flex-col justify-center">
                <div className="aspect-[16/9] w-full rounded-xl bg-black border-2 border-neutral-800 shadow-xl overflow-hidden relative flex flex-col justify-between p-3 text-center text-white">
                  {hasImage ? (
                    /* Image Mode: Full Cover, zero text on screen */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={content!.attachment_url!}
                      alt={content?.title || screen.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : content ? (
                    /* Text Notice Mode */
                    <>
                      <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 truncate relative z-10">
                        {departmentName} &bull; {content.priority?.toUpperCase() || 'ANNOUNCEMENT'}
                      </div>

                      <div className="my-auto relative z-10 px-2">
                        <h4 className="text-xs font-semibold line-clamp-2 text-white">
                          {content.title}
                        </h4>
                        {content.body && (
                          <p className="text-[9px] text-neutral-300 line-clamp-2 mt-1">
                            {content.body}
                          </p>
                        )}
                      </div>

                      <div className="text-[7px] font-mono text-neutral-500 flex justify-between border-t border-white/10 pt-1 mt-auto relative z-10">
                        <span>CampusCast Engine</span>
                        <span>{screen.resolution}</span>
                      </div>
                    </>
                  ) : (
                    /* Standby / Idle Broadcast Screen */
                    <div className="my-auto text-center space-y-1 z-10">
                      <Tv className="w-6 h-6 text-neutral-600 mx-auto" />
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                        CampusCast Standby
                      </div>
                      <p className="text-[8px] text-neutral-500 font-mono">
                        Ready for rotation &bull; {screen.zone}
                      </p>
                    </div>
                  )}

                  {/* Realistic screen glare reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                </div>
              </div>

              {/* Screen Content Metadata & Action Footer */}
              <div className="p-5 border-t border-neutral-100 dark:border-white/5 space-y-3 bg-white dark:bg-[#141414]">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Live Broadcast Content:
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
                  onClick={() => setSelectedScreen(screen)}
                  className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-800 dark:text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Full Simulator</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Simulator Modal for Selected Screen */}
      {selectedScreen && (
        <BillboardPreviewModal
          isOpen={!!selectedScreen}
          onClose={() => setSelectedScreen(null)}
          title={selectedScreen.activeContent?.title || selectedScreen.name}
          body={selectedScreen.activeContent?.body || 'No text content. Standby rotation mode active.'}
          priority={selectedScreen.activeContent?.priority as any || 'routine'}
          departmentName={departmentName}
          attachmentUrl={selectedScreen.activeContent?.attachment_url}
        />
      )}
    </div>
  )
}
