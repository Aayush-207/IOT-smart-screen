import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare } from 'lucide-react'
import { HodRecentSubmissionsClient } from './HodRecentSubmissionsClient'
import { HOD_APPROVABLE } from '@/lib/priority'

export default async function HodDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('id', user.id)
    .single()

  if (!profile?.department_id) {
    return (
      <div className="p-8 text-center text-neutral-900 dark:text-white bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl shadow-sm animate-fade-in-up">
        <h2 className="text-lg font-medium">No Department Assigned</h2>
        <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-1">Please contact your administrator to assign your HOD account to a department.</p>
      </div>
    )
  }

  const [
    { data: department },
    { count: pending },
    { count: approvedTotal },
    { data: recentNotices },
  ] = await Promise.all([
    supabase.from('departments').select('name').eq('id', profile.department_id).single(),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', profile.department_id)
      .eq('status', 'pending_approval')
      .in('priority', HOD_APPROVABLE),
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
    <div className="space-y-8 max-w-5xl pb-16 animate-fade-in-up font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200 text-slate-700 bg-slate-100">
              {department?.name || 'Department'}
            </span>
            <span className="text-xs font-semibold text-slate-500">Approver Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            Department Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xl mt-1.5 leading-relaxed">
            Review and authorize departmental submissions with automated policy verification before display node broadcasting.
          </p>
        </div>

        <Link
          href="/dashboard/hod/approvals"
          className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md hover:shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <CheckSquare className="w-5 h-5" /> Pending Approvals ({pending || 0})
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl text-slate-900 shadow-sm hover:-translate-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
          <div className="text-2xl font-bold mb-1 relative z-10 text-slate-900 transition-colors">{pending || 0}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">Pending Decisions</div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl text-slate-900 shadow-sm hover:-translate-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="flex items-center gap-2 text-[10px] font-extrabold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> 
              ON AIR
            </span>
          </div>
          <div className="text-2xl font-bold mb-1 relative z-10 text-slate-900 transition-colors">{approvedTotal || 0}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">Live Broadcasts</div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl text-slate-900 shadow-sm hover:-translate-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
          <div className="text-2xl font-bold mb-1 relative z-10 text-slate-900 transition-colors truncate">{department?.name}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">Assigned Unit</div>
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

