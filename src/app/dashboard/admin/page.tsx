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
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-green">Central Command</span>
            <span className="text-xs font-mono text-[#8b8496]">Screen Health: {healthRate}%</span>
          </div>
          <h1 className="sentry-display-section text-white">
            Admin Dashboard &amp; Hardware Network
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-2xl mt-1.5 leading-relaxed">
            Central dashboard for managing campus digital screens, urgent announcement approvals, live video walls, and emergency safety broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/admin/fleet"
            className="sentry-btn-lime"
          >
            <Monitor className="w-4 h-4" /> Screens &amp; Fleet ({totalScreens})
          </Link>
          <Link
            href="/dashboard/admin/emergency"
            className="sentry-btn-secondary border-[#fa5252]/40 text-[#fa5252] hover:bg-[#fa5252]/10"
          >
            <AlertTriangle className="w-4 h-4 text-[#fa5252]" /> Emergency Alert
          </Link>
        </div>
      </div>

      {/* Active Emergency Alert Banner */}
      {(activeEmergencies || []).length > 0 && (
        <div className="p-6 rounded-2xl bg-[#fa5252]/15 border-2 border-[#fa5252]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#fa5252] text-white shrink-0 animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="sentry-mono-label text-[#fa5252]">Active Campus-Wide Emergency Override</span>
              <p className="text-sm font-bold text-white mt-0.5">
                &ldquo;{activeEmergencies![0].body || activeEmergencies![0].title}&rdquo;
              </p>
            </div>
          </div>
          <ClearEmergencyButton actorId={user.id} />
        </div>
      )}

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="sentry-card p-5 space-y-1 border-[#c2ef4e]/30">
          <div className="flex items-center justify-between">
            <span className="sentry-mono-label text-[#c2ef4e]">Online</span>
            <span className="w-2 h-2 rounded-full bg-[#c2ef4e] shadow-[0_0_6px_rgba(194,239,78,0.8)]" />
          </div>
          <div className="text-3xl font-extrabold text-[#c2ef4e]">{counts.online}</div>
          <p className="text-[10px] font-mono text-[#bdb8c0]">Active Heartbeat</p>
        </div>

        <div className="sentry-card p-5 space-y-1 border-amber-500/30">
          <span className="sentry-mono-label text-amber-400">Delayed Sync</span>
          <div className="text-3xl font-extrabold text-amber-400">{counts.stale}</div>
          <p className="text-[10px] font-mono text-[#bdb8c0]">Slow ping</p>
        </div>

        <div className="sentry-card p-5 space-y-1">
          <span className="sentry-mono-label text-[#8b8496]">Offline</span>
          <div className="text-3xl font-extrabold text-white">{counts.offline}</div>
          <p className="text-[10px] font-mono text-[#8b8496]">Unreachable</p>
        </div>

        <div className="sentry-card p-5 space-y-1 border-[#6a5fc1]/30">
          <span className="sentry-mono-label text-[#a79df5]">Total Pending</span>
          <div className="text-3xl font-extrabold text-white">{pendingApprovals || 0}</div>
          <p className="text-[10px] font-mono text-[#bdb8c0]">Campus Queues</p>
        </div>

        <div className="sentry-card p-5 space-y-1 border-[#fa7faa]/40">
          <span className="sentry-mono-label text-[#fa7faa]">Admin Reviews</span>
          <div className="text-3xl font-extrabold text-[#fa7faa]">{criticalApprovals || 0}</div>
          <Link href="/dashboard/admin/approvals" className="text-[10px] text-[#c2ef4e] hover:underline font-mono block">
            Review Now &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-wrap gap-2.5 pt-1">
        {!isEmergencyRole && (
          <Link
            href="/dashboard/admin/approvals"
            className="sentry-btn-primary text-xs"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Urgent Approvals ({criticalApprovals || 0})
          </Link>
        )}
        <Link
          href="/dashboard/admin/wall"
          className="sentry-btn-secondary text-xs"
        >
          <Tv className="w-3.5 h-3.5 text-[#c2ef4e]" /> Live Screen Wall
        </Link>
        <Link
          href="/dashboard/admin/fleet"
          className="sentry-btn-secondary text-xs"
        >
          <Monitor className="w-3.5 h-3.5 text-[#c2ef4e]" /> Screen Fleet ({totalScreens})
        </Link>
        <Link
          href="/dashboard/admin/announcements"
          className="sentry-btn-secondary text-xs"
        >
          <ListOrdered className="w-3.5 h-3.5" /> Broadcast Catalog
        </Link>
        <Link
          href="/dashboard/admin/analytics"
          className="sentry-btn-secondary text-xs"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Analytics &amp; Telemetry
        </Link>
        <Link
          href="/dashboard/admin/audit"
          className="sentry-btn-secondary text-xs"
        >
          <ScrollText className="w-3.5 h-3.5" /> Activity Audit Log
        </Link>
      </div>

      {/* Organization Hierarchy Section */}
      {!isEmergencyRole && (
        <div className="pt-6 border-t border-[#362d59]">
          <div className="mb-4">
            <span className="sentry-mono-label text-[#8b8496]">Governance</span>
            <h2 className="text-lg font-bold text-white">
              Departments &amp; User Roles
            </h2>
            <p className="text-xs text-[#bdb8c0] mt-0.5">Assign department heads (HODs) and configure user permissions.</p>
          </div>
          <OrgManagementClient initialDepartments={departments || []} initialProfiles={profiles || []} />
        </div>
      )}
    </div>
  )
}
