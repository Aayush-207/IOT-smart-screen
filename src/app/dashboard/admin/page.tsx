import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Monitor, AlertTriangle } from 'lucide-react'
import { OrgManagementClient } from './OrgManagementClient'
import { ClearEmergencyButton } from '@/components/ClearEmergencyButton'
import { AnalyticsClient } from './analytics/AnalyticsClient'

export const dynamic = 'force-dynamic'

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
    { data: announcements },
    { data: deliveries },
    { data: auditRows },
    { data: activeEmergencies },
  ] = await Promise.all([
    supabase
      .from('departments')
      .select('*, profiles!departments_hod_id_fkey(email)')
      .order('name'),
    supabase
      .from('profiles')
      .select('id, email, role, department_id'),
    supabase
      .from('screens')
      .select('id, name, zone, location, last_seen_at')
      .order('name'),
    supabase
      .from('announcements')
      .select('id, title, status, priority, is_emergency, department_id, target_all, target_zones, created_at')
      .neq('status', 'withdrawn')
      .order('created_at', { ascending: false }),
    supabase
      .from('announcement_deliveries')
      .select('id, state, announcement_id, screen_id, last_confirmed_at'),
    supabase
      .from('audit_log')
      .select('id, action, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('announcements')
      .select('id, title, body, severity')
      .eq('is_emergency', true)
      .eq('status', 'approved')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  const totalScreens = (screens || []).length

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 dark:text-white animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              Command Mesh
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">{totalScreens} Display Nodes Active</span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">
            System Overview &amp; Network
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-2xl mt-1.5 leading-relaxed">
            Central orchestration console for digital screen nodes, authorization queues, live telemetry analytics, and emergency overrides.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/admin/fleet"
            className="px-5 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
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

      {/* Analytics & Telemetry Embedded Section */}
      <AnalyticsClient
        announcements={announcements || []}
        screens={screens || []}
        departments={departments || []}
        deliveries={deliveries || []}
        auditRows={auditRows || []}
        isEmbedded={true}
      />

      {/* Organization Hierarchy Section */}
      {!isEmergencyRole && (
        <div className="pt-6 border-t border-neutral-200 dark:border-[#212327]">
          <div className="mb-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Governance</span>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
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
