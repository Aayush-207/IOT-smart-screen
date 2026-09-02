import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

export default async function HodDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('department_id').eq('id', user.id).single()

  if (!profile?.department_id) {
    return (
      <div className="p-8 text-center text-white sentry-card">
        <h2 className="text-base font-bold">You are not assigned to any department yet. Please contact an admin.</h2>
      </div>
    )
  }

  const { data: department } = await supabase.from('departments').select('name').eq('id', profile.department_id).single()

  const [{ count: pending }, { count: approvedTotal }, { data: recentNotices }] = await Promise.all([
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', profile.department_id)
      .eq('status', 'pending_approval'),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', profile.department_id)
      .eq('status', 'approved'),
    supabase
      .from('announcements')
      .select('id, title, status, priority, created_at, profiles!announcements_submitted_by_fkey(email)')
      .eq('department_id', profile.department_id)
      .neq('status', 'withdrawn')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#362d59]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-pink">{department?.name || 'Department'}</span>
            <span className="text-xs font-mono text-[#8b8496]">Department Approver</span>
          </div>
          <h1 className="sentry-display-section text-white">
            Department Overview
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Review and approve student and faculty announcements with AI guidance before they go live on departmental screens.
          </p>
        </div>

        <Link
          href="/dashboard/hod/approvals"
          className="sentry-btn-lime self-start sm:self-auto shrink-0"
        >
          <CheckSquare className="w-4 h-4" /> Pending Approvals ({pending || 0})
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sentry-card p-6 space-y-1 border-[#fa7faa]/40">
          <span className="sentry-mono-label text-[#fa7faa]">Pending Decisions</span>
          <div className="text-3xl font-bold text-[#fa7faa]">{pending || 0}</div>
          <p className="text-xs text-[#bdb8c0] mt-1">Awaiting your approval</p>
        </div>

        <div className="sentry-card p-6 space-y-1 border-[#c2ef4e]/40">
          <span className="sentry-mono-label text-[#c2ef4e]">Approved &amp; Live</span>
          <div className="text-3xl font-bold text-[#c2ef4e]">{approvedTotal || 0}</div>
          <p className="text-xs text-[#bdb8c0] mt-1">Active on screens</p>
        </div>

        <div className="sentry-card p-6 space-y-1">
          <span className="sentry-mono-label text-[#8b8496]">Assigned Department</span>
          <div className="text-xl font-bold text-white truncate">{department?.name}</div>
          <p className="text-xs text-[#8b8496] mt-1">Department Head Access</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="sentry-card overflow-hidden">
        <div className="p-5 border-b border-[#362d59] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Recent Submissions
            </h2>
            <p className="text-xs text-[#8b8496]">Notices submitted by students and faculty in your department</p>
          </div>
          <Link href="/dashboard/hod/approvals" className="sentry-btn-outline text-xs">
            Open Queue &rarr;
          </Link>
        </div>

        {(!recentNotices || recentNotices.length === 0) ? (
          <div className="p-12 text-center text-xs text-[#8b8496]">
            No announcements submitted to your department yet.
          </div>
        ) : (
          <table className="sentry-table text-left text-sm">
            <thead>
              <tr>
                <th>Notice Title</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#362d59]">
              {recentNotices.map((n: any) => (
                <tr key={n.id} className="hover:bg-[#1f1633]/60 transition-colors">
                  <td className="py-4 px-4 font-bold text-xs text-white">{n.title}</td>
                  <td className="py-4 px-4 text-xs text-[#bdb8c0] font-mono">{n.profiles?.email}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={n.status} />
                  </td>
                  <td className="py-4 px-4 text-xs text-[#8b8496] text-right font-mono">
                    {new Date(n.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
