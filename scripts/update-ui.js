const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/admin/wall/VideoWallClient.tsx', 'utf8');

// 1. Add lucide imports
code = code.replace(/Tv,\n} from 'lucide-react'/, "Tv,\n  Layers,\n  Signal,\n} from 'lucide-react'");

// 2. Add allActiveAnnouncements to VideoWallClient props
code = code.replace(
  /initialScreens,\n  activeEmergencies = \[\],\n  userId,\n}: {\n  initialScreens: any\[\]\n  activeEmergencies\?: any\[\]\n  userId: string\n}/,
  `initialScreens,
  activeEmergencies = [],
  allActiveAnnouncements = [],
  userId,
}: {
  initialScreens: any[]
  activeEmergencies?: any[]
  allActiveAnnouncements?: any[]
  userId: string
}`
);

// 3. Inject VideoWallScreenCard before export function VideoWallClient
const screenCardCode = `
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

  const [slideIndex, React_setSlideIndex] = React.useState(0)
  const [isTransitioning, React_setIsTransitioning] = React.useState(true)

  React.useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => {
      React_setIsTransitioning(true)
      React_setSlideIndex((prev: number) => prev + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [count])

  const handleTransitionEnd = () => {
    if (slideIndex === count) {
      React_setIsTransitioning(false)
      React_setSlideIndex(0)
    }
  }

  const activeIndex = count > 0 ? slideIndex % count : 0
  const current = count > 0 ? contents[activeIndex] : null

  return (
    <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg overflow-hidden flex flex-col hover:border-neutral-300 dark:hover:border-white/30 transition-colors">
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={\`w-1.5 h-1.5 rounded-full shrink-0 \${DOT_COLOR[screen._status as DeviceStatus]}\`} />
          <Link href={\`/dashboard/admin/fleet/\${screen.id}\`} className="font-normal text-neutral-900 dark:text-white hover:underline truncate" title={screen.name}>
            {screen.name}
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {hasMultiple && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium">
              <Layers className="w-3 h-3" /> {count} Posters
            </span>
          )}
          <span className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] truncate">
            {screen.zone || screen.location || 'General'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-neutral-50 dark:bg-[#0a0a0a] flex-1 flex flex-col items-center justify-center">
        <div className={\`w-full relative rounded-lg border-2 \${isEmergency ? 'border-rose-500/50' : 'border-[#212327]'} bg-black overflow-hidden flex flex-col justify-between text-center transition-all select-none \${aspectMode === '16:9' ? 'aspect-[16/9]' : 'aspect-[9/16]'}\`}>
          
          {count === 0 ? (
            <div className="my-auto flex flex-col items-center p-2">
              <div className="text-[10px] text-[#7d8187] font-mono italic">
                [Idle Standby Loop]
              </div>
            </div>
          ) : (
            <div
              onTransitionEnd={handleTransitionEnd}
              className="w-full h-full flex"
              style={{
                transform: \`translate3d(-\${slideIndex * 100}%, 0, 0)\`,
                transition: isTransitioning ? 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {slides.map((item: any, idx: number) => (
                <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden flex flex-col">
                  {item.attachment_url ? (
                    <img
                      src={item.attachment_url}
                      alt={item.title || screen.name}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-3 text-center text-white">
                      <div className="text-[8px] font-mono uppercase tracking-widest text-[#7d8187] flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400">ONLINE</span>
                        </span>
                        <span className="truncate max-w-[120px]">
                          {isEmergency ? 'EMERGENCY' : PRIORITY_LABEL[item.priority as Priority] || 'Routine'}
                        </span>
                      </div>
                      <div className="my-auto py-2">
                        <h4 className="text-xs font-normal line-clamp-2 px-1 text-white leading-snug">
                          {item.title}
                        </h4>
                        {item.body && (
                          <p className="text-[9px] text-[#dadbdf] line-clamp-2 mt-1 px-2 font-normal leading-tight">
                            {item.body}
                          </p>
                        )}
                      </div>
                      <div className="text-[7px] font-mono text-[#7d8187] flex justify-between border-t border-white/5 pt-1">
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
                  className={\`h-1 rounded-full transition-all duration-500 ease-out \${
                    dotIdx === activeIndex ? 'w-4 bg-emerald-400 shadow-sm' : 'w-1.5 bg-white/50'
                  }\`}
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
          <button type="button" onClick={() => onSimulatePing(screen.id)} disabled={isBusy} title="Simulate Hardware Ping" className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 cursor-pointer transition-colors">
            <Radio className={\`w-3 h-3 \${isBusy && busyType === 'ping' ? 'animate-ping text-neutral-900 dark:text-white' : ''}\`} />
          </button>
          <button type="button" onClick={() => onForceRefresh(screen.id, screen.name)} disabled={isBusy} title="Force Sync Screen" className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 cursor-pointer transition-colors">
            <RefreshCw className={\`w-3 h-3 \${isBusy && busyType === 'refresh' ? 'animate-spin text-neutral-900 dark:text-white' : ''}\`} />
          </button>
          <button type="button" onClick={() => onReboot(screen.id, screen.name)} disabled={isBusy} title="Reboot Node" className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 cursor-pointer transition-colors">
            <Power className={\`w-3 h-3 \${isBusy && busyType === 'reboot' ? 'animate-pulse text-rose-600 dark:text-rose-400' : ''}\`} />
          </button>
          <a href={\`/kiosk.html?id=\${screen.id}\`} target="_blank" rel="noreferrer" title="Launch Kiosk Window" className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
`;

code = code.replace(/export function VideoWallClient/, screenCardCode + '\nexport function VideoWallClient');

// 4. Replace the map logic with the new component
const mapReplacement = `
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
`;

const mapStartIndex = code.indexOf('{filtered.map((screen) => {');
const mapEndIndex = code.indexOf('          })}');

if (mapStartIndex !== -1 && mapEndIndex !== -1) {
  code = code.substring(0, mapStartIndex) + mapReplacement + code.substring(mapEndIndex + 13);
}

fs.writeFileSync('src/app/dashboard/admin/wall/VideoWallClient.tsx', code);
console.log('Update complete.');
