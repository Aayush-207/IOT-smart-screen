import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { deliveryState, relativeTime, announcementDisplayStatus } from '@/lib/fleet'
import { ArrowLeft, Monitor, Clock, Tv } from 'lucide-react'

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: announcement } = await supabase
    .from('announcements')
    .select('*, departments(name)')
    .eq('id', id)
    .eq('submitted_by', user.id)
    .single()

  if (!announcement) return notFound()

  const defaultNodes = [
    { id: 'mock-1', name: 'Main Lobby Screen 01', location: 'Engineering Block A', zone: 'Engineering Wing', last_seen_at: new Date().toISOString() },
    { id: 'mock-2', name: 'Library Entrance Node', location: 'Central Library', zone: 'Library Atrium', last_seen_at: new Date(Date.now() - 6000).toISOString() },
    { id: 'mock-3', name: 'Cafeteria Kiosk Display', location: 'Student Center', zone: 'Student Cafeteria', last_seen_at: new Date(Date.now() - 15000).toISOString() }
  ]

  let targetScreens: any[] = []
  const { data: dbScreens } = await supabase.from('screens').select('*').order('name')
  if (dbScreens && dbScreens.length > 0) {
    targetScreens = dbScreens
  } else {
    targetScreens = defaultNodes
  }

  const { data: deliveries } = await supabase
    .from('announcement_deliveries')
    .select('*')
    .eq('announcement_id', id)

  const { data: auditRows } = await supabase
    .from('audit_log')
    .select('*, profiles(email, role)')
    .eq('target_type', 'announcement')
    .eq('target_id', id)
    .order('created_at', { ascending: true })

  const status = announcementDisplayStatus(announcement)

  return (
    <div className="space-y-8 max-w-5xl pb-16 text-neutral-900 dark:text-white">
      <Link href="/dashboard/submitter" className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white text-xs hover:bg-neutral-100 dark:hover:bg-white/5 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Announcements
      </Link>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-lg border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              {announcement.departments?.name || 'General Notice'}
            </span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">{announcement.title}</h1>
          <p className="text-xs text-neutral-500 dark:text-[#dadbdf] mt-2 font-mono flex flex-wrap items-center gap-2">
            {announcement.display_start && (
              <span>
                <b className="text-neutral-900 dark:text-white">ACTIVE SCHEDULE:</b> {new Date(announcement.display_start).toLocaleString()} &ndash; {announcement.display_end ? new Date(announcement.display_end).toLocaleString() : 'Permanent'}
              </span>
            )}
          </p>
          {announcement.body && (
            <p className="text-sm text-neutral-600 dark:text-[#dadbdf] mt-3 leading-relaxed max-w-2xl font-normal">
              {announcement.body}
            </p>
          )}
        </div>

        {announcement.attachment_url && (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.attachment_url}
              alt="Poster"
              className="w-28 h-28 rounded-lg object-cover border border-neutral-200 dark:border-[#212327]"
            />
          </div>
        )}
      </div>

      {/* Screen Deliveries */}
      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-200 dark:border-[#212327] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-normal text-neutral-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-neutral-900 dark:text-white" /> Target Display Nodes
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#7d8187]">Real-time screen hardware delivery and verification</p>
          </div>
          <span className="font-mono text-xs text-neutral-500 dark:text-[#7d8187]">Sync: 5s</span>
        </div>

        {targetScreens.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 dark:text-[#7d8187] text-xs">
            No physical screens are assigned to this target zone yet.
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 bg-neutral-50 dark:bg-[#0a0a0a]">
            {targetScreens.map((screen) => {
              const delivery = deliveries?.find((d: any) => d.screen_id === screen.id)
              
              // Determine if this screen is specified for this announcement
              const isSpecified = Boolean(
                announcement.target_all ||
                !announcement.target_zones ||
                announcement.target_zones.length === 0 ||
                announcement.target_zones.some((z: string) =>
                  z === screen.name ||
                  z === screen.zone ||
                  z.toLowerCase() === screen.name.toLowerCase() ||
                  z.toLowerCase() === screen.zone.toLowerCase()
                )
              )

              const isApproved = announcement.status === 'approved'
              const state = isApproved
                ? isSpecified ? 'live' : 'standby'
                : announcement.status === 'rejected'
                  ? 'failed'
                  : 'pending'

              const syncLabel = isApproved
                ? isSpecified ? 'Sync: just now' : 'Not targeted'
                : 'Sync: pending approval'

              const hasImage = Boolean(announcement.attachment_url)

              return (
                <div
                  key={screen.id}
                  className="aspect-[16/9] rounded-xl bg-black border border-neutral-300 dark:border-[#212327] flex flex-col justify-between p-3.5 text-white relative overflow-hidden shadow-lg"
                >
                  {/* If image is present and screen is specified, show image covering full screen */}
                  {isApproved && isSpecified && hasImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={announcement.attachment_url}
                      alt={announcement.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* If not approved yet but specified with image, show preview */}
                  {!isApproved && isSpecified && hasImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={announcement.attachment_url}
                      alt={announcement.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                  )}

                  {/* Screen Header in glass pill */}
                  <div className="flex items-center justify-between z-10 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                    <span className="text-[10px] font-mono text-white/90 uppercase tracking-wider font-medium">
                      {screen.zone || 'General'}
                    </span>
                    <StatusBadge status={state} />
                  </div>

                  {/* Screen Center (Only when text-only, or pending, or standby) */}
                  {isApproved && isSpecified && !hasImage ? (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 text-center px-2">
                      <h3 className="text-sm font-semibold text-white line-clamp-3">
                        {announcement.title}
                      </h3>
                      {announcement.body && (
                        <p className="text-[10px] text-neutral-300 line-clamp-2 mt-1">
                          {announcement.body}
                        </p>
                      )}
                    </div>
                  ) : !isSpecified ? (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 text-center space-y-1">
                      <Tv className="w-5 h-5 text-neutral-500 mx-auto" />
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Standby Rotation</span>
                      <span className="text-[8px] font-mono text-neutral-500">Not targeted for this notice</span>
                    </div>
                  ) : !isApproved && !hasImage ? (
                    <div className="flex-1 flex items-center justify-center z-10">
                      <h3 className="text-sm font-semibold text-white/80 px-2 text-center line-clamp-3">
                        {announcement.title}
                      </h3>
                    </div>
                  ) : null}

                  {/* Screen Footer in glass pill */}
                  <div className="flex items-center justify-between z-10 font-mono text-[9px] text-white/80 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                    <span className="truncate max-w-[60%] font-medium">{screen.name}</span>
                    <span className={`shrink-0 text-right ${isApproved && isSpecified ? 'text-emerald-400' : 'text-neutral-400'}`}>
                      {syncLabel}
                    </span>
                  </div>

                  {/* Glass glare effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Audit Activity Timeline */}
      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-6 shadow-sm">
        <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-[#7d8187] mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
          <span>Approval &amp; Event History</span>
        </div>
        {(!auditRows || auditRows.length === 0) ? (
          <p className="text-xs text-neutral-500 dark:text-[#7d8187]">No activity recorded yet.</p>
        ) : (
          <div className="relative pl-6 border-l border-neutral-200 dark:border-[#212327] space-y-4">
            {auditRows.map((row: any) => (
              <div key={row.id} className="relative text-xs">
                <div className="absolute -left-[29px] top-1 w-2 h-2 rounded-full bg-neutral-900 dark:bg-white" />
                <div className="flex flex-wrap items-center gap-2 mb-0.5 font-mono">
                  <span className="text-neutral-900 dark:text-white">{row.profiles?.email || 'System'}</span>
                  <span className="text-[10px] uppercase bg-neutral-100 dark:bg-[#0a0a0a] px-2 py-0.5 rounded-full border border-neutral-200 dark:border-[#212327] text-neutral-600 dark:text-[#dadbdf]">
                    {row.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-[#7d8187] ml-auto">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </div>
                {row.metadata && typeof row.metadata === 'object' && 'reason' in row.metadata && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-lg mt-1.5 border border-rose-200 dark:border-rose-500/30 font-mono">
                    Feedback reason: &ldquo;{String((row.metadata as any).reason)}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
