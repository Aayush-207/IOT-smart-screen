import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { deliveryState, relativeTime, announcementDisplayStatus } from '@/lib/fleet'

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
    <div className="space-y-8 max-w-5xl pb-16">
      <Link href="/dashboard/submitter" className="cohere-btn-secondary text-xs inline-flex items-center gap-1.5">
        &larr; Back to Broadcast History
      </Link>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border-light)] bg-[var(--canvas)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-coral">{announcement.departments?.name || 'General Notice'}</span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">{announcement.title}</h1>
          <p className="text-xs text-[var(--slate)] mt-2 font-mono flex flex-wrap items-center gap-2">
            {announcement.display_start && (
              <span>
                <b>ACTIVE WINDOW:</b> {new Date(announcement.display_start).toLocaleString()} &ndash; {announcement.display_end ? new Date(announcement.display_end).toLocaleString() : 'Permanent'}
              </span>
            )}
          </p>
        </div>

        {announcement.attachment_url && (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.attachment_url}
              alt="Poster"
              className="w-24 h-24 rounded-xl object-cover border border-[var(--hairline)] shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Screen Deliveries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Target Display Node Network
            </h2>
            <p className="text-xs text-[var(--slate)]">Real-time hardware handshake and playback state.</p>
          </div>
          <span className="font-mono text-xs text-[var(--mute)]">Sync interval: 5s</span>
        </div>

        {targetScreens.length === 0 ? (
          <div className="p-12 text-center border border-[var(--hairline)] rounded-xl bg-[var(--canvas-stone)]/30 text-[var(--mute)] text-xs">
            No physical screens are assigned to this target zone yet.
          </div>
        ) : (
          <div className="border-t border-[var(--hairline)]">
            <table className="research-table text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--mute)] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-2 font-semibold">Screen Node</th>
                  <th className="py-3 px-2 font-semibold">Location / Zone</th>
                  <th className="py-3 px-2 font-semibold">Delivery State</th>
                  <th className="py-3 px-2 font-semibold text-right">Last Device Ack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
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
                    <tr key={screen.id} className="hover:bg-[var(--canvas-stone)]/30 transition-colors">
                      <td className="py-4 px-2 font-medium text-xs text-[var(--ink)]">{screen.name}</td>
                      <td className="py-4 px-2 text-xs text-[var(--slate)]">
                        <div>{screen.location}</div>
                        <div className="text-[10px] text-[var(--mute)] font-mono">{screen.zone || 'General'}</div>
                      </td>
                      <td className="py-4 px-2">
                        <StatusBadge status={state} />
                      </td>
                      <td className="py-4 px-2 text-[var(--mute)] text-xs text-right font-mono" suppressHydrationWarning>
                        {relativeTime(delivery?.last_confirmed_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Activity Timeline */}
      <div className="cohere-card-stone p-6">
        <div className="font-semibold text-xs uppercase tracking-wider text-[var(--ink)] mb-4 flex items-center gap-2">
          <span>Lifecycle Audit Log</span>
        </div>
        {(!auditRows || auditRows.length === 0) ? (
          <p className="text-xs text-[var(--mute)]">No activity recorded yet.</p>
        ) : (
          <div className="relative pl-6 border-l border-[var(--hairline)] space-y-4">
            {auditRows.map((row: any) => (
              <div key={row.id} className="relative text-xs">
                <div className="absolute -left-[29px] top-1 w-2 h-2 rounded-full bg-[var(--cohere-near-black)] border-2 border-white dark:border-black" />
                <div className="flex flex-wrap items-center gap-2 mb-0.5 font-mono">
                  <span className="font-medium text-[var(--ink)]">{row.profiles?.email || 'System Controller'}</span>
                  <span className="text-[10px] uppercase bg-[var(--canvas-stone)] px-2 py-0.5 rounded border border-[var(--hairline)] text-[var(--slate)]">
                    {row.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[var(--mute)] ml-auto">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </div>
                {row.metadata && typeof row.metadata === 'object' && 'reason' in row.metadata && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg mt-1.5 border border-rose-200 dark:border-rose-900">
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
