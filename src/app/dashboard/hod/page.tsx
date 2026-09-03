import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

import { HodRecentSubmissionsClient } from './HodRecentSubmissionsClient'

export default async function HodDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('department_id').eq('id', user.id).single()

  if (!profile?.department_id) {
    return (
      <div className="p-8 text-center text-neutral-900 dark:text-white bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl shadow-sm">
        <h2 className="text-base font-normal">You are not assigned to any department yet. Please contact an administrator.</h2>
      </div>
    )
  }

  const [{ data: department }, { count: pending }, { count: approvedTotal }, { data: recentNotices }] = await Promise.all([
    supabase.from('departments').select('name').eq('id', profile.department_id).single(),
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
      .select('id, title, body, status, priority, display_start, display_end, attachment_url, target_zones, target_all, created_at, profiles!announcements_submitted_by_fkey(email)')
      .eq('department_id', profile.department_id)
      .neq('status', 'withdrawn')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-8 max-w-5xl pb-16 text-neutral-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              {department?.name || 'Department'}
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">Approver Workspace</span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">
            Department Overview
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Review and authorize departmental submissions with automated policy verification before display node broadcasting.
          </p>
        </div>

        <Link
          href="/dashboard/hod/approvals"
          className="px-5 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Pending Approvals ({pending || 0})
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-6 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Decisions</span>
          <div className="text-3xl font-normal text-neutral-900 dark:text-white">{pending || 0}</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-1 font-mono">Awaiting your decision</p>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-6 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Authorized &amp; Live</span>
          <div className="text-3xl font-normal text-neutral-900 dark:text-white">{approvedTotal || 0}</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-1 font-mono">Active on screens</p>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-6 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Assigned Unit</span>
          <div className="text-xl font-normal text-neutral-900 dark:text-white truncate">{department?.name}</div>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-1 font-mono">HOD Access Tier</p>
        </div>
      </div>

      {/* Expanded Submissions Management Card */}
      <HodRecentSubmissionsClient
        initialNotices={recentNotices || []}
        hodId={user.id}
        departmentName={department?.name || 'Department'}
      />
    </div>
  )
}
