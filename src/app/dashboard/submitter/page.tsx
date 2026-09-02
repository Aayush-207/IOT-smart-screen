import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, AlertCircle, Eye } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus as displayStatus } from '@/lib/fleet'

export default async function SubmitterDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, status, rejection_reason, display_start, display_end, created_at, departments(name)')
    .eq('submitted_by', user.id)
    .neq('status', 'withdrawn')
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
    <div className="space-y-8 max-w-6xl pb-16 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              Submitter Workspace
            </span>
            <span className="text-xs font-mono text-[#7d8187]">{stats.live} Active on Mesh</span>
          </div>
          <h1 className="xai-display-section text-white">
            My Announcements
          </h1>
          <p className="text-sm text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Welcome back, <strong className="font-normal text-white">{capitalizedName}</strong>. Create and manage your campus screen broadcasts with automated policy scoring.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/submitter/new"
            className="px-5 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Create Announcement
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-[#212327] rounded-lg p-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">Total Submissions</span>
          <div className="text-3xl font-normal text-white">{stats.total}</div>
          <p className="text-[11px] text-[#7d8187] font-mono">Created by you</p>
        </div>

        <div className="bg-[#141414] border border-[#212327] rounded-lg p-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Currently Live</span>
          <div className="text-3xl font-normal text-white">{stats.live}</div>
          <p className="text-[11px] text-[#7d8187] font-mono">Broadcasting now</p>
        </div>

        <div className="bg-[#141414] border border-[#212327] rounded-lg p-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">Pending Review</span>
          <div className="text-3xl font-normal text-white">{stats.pending}</div>
          <p className="text-[11px] text-[#7d8187] font-mono">Awaiting HOD</p>
        </div>

        <div className="bg-[#141414] border border-[#212327] rounded-lg p-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">Drafts / Edits</span>
          <div className="text-3xl font-normal text-white">{stats.drafts}</div>
          <p className="text-[11px] text-[#7d8187] font-mono">Requires changes</p>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-[#141414] border border-[#212327] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-[#212327] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-normal text-white">Announcement History</h3>
            <p className="text-xs text-[#7d8187]">All notices submitted through your account</p>
          </div>
          <Link
            href="/dashboard/submitter/new"
            className="px-3 py-1 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono transition-colors"
          >
            + New Post
          </Link>
        </div>

        <table className="xai-table text-left text-sm">
          <thead>
            <tr>
              <th>Title &amp; Target</th>
              <th>Department</th>
              <th>Status</th>
              <th>Display Schedule</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#212327]">
            {rows.map((r: any) => {
              const disp = r.status === 'approved' ? displayStatus(r) : r.status
              return (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-normal text-xs text-white">{r.title}</div>
                    {r.rejection_reason && (
                      <div className="flex items-center gap-1 text-[11px] text-rose-400 mt-1 font-mono">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Feedback: {r.rejection_reason}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs text-[#7d8187] font-mono">
                    {r.departments?.name || 'General'}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={disp} />
                  </td>
                  <td className="py-4 px-4 text-xs text-[#7d8187] font-mono">
                    {r.display_start ? new Date(r.display_start).toLocaleDateString() : 'Immediate'}
                    {r.display_end ? ` → ${new Date(r.display_end).toLocaleDateString()}` : ' (No expiry)'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/dashboard/submitter/${r.id}`}
                      className="px-3 py-1 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#7d8187]">
                  No announcements yet. Click &ldquo;Create Announcement&rdquo; above to create your first post.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
