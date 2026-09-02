import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { deliveryState, relativeTime, announcementDisplayStatus } from '@/lib/fleet'
import { ArrowLeft, Monitor, Clock } from 'lucide-react'

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

  let targetScreens: any[] = []
  if (announcement.target_all) {
    const { data } = await supabase.from('screens').select('*').order('name')
    targetScreens = data || []
  } else if (announcement.target_zones?.length) {
    const { data } = await supabase.from('screens').select('*').in('zone', announcement.target_zones).order('name')
    targetScreens = data || []
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
    <div className="space-y-8 max-w-5xl pb-16 text-white">
      <Link href="/dashboard/submitter" className="px-4 py-1.5 rounded-full border border-white/20 text-white text-xs hover:bg-white/5 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Announcements
      </Link>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-lg border border-[#212327] bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              {announcement.departments?.name || 'General Notice'}
            </span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-white">{announcement.title}</h1>
          <p className="text-xs text-[#dadbdf] mt-2 font-mono flex flex-wrap items-center gap-2">
            {announcement.display_start && (
              <span>
                <b className="text-white">ACTIVE SCHEDULE:</b> {new Date(announcement.display_start).toLocaleString()} &ndash; {announcement.display_end ? new Date(announcement.display_end).toLocaleString() : 'Permanent'}
              </span>
            )}
          </p>
          {announcement.body && (
            <p className="text-sm text-[#dadbdf] mt-3 leading-relaxed max-w-2xl font-normal">
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
              className="w-28 h-28 rounded-lg object-cover border border-[#212327]"
            />
          </div>
        )}
      </div>

      {/* Screen Deliveries */}
      <div className="bg-[#141414] border border-[#212327] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-[#212327] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-normal text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-white" /> Target Display Nodes
            </h2>
            <p className="text-xs text-[#7d8187]">Real-time screen hardware delivery and verification</p>
          </div>
          <span className="font-mono text-xs text-[#7d8187]">Sync: 5s</span>
        </div>

        {targetScreens.length === 0 ? (
          <div className="p-12 text-center text-[#7d8187] text-xs">
            No physical screens are assigned to this target zone yet.
          </div>
        ) : (
          <table className="xai-table text-left text-sm">
            <thead>
              <tr>
                <th>Screen Node</th>
                <th>Location / Zone</th>
                <th>Display State</th>
                <th className="text-right">Last Device Ack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212327]">
              {targetScreens.map((screen) => {
                const delivery = deliveries?.find((d: any) => d.screen_id === screen.id)
                const derived = deliveryState(screen.last_seen_at, delivery?.last_confirmed_at)
                const state =
                  derived === 'failed'
                    ? 'failed'
                    : delivery?.state && delivery.state !== 'dispatched'
                      ? delivery.state
                      : derived
                return (
                  <tr key={screen.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-normal text-xs text-white">{screen.name}</td>
                    <td className="px-5 py-4 text-xs text-[#dadbdf]">
                      <div className="text-white">{screen.location}</div>
                      <div className="text-[10px] text-[#7d8187] font-mono">{screen.zone || 'General'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={state} />
                    </td>
                    <td className="px-5 py-4 text-[#7d8187] text-xs text-right font-mono" suppressHydrationWarning>
                      {relativeTime(delivery?.last_confirmed_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Audit Activity Timeline */}
      <div className="bg-[#141414] border border-[#212327] rounded-lg p-6">
        <div className="font-mono text-xs uppercase tracking-wider text-[#7d8187] mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white" />
          <span>Approval &amp; Event History</span>
        </div>
        {(!auditRows || auditRows.length === 0) ? (
          <p className="text-xs text-[#7d8187]">No activity recorded yet.</p>
        ) : (
          <div className="relative pl-6 border-l border-[#212327] space-y-4">
            {auditRows.map((row: any) => (
              <div key={row.id} className="relative text-xs">
                <div className="absolute -left-[29px] top-1 w-2 h-2 rounded-full bg-white" />
                <div className="flex flex-wrap items-center gap-2 mb-0.5 font-mono">
                  <span className="text-white">{row.profiles?.email || 'System'}</span>
                  <span className="text-[10px] uppercase bg-[#0a0a0a] px-2 py-0.5 rounded-full border border-[#212327] text-[#dadbdf]">
                    {row.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[#7d8187] ml-auto">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </div>
                {row.metadata && typeof row.metadata === 'object' && 'reason' in row.metadata && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg mt-1.5 border border-rose-500/30 font-mono">
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
