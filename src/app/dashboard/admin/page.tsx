import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Monitor, ScrollText, CheckSquare, AlertTriangle, Tv, ListOrdered, BarChart3 } from 'lucide-react'
import { deviceStatus } from '@/lib/fleet'
import { OrgManagementClient } from './OrgManagementClient'
import { ClearEmergencyButton } from '@/components/ClearEmergencyButton'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isEmergencyRole = me?.role === 'emergency'
  const nowIso = new Date().toISOString()

  const [
    { data: departments },
    { data: profiles },
    { data: screens },
    { count: pendingApprovals },
    { count: criticalApprovals },
    { data: activeEmergencies },
  ] = await Promise.all([
    supabase.from('departments').select('*, profiles!departments_hod_id_fkey(email)'),
    supabase.from('profiles').select('id, email, role, department_id'),
    supabase.from('screens').select('id, last_seen_at'),
    supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval')
      .or('priority.eq.critical,department_id.is.null'),
    supabase
      .from('announcements')
      .select('id, title, body, severity')
      .eq('is_emergency', true)
      .eq('status', 'approved')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  const counts = { online: 0, stale: 0, offline: 0 }
  ;(screens || []).forEach((s: any) => {
    counts[deviceStatus(s.last_seen_at)]++
  })

  const totalScreens = (screens || []).length
  const healthRate = totalScreens > 0 ? Math.round((counts.online / totalScreens) * 100) : 0

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              Command Mesh
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">Health Index: {healthRate}%</span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">
            System Overview &amp; Network
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-600 dark:text-[#dadbdf] max-w-2xl mt-1.5 leading-relaxed">
            Central orchestration console for digital screen nodes, authorization queues, live mirror wall, and emergency broadcast overrides.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/admin/fleet"
            className="px-5 py-2 rounded-full bg-neutral-900 text-neutral-900 dark:text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <Monitor className="w-3.5 h-3.5" /> Screens &amp; Fleet ({totalScreens})
          </Link>
          <Link
            href="/dashboard/admin/emergency"
            className="px-4 py-2 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-mono flex items-center gap-2 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Emergency Alert
          </Link>
        </div>
      </div>

      {/* Active Emergency Alert Banner */}
      {(activeEmergencies || []).length > 0 && (
        <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-rose-600 text-white shrink-0 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400">Active Campus Emergency Broadcast</span>
              <p className="text-sm text-neutral-900 dark:text-white mt-0.5">
                &ldquo;{activeEmergencies![0].body || activeEmergencies![0].title}&rdquo;
              </p>
            </div>
          </div>
          <ClearEmergencyButton actorId={user.id} />
        </div>
      )}

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Online</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-normal text-emerald-600 dark:text-emerald-400">{counts.online}</div>
          <p className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">Active ping</p>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Delayed Sync</span>
          <div className="text-3xl font-normal text-amber-600 dark:text-amber-400">{counts.stale}</div>
          <p className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">Slow ping</p>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Offline</span>
          <div className="text-3xl font-normal text-neutral-900 dark:text-white">{counts.offline}</div>
          <p className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">Unreachable</p>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Total Pending</span>
          <div className="text-3xl font-normal text-neutral-900 dark:text-white">{pendingApprovals || 0}</div>
          <p className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187]">All Units</p>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Admin Reviews</span>
          <div className="text-3xl font-normal text-amber-600 dark:text-amber-400">{criticalApprovals || 0}</div>
          <Link href="/dashboard/admin/approvals" className="text-[10px] text-neutral-900 dark:text-white hover:underline font-mono block">
            Review Now &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {!isEmergencyRole && (
          <Link
            href="/dashboard/admin/approvals"
            className="px-4 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-sm"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Urgent Approvals ({criticalApprovals || 0})
          </Link>
        )}
        <Link
          href="/dashboard/admin/fleet"
          className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors inline-flex items-center gap-1.5"
        >
          <Monitor className="w-3.5 h-3.5" /> Screen Fleet ({totalScreens})
        </Link>
        <Link
          href="/dashboard/admin/announcements"
          className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors inline-flex items-center gap-1.5"
        >
          <ListOrdered className="w-3.5 h-3.5" /> Broadcast Catalog
        </Link>
        <Link
          href="/dashboard/admin/analytics"
          className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors inline-flex items-center gap-1.5"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Analytics &amp; Telemetry
        </Link>
        <Link
          href="/dashboard/admin/audit"
          className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors inline-flex items-center gap-1.5"
        >
          <ScrollText className="w-3.5 h-3.5" /> Activity Audit Log
        </Link>
      </div>

      {/* Organization Hierarchy Section */}
      {!isEmergencyRole && (
        <div className="pt-6 border-t border-neutral-200 dark:border-[#212327]">
          <div className="mb-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Governance</span>
            <h2 className="text-base font-medium text-neutral-900 dark:text-white">
              Departments &amp; Permissions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-0.5">Assign department heads and manage system authorizations.</p>
          </div>
          <OrgManagementClient initialDepartments={departments || []} initialProfiles={profiles || []} />
        </div>
      )}
    </div>
  )
}
