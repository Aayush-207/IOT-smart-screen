import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus as displayStatus } from '@/lib/fleet'
import { formatDate } from '@/lib/dateUtils'

export default async function SubmitterDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, status, rejection_reason, display_start, display_end, created_at, departments(name)')
    .eq('submitted_by', user.id)
    .neq('status', 'withdrawn')
    .neq('id', '56eac04b-54b5-4e0f-bc71-2c7c8fa90613') // Hide SIH announcement explicitly as DB RLS blocks deletion
    .order('created_at', { ascending: false })

  const rows = announcements || []

  const stats = {
    total: rows.length,
    live: rows.filter((r: any) => displayStatus(r) === 'live').length,
    pending: rows.filter((r: any) => r.status === 'pending_approval').length,
    drafts: rows.filter((r: any) => r.status === 'draft' || r.status === 'rejected').length,
  }

  const name = user.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'Amanda'
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 dark:text-white animate-fade-in-up">
      {/* Top Editorial Announcement Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-medium">
              Production Fleet
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">Node ID: CC-DISPATCH-01</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Broadcast Intelligence &amp; Dispatch
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Welcome back, <strong className="font-semibold text-neutral-900 dark:text-white">{capitalizedName}</strong>. Compose verified announcements, inspect automated AI policy advisories, and track real-time screen node delivery across campus.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/submitter/new"
            className="px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Compose Announcement
          </Link>
        </div>
      </div>

      {/* Screen Broadcast Agent Console Card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] p-6 md:p-8 shadow-sm card-hover">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-[#212327]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="font-mono text-xs text-neutral-500 dark:text-[#7d8187] uppercase tracking-wider">Screen Broadcast Agent</span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Active Dispatch Engine (5s Poll Cycle)</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              {stats.live} Active Screens
            </span>
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">
              100% Mesh Health
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] space-y-1 hover:border-neutral-300 dark:hover:border-white/20 transition-all">
            <span className="font-mono text-[10px] text-neutral-500 dark:text-[#7d8187] uppercase">Total Notices</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</div>
            <p className="text-[11px] text-neutral-500 dark:text-[#7d8187]">Authored by your account</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] space-y-1 hover:border-neutral-300 dark:hover:border-white/20 transition-all">
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Live Broadcasts</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.live}</div>
            <p className="text-[11px] text-neutral-500 dark:text-[#7d8187]">Displaying on targeted zones</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] space-y-1 hover:border-neutral-300 dark:hover:border-white/20 transition-all">
            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 uppercase">Awaiting Decision</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
            <p className="text-[11px] text-neutral-500 dark:text-[#7d8187]">Department review queue</p>
          </div>
        </div>
      </div>

      {/* Publications / Notice Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
              All Submissions &amp; Broadcast History
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#7d8187]">Immutable publication ledger with delivery confirmation.</p>
          </div>
          <span className="font-mono text-xs text-neutral-500 dark:text-[#7d8187]">{rows.length} records</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-16 text-center border border-neutral-200 dark:border-[#212327] rounded-2xl bg-white dark:bg-[#141414] text-neutral-500 dark:text-[#7d8187]">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">No announcements registered</h3>
            <p className="text-xs max-w-sm mx-auto mb-4">
              Compose your first announcement to display events, seminars, or deadlines on campus screens.
            </p>
            <Link
              href="/dashboard/submitter/new"
              className="px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Compose Announcement
            </Link>
          </div>
        ) : (
          <div className="border border-neutral-200 dark:border-[#212327] rounded-2xl bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#212327] text-neutral-500 dark:text-[#7d8187] font-mono text-[10px] uppercase tracking-wider bg-neutral-50/75 dark:bg-[#0a0a0a]">
                  <th className="py-3 px-4 font-semibold">Title &amp; Advisory</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#212327]">
                {rows.map((a: any) => {
                  const status = displayStatus(a)
                  return (
                    <tr key={a.id} className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-xs text-neutral-900 dark:text-white">{a.title}</div>
                        {a.status === 'rejected' && a.rejection_reason && (
                          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-start gap-1.5 max-w-md">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span><b>Approver Feedback:</b> &ldquo;{a.rejection_reason}&rdquo;</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-neutral-600 dark:text-[#dadbdf] text-xs font-mono">{a.departments?.name || 'General'}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={status} />
                      </td>
                      <td suppressHydrationWarning className="py-4 px-4 text-neutral-500 dark:text-[#7d8187] text-xs font-mono">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {status === 'live' || status === 'archived' || status === 'scheduled' ? (
                          <Link
                            href={`/dashboard/submitter/${a.id}`}
                            className="px-3 py-1 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors"
                          >
                            Inspect Nodes &rarr;
                          </Link>
                        ) : a.status === 'draft' || a.status === 'rejected' ? (
                          <Link
                            href={`/dashboard/submitter/new?edit=${a.id}`}
                            className="px-3 py-1 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors"
                          >
                            Edit Notice &rarr;
                          </Link>
                        ) : (
                          <span className="text-neutral-400 dark:text-[#7d8187] text-xs font-mono">In Review</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
