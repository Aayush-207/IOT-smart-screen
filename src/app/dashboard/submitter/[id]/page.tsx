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
      <Link href="/dashboard/submitter" className="sentry-btn-outline text-xs inline-flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Announcements
      </Link>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#362d59] bg-[#150f23] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-pink">{announcement.departments?.name || 'General Notice'}</span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{announcement.title}</h1>
          <p className="text-xs text-[#bdb8c0] mt-2 font-mono flex flex-wrap items-center gap-2">
            {announcement.display_start && (
              <span>
                <b className="text-white">ACTIVE SCHEDULE:</b> {new Date(announcement.display_start).toLocaleString()} &ndash; {announcement.display_end ? new Date(announcement.display_end).toLocaleString() : 'Permanent'}
              </span>
            )}
          </p>
          {announcement.body && (
            <p className="text-sm text-[#bdb8c0] mt-3 leading-relaxed max-w-2xl font-normal">
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
              className="w-28 h-28 rounded-xl object-cover border border-[#362d59] shadow-md"
            />
          </div>
        )}
      </div>

      {/* Screen Deliveries */}
      <div className="sentry-card overflow-hidden">
        <div className="p-5 border-b border-[#362d59] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#c2ef4e]" /> Target Screen Status
            </h2>
            <p className="text-xs text-[#8b8496]">Real-time screen hardware delivery and display verification</p>
          </div>
          <span className="font-mono text-xs text-[#8b8496]">Sync: 5s</span>
        </div>

        {targetScreens.length === 0 ? (
          <div className="p-12 text-center text-[#8b8496] text-xs">
            No physical screens are assigned to this target zone yet.
          </div>
        ) : (
          <table className="sentry-table text-left text-sm">
            <thead>
              <tr>
                <th>Screen Name</th>
                <th>Location / Zone</th>
                <th>Display State</th>
                <th className="text-right">Last Device Ack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#362d59]">
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
                  <tr key={screen.id} className="hover:bg-[#1f1633]/60 transition-colors">
                    <td className="px-5 py-4 font-bold text-xs text-white">{screen.name}</td>
                    <td className="px-5 py-4 text-xs text-[#bdb8c0]">
                      <div className="font-bold text-white">{screen.location}</div>
                      <div className="text-[10px] text-[#8b8496] font-mono">{screen.zone || 'General'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={state} />
                    </td>
                    <td className="px-5 py-4 text-[#8b8496] text-xs text-right font-mono" suppressHydrationWarning>
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
      <div className="sentry-card p-6">
        <div className="font-bold text-xs uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#c2ef4e]" />
          <span>Approval &amp; Event History</span>
        </div>
        {(!auditRows || auditRows.length === 0) ? (
          <p className="text-xs text-[#8b8496]">No activity recorded yet.</p>
        ) : (
          <div className="relative pl-6 border-l border-[#362d59] space-y-4">
            {auditRows.map((row: any) => (
              <div key={row.id} className="relative text-xs">
                <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-[#c2ef4e] shadow-[0_0_6px_rgba(194,239,78,0.8)]" />
                <div className="flex flex-wrap items-center gap-2 mb-0.5 font-mono">
                  <span className="font-bold text-white">{row.profiles?.email || 'System'}</span>
                  <span className="text-[10px] uppercase bg-[#1f1633] px-2 py-0.5 rounded border border-[#362d59] text-[#bdb8c0]">
                    {row.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[#8b8496] ml-auto">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </div>
                {row.metadata && typeof row.metadata === 'object' && 'reason' in row.metadata && (
                  <p className="text-xs text-[#fa5252] bg-[#fa5252]/10 p-2.5 rounded-lg mt-1.5 border border-[#fa5252]/30 font-bold">
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
