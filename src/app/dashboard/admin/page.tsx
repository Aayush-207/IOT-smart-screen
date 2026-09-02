import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Monitor, ScrollText, ClipboardCheck, AlertTriangle } from 'lucide-react'
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
      {/* Header with Editorial Declaration */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-green">Central Console</span>
            <span className="text-xs font-mono text-[var(--mute)]">Mesh Health: {healthRate}%</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Institutional Operations &amp; Fleet Command
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-2xl mt-1.5 leading-relaxed">
            Central orchestration node for campus-wide digital displays, urgent priority reviews, remote device hardware lifecycle, and immediate emergency overrides.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/admin/fleet"
            className="cohere-btn-primary"
          >
            <Monitor className="w-4 h-4" /> Manage Fleet ({totalScreens})
          </Link>
          <Link
            href="/dashboard/admin/emergency"
            className="cohere-btn-pill-outline border-rose-400 text-rose-700 dark:text-rose-400 hover:bg-rose-50"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Emergency Console
          </Link>
        </div>
      </div>

      {/* Emergency Active Banner */}
      {(activeEmergencies || []).length > 0 && (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="cohere-mono-label text-rose-700 dark:text-rose-300">Active Global Override</span>
              <p className="text-sm font-semibold text-[var(--ink)] mt-0.5">
                &ldquo;{activeEmergencies![0].body || activeEmergencies![0].title}&rdquo;
              </p>
            </div>
          </div>
          <ClearEmergencyButton actorId={user.id} />
        </div>
      )}

      {/* Telemetry Metrics Row (Soft Stone Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="cohere-card-stone p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="cohere-mono-label text-[var(--cohere-deep-green)] dark:text-emerald-400">Online</span>
            <span className="w-2 h-2 rounded-full bg-[#003c33] dark:bg-emerald-400" />
          </div>
          <div className="text-3xl font-normal text-[var(--ink)]">{counts.online}</div>
          <p className="text-[10px] font-mono text-[var(--mute)]">Heartbeat active</p>
        </div>

        <div className="cohere-card-stone p-5 space-y-1">
          <span className="cohere-mono-label text-amber-700 dark:text-amber-400">Stale Sync</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{counts.stale}</div>
          <p className="text-[10px] font-mono text-[var(--mute)]">Delayed ping</p>
        </div>

        <div className="cohere-card-stone p-5 space-y-1">
          <span className="cohere-mono-label text-[var(--mute)]">Offline</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{counts.offline}</div>
          <p className="text-[10px] font-mono text-[var(--mute)]">Unreachable</p>
        </div>

        <div className="cohere-card-stone p-5 space-y-1">
          <span className="cohere-mono-label text-[var(--cohere-action-blue)]">All Queues</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{pendingApprovals || 0}</div>
          <p className="text-[10px] font-mono text-[var(--mute)]">Campus-wide</p>
        </div>

        <div className="cohere-card-stone p-5 space-y-1 border-[#ffad9b]">
          <span className="cohere-mono-label text-[#ff7759]">Critical (You)</span>
          <div className="text-3xl font-normal text-[#ff7759]">{criticalApprovals || 0}</div>
          <Link href="/dashboard/admin/approvals" className="text-[10px] text-[#1863dc] hover:underline font-mono block">
            Review Queue &rarr;
          </Link>
        </div>
      </div>

      {/* Fast Action Links Strip */}
      <div className="flex flex-wrap gap-3 pt-2">
        {!isEmergencyRole && (
          <Link
            href="/dashboard/admin/approvals"
            className="cohere-btn-primary text-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Critical Approvals ({criticalApprovals || 0})
          </Link>
        )}
        <Link
          href="/dashboard/admin/fleet"
          className="cohere-btn-pill-outline text-xs"
        >
          <Monitor className="w-3.5 h-3.5" /> Device Fleet ({totalScreens})
        </Link>
        <Link
          href="/dashboard/admin/announcements"
          className="cohere-btn-pill-outline text-xs"
        >
          <ScrollText className="w-3.5 h-3.5" /> Published Catalog
        </Link>
        <Link
          href="/dashboard/admin/audit"
          className="cohere-btn-pill-outline text-xs"
        >
          <ScrollText className="w-3.5 h-3.5" /> Immutable Audit Log
        </Link>
      </div>

      {/* Organization Hierarchy Section */}
      {!isEmergencyRole && (
        <div className="pt-6 border-t border-[var(--hairline)]">
          <div className="mb-4">
            <span className="cohere-mono-label text-[var(--mute)]">Access Governance</span>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Department &amp; User Hierarchy
            </h2>
          </div>
          <OrgManagementClient initialDepartments={departments || []} initialProfiles={profiles || []} />
        </div>
      )}
    </div>
  )
}
