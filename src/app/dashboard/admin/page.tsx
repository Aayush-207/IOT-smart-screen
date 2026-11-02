import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Monitor, AlertTriangle } from 'lucide-react'
import { OrgManagementClient } from './OrgManagementClient'
import { ClearEmergencyButton } from '@/components/ClearEmergencyButton'
import { AdminOverviewDashboard } from './AdminOverviewDashboard'

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
      .select('id, title, body, severity')
      .eq('is_emergency', true)
      .eq('status', 'approved')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  const totalScreens = (screens || []).length

  return (
    <div className="space-y-6 max-w-6xl pb-16 text-slate-900 animate-fade-in-up">
      {/* Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus displays, institutes, student clubs, and scheduled activities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/admin/fleet"
            className="px-4 py-2 rounded-xl bg-[#4c1d76] hover:bg-[#39125b] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            <Monitor className="w-3.5 h-3.5" /> Screens &amp; Fleet ({totalScreens})
          </Link>
        </div>
      </div>

      {/* Active Emergency Alert Banner */}
      {(activeEmergencies || []).length > 0 && (
        <div className="p-4 rounded-xl bg-[#ffeaea] border border-[#ef2045]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#ef2045] text-white shrink-0 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#ef2045] font-bold">Active Campus Emergency Broadcast</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                &ldquo;{activeEmergencies![0].body || activeEmergencies![0].title}&rdquo;
              </p>
            </div>
          </div>
          <ClearEmergencyButton actorId={user.id} />
        </div>
      )}

      {/* Main Organizational Dashboard Overview with Interactive Hover Cards */}
      <AdminOverviewDashboard departments={departments || []} />

      {/* Department & Role Management Section - Permanently Expanded */}
      {!isEmergencyRole && (
        <div className="pt-6 border-t border-slate-200">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Departments &amp; Role Management</span>
              <span className="text-[10px] font-semibold text-[#4c1d76] bg-[#f4eefe] px-2.5 py-0.5 rounded-full border border-[#4c1d76]/20">
                {(departments || []).length} Departments
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage department heads, role authorizations, and user assignments.</p>
          </div>
          <OrgManagementClient initialDepartments={departments || []} initialProfiles={profiles || []} />
        </div>
      )}
    </div>
  )
}
