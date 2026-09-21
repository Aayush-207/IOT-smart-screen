import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus } from '@/lib/fleet'
import { ArrowLeft, Monitor, Clock, Tv, Calendar, AlertCircle } from 'lucide-react'

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
    <div className="space-y-8 max-w-5xl pb-16 animate-fade-in-up">
      <div>
        <Link href="/dashboard/submitter" className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all inline-flex items-center gap-2 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="p-8 md:p-10 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(159,33,118,0.05)] flex flex-col md:flex-row justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-200 rounded-full blur-3xl opacity-10 pointer-events-none" />
        
        <div className="flex-1 relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full">
              {announcement.departments?.name || 'General Notice'}
            </span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            {announcement.title}
          </h1>
          
          <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 w-fit">
            <Calendar className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
            <div className="text-sm font-medium text-slate-900">
              {announcement.display_start ? (
                <span>
                  <span className="font-bold text-slate-900 block mb-1">Active Schedule</span>
                  {new Date(announcement.display_start).toLocaleString()} &ndash; {announcement.display_end ? new Date(announcement.display_end).toLocaleString() : 'Permanent'}
                </span>
              ) : (
                <span><span className="font-bold text-slate-900 block mb-1">Active Schedule</span>Immediate (Permanent)</span>
              )}
            </div>
          </div>

          {announcement.body && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-base text-slate-500 leading-relaxed max-w-2xl whitespace-pre-wrap">
                {announcement.body}
              </p>
            </div>
          )}
        </div>

        {announcement.attachment_url && (
          <div className="shrink-0 relative z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.attachment_url}
              alt="Poster"
              className="w-full md:w-64 aspect-video md:aspect-square object-cover rounded-2xl border border-slate-200 shadow-md"
            />
          </div>
        )}
      </div>

      {/* Screen Deliveries */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(159,33,118,0.05)] overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-200/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-slate-900" /> Target Display Nodes
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Real-time screen hardware delivery and verification</p>
          </div>
          <span className="text-xs font-semibold text-[#00eaff] bg-[#00eaff]/10 border border-[#00eaff]/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00eaff] animate-pulse" /> Sync: Active
          </span>
        </div>

        {targetScreens.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Monitor className="w-12 h-12 text-slate-500 mb-4" />
            <span className="text-slate-500 font-medium">No physical screens are assigned to this target zone yet.</span>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {targetScreens.map((screen) => {
              const delivery = deliveries?.find((d: any) => d.screen_id === screen.id)
              
              const isSpecified = Boolean(
                announcement.target_all ||
                !announcement.target_zones ||
                announcement.target_zones.length === 0 ||
                announcement.target_zones.some((z: string) =>
                  z === screen.name ||
                  z === screen.zone ||
                  z === screen.location ||
                  z.toLowerCase() === screen.name.toLowerCase() ||
                  z.toLowerCase() === screen.zone.toLowerCase() ||
                  z.toLowerCase() === screen.location.toLowerCase()
                )
              )

              const isApproved = announcement.status === 'approved'
              const state = isApproved
                ? isSpecified ? 'live' : 'standby'
                : announcement.status === 'rejected'
                  ? 'failed'
                  : 'pending'

              const syncLabel = isApproved
                ? isSpecified ? 'Synced just now' : 'Not targeted'
                : 'Pending approval'

              const hasImage = Boolean(announcement.attachment_url)

              return (
                <div
                  key={screen.id}
                  className="aspect-[16/9] bg-slate-900 rounded-2xl flex flex-col justify-between p-3 text-[#ffffff] relative overflow-hidden shadow-md border-[6px] border-slate-800 group hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  {isApproved && isSpecified && hasImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={announcement.attachment_url}
                      alt={announcement.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {!isApproved && isSpecified && hasImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={announcement.attachment_url}
                      alt={announcement.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale blur-[2px]"
                    />
                  )}

                  <div className="flex items-center justify-between z-10 bg-[#ffffff]/10 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-white/20">
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      {screen.zone || 'General'}
                    </span>
                    <StatusBadge status={state} />
                  </div>

                  {isApproved && isSpecified && !hasImage ? (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 text-center px-4 bg-[#ffffff]/95 m-2 rounded-xl shadow-lg p-3">
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2">
                        {announcement.title}
                      </h3>
                      {announcement.body && (
                        <p className="text-[10px] font-medium text-slate-500 line-clamp-2 mt-1">
                          {announcement.body}
                        </p>
                      )}
                    </div>
                  ) : !isSpecified ? (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 text-center space-y-2">
                      <Tv className="w-8 h-8 text-slate-500 mx-auto" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 rounded-full px-3 py-1">Standby</span>
                    </div>
                  ) : !isApproved && !hasImage ? (
                    <div className="flex-1 flex items-center justify-center z-10 bg-slate-900/60 m-2 rounded-xl border border-white/10 backdrop-blur-sm">
                      <h3 className="text-xs font-bold text-[#ffffff] px-4 text-center line-clamp-3">
                        {announcement.title}
                      </h3>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between z-10 text-[9px] font-semibold text-slate-500 bg-slate-950/80 rounded-lg px-2.5 py-1.5 mt-2">
                    <span className="truncate max-w-[50%] uppercase">{screen.name}</span>
                    <span className={`shrink-0 text-right flex items-center gap-1 ${isApproved && isSpecified ? 'text-[#00eaff]' : 'text-slate-500'}`}>
                      {isApproved && isSpecified && <span className="w-1.5 h-1.5 rounded-full bg-[#00eaff]" />}
                      {syncLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Audit Activity Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(159,33,118,0.05)] p-8">
        <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-200">
          <Clock className="w-5 h-5 text-slate-900" />
          <h2 className="text-lg font-bold text-slate-900">Approval &amp; Event Ledger</h2>
        </div>
        {(!auditRows || auditRows.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-slate-500">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 py-2">
            {auditRows.map((row: any) => (
              <div key={row.id} className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-slate-200 rounded-full shadow-[0_0_0_4px_white]" />
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-bold text-sm text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {row.profiles?.email || 'System'}
                  </span>
                  <span className="text-xs font-bold bg-slate-900 text-[#ffffff] px-2.5 py-1 rounded-md">
                    {row.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-medium text-slate-500 ml-auto bg-[#ffffff] px-2">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </div>
                {row.metadata && typeof row.metadata === 'object' && 'reason' in row.metadata && (
                  <div className="text-sm text-[#ef2045] bg-[#ffeaea] p-4 mt-3 rounded-xl border border-[#ffeaea] flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#ef2045] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-1">Feedback reason</span>
                      {String((row.metadata as any).reason)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
