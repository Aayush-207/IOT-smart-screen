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
      <div className="p-8 text-center text-white bg-[#141414] border border-[#212327] rounded-lg">
        <h2 className="text-base font-normal">You are not assigned to any department yet. Please contact an administrator.</h2>
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
    <div className="space-y-8 max-w-5xl pb-16 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              {department?.name || 'Department'}
            </span>
            <span className="text-xs font-mono text-[#7d8187]">Approver Workspace</span>
          </div>
          <h1 className="xai-display-section text-white">
            Department Overview
          </h1>
          <p className="text-sm text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Review and authorize departmental submissions with automated policy verification before display node broadcasting.
          </p>
        </div>

        <Link
          href="/dashboard/hod/approvals"
          className="px-5 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Pending Approvals ({pending || 0})
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#212327] rounded-lg p-6 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">Pending Decisions</span>
          <div className="text-3xl font-normal text-white">{pending || 0}</div>
          <p className="text-xs text-[#7d8187] mt-1 font-mono">Awaiting your decision</p>
        </div>

        <div className="bg-[#141414] border border-[#212327] rounded-lg p-6 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Authorized &amp; Live</span>
          <div className="text-3xl font-normal text-white">{approvedTotal || 0}</div>
          <p className="text-xs text-[#7d8187] mt-1 font-mono">Active on screens</p>
        </div>

        <div className="bg-[#141414] border border-[#212327] rounded-lg p-6 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">Assigned Unit</span>
          <div className="text-xl font-normal text-white truncate">{department?.name}</div>
          <p className="text-xs text-[#7d8187] mt-1 font-mono">HOD Access Tier</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#141414] border border-[#212327] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-[#212327] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-normal text-white">
              Recent Submissions
            </h2>
            <p className="text-xs text-[#7d8187]">Notices submitted by students and faculty in your department</p>
          </div>
          <Link href="/dashboard/hod/approvals" className="px-3 py-1 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono transition-colors">
            Open Queue &rarr;
          </Link>
        </div>

        {(!recentNotices || recentNotices.length === 0) ? (
          <div className="p-12 text-center text-xs text-[#7d8187]">
            No announcements submitted to your department yet.
          </div>
        ) : (
          <table className="xai-table text-left text-sm">
            <thead>
              <tr>
                <th>Notice Title</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212327]">
              {recentNotices.map((n: any) => (
                <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-normal text-xs text-white">{n.title}</td>
                  <td className="py-4 px-4 text-xs text-[#7d8187] font-mono">{n.profiles?.email}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={n.status} />
                  </td>
                  <td className="py-4 px-4 text-xs text-[#7d8187] text-right font-mono">
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
