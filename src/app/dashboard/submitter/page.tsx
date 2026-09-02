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
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">Announcement Studio</span>
            <span className="text-xs font-mono text-[#8b8496]">{stats.live} Active on Screens</span>
          </div>
          <h1 className="sentry-display-section text-white">
            My Announcements
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Welcome back, <strong className="font-bold text-white">{capitalizedName}</strong>. Create and manage your campus screen posts with automatic AI compliance check.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/submitter/new"
            className="sentry-btn-lime"
          >
            <Plus className="w-4 h-4" /> Create Announcement
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="sentry-card p-5 space-y-1">
          <span className="sentry-mono-label text-[#8b8496]">Total Submissions</span>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <p className="text-[11px] text-[#8b8496]">Created by your account</p>
        </div>

        <div className="sentry-card p-5 space-y-1 border-[#c2ef4e]/30">
          <span className="sentry-mono-label text-[#c2ef4e]">Currently Live</span>
          <div className="text-3xl font-bold text-[#c2ef4e]">{stats.live}</div>
          <p className="text-[11px] text-[#bdb8c0]">Broadcasting on TVs</p>
        </div>

        <div className="sentry-card p-5 space-y-1 border-[#fa7faa]/30">
          <span className="sentry-mono-label text-[#fa7faa]">Pending Review</span>
          <div className="text-3xl font-bold text-[#fa7faa]">{stats.pending}</div>
          <p className="text-[11px] text-[#bdb8c0]">Awaiting HOD approval</p>
        </div>

        <div className="sentry-card p-5 space-y-1">
          <span className="sentry-mono-label text-[#8b8496]">Drafts / Revisions</span>
          <div className="text-3xl font-bold text-white">{stats.drafts}</div>
          <p className="text-[11px] text-[#8b8496]">Requires updates</p>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="sentry-card overflow-hidden">
        <div className="p-5 border-b border-[#362d59] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Announcement History</h3>
            <p className="text-xs text-[#8b8496]">All announcements created by your account</p>
          </div>
          <Link
            href="/dashboard/submitter/new"
            className="sentry-btn-outline text-xs"
          >
            + New Post
          </Link>
        </div>

        <table className="sentry-table text-left text-sm">
          <thead>
            <tr>
              <th>Title &amp; Target</th>
              <th>Department</th>
              <th>Status</th>
              <th>Display Schedule</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#362d59]">
            {rows.map((r: any) => {
              const disp = r.status === 'approved' ? displayStatus(r) : r.status
              return (
                <tr key={r.id} className="hover:bg-[#1f1633]/60 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-xs text-white">{r.title}</div>
                    {r.rejection_reason && (
                      <div className="flex items-center gap-1 text-[11px] text-[#fa5252] mt-1 font-mono">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Feedback: {r.rejection_reason}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs text-[#bdb8c0] font-mono">
                    {r.departments?.name || 'General'}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={disp} />
                  </td>
                  <td className="py-4 px-4 text-xs text-[#8b8496] font-mono">
                    {r.display_start ? new Date(r.display_start).toLocaleDateString() : 'Immediate'}
                    {r.display_end ? ` → ${new Date(r.display_end).toLocaleDateString()}` : ' (No expiry)'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/dashboard/submitter/${r.id}`}
                      className="sentry-btn-outline text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#8b8496]">
                  No announcements yet. Click &ldquo;Create Announcement&rdquo; above to create your first post!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
