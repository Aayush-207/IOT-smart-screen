import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, AlertCircle, LayoutDashboard, MonitorPlay, Clock, CheckCircle2, FileText, Radio } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { announcementDisplayStatus as displayStatus } from '@/lib/fleet'
import { formatDate } from '@/lib/dateUtils'

export default async function SubmitterDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, status, rejection_reason, display_start, display_end, created_at, departments(name)')
    .eq('submitted_by', user.id)
    .neq('status', 'withdrawn')
    .neq('id', '56eac04b-54b5-4e0f-bc71-2c7c8fa90613') // Hide SIH announcement explicitly as DB RLS blocks deletion
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Header Section */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1e1e2e] mb-2">
            Submitter Dashboard
          </h1>
          <p className="text-[#7D7D7D]">Manage your announcements and broadcast requests.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/submitter/new"
            className="px-6 py-3 bg-gradient-to-br from-[#9f2176] to-[#af1591] hover:brightness-110 text-[#ffffff] rounded-xl text-sm font-bold shadow-lg shadow-[#9f2176]/30 hover:shadow-[#9f2176]/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Announcement
          </Link>
        </div>
      </div>

      {/* Bento Box Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        {/* Stat Card 1 */}
        <div className="bg-white border-2 border-[#9f2176]/20 p-6 rounded-3xl text-[#1e1e2e] shadow-[0_0_15px_rgba(159,33,118,0.1)] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(159,33,118,0.4)] hover:border-[#9f2176]/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#9f2176]/5 pointer-events-none" />
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-pulse opacity-0 group-hover:opacity-100 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-[#9f2176]/10 rounded-2xl flex items-center justify-center border border-[#9f2176]/20 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-[#9f2176]" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 relative z-10 text-[#3D1165] group-hover:text-[#9f2176] transition-colors">{stats.total}</div>
          <div className="text-[#7D7D7D] font-bold text-sm uppercase tracking-wider relative z-10">Total Notices</div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white border-2 border-[#af1591]/20 p-6 rounded-3xl text-[#1e1e2e] shadow-[0_0_15px_rgba(175,21,145,0.1)] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(175,21,145,0.4)] hover:border-[#af1591]/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#af1591]/5 pointer-events-none" />
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-pulse opacity-0 group-hover:opacity-100 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-[#af1591]/10 rounded-2xl flex items-center justify-center border border-[#af1591]/20 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 text-[#af1591]" />
            </div>
            <span className="flex items-center gap-2 text-[10px] font-extrabold bg-[#af1591]/10 text-[#af1591] px-3 py-1.5 rounded-full border border-[#af1591]/20 shadow-[0_0_10px_rgba(175,21,145,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#af1591] animate-pulse shadow-[0_0_5px_#af1591]" /> 
              ON AIR
            </span>
          </div>
          <div className="text-3xl font-bold mb-1 relative z-10 text-[#3D1165] group-hover:text-[#af1591] transition-colors">{stats.live}</div>
          <div className="text-[#7D7D7D] font-bold text-sm uppercase tracking-wider relative z-10">Live Broadcasts</div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white border-2 border-[#cfa2f7]/40 p-6 rounded-3xl text-[#1e1e2e] shadow-[0_0_15px_rgba(207,162,247,0.2)] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(207,162,247,0.5)] hover:border-[#cfa2f7]/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#cfa2f7]/10 pointer-events-none" />
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-pulse opacity-0 group-hover:opacity-100 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-[#cfa2f7]/20 rounded-2xl flex items-center justify-center border border-[#cfa2f7]/40 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-[#9f2176]" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 relative z-10 text-[#3D1165] group-hover:text-[#cfa2f7] transition-colors">{stats.pending}</div>
          <div className="text-[#7D7D7D] font-bold text-sm uppercase tracking-wider relative z-10">Awaiting Decision</div>
        </div>
      </div>

      {/* Publications / Notice Table */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1e1e2e]">
            Publication Ledger
          </h2>
          <span className="text-xs font-semibold text-[#7D7D7D] bg-slate-200/50 px-2.5 py-1 rounded-full">{rows.length} records</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center bg-[#fdf4ff] rounded-3xl border border-[#af1591]/20 shadow-[0_4px_20px_rgba(159,33,118,0.05)] flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-[#9f2176]/10 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8 text-[#9f2176]" />
            </div>
            <h3 className="text-lg font-bold text-[#1e1e2e] mb-2">No announcements registered</h3>
            <p className="text-sm text-[#7D7D7D] max-w-sm mx-auto mb-6">
              You haven&apos;t created any campus announcements yet. Start broadcasting to digital screens across the MIT campus.
            </p>
            <Link 
              href="/dashboard/submitter/new" 
              className="px-6 py-3 bg-[#af1591] text-[#ffffff] rounded-xl font-bold shadow-lg shadow-[#af1591]/20 hover:bg-[#9f2176] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" /> Create First Notice
            </Link>
          </div>
        ) : (
          <div className="bg-[#fdf4ff] rounded-2xl border border-[#af1591]/20 overflow-hidden shadow-[0_4px_20px_rgba(159,33,118,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#9f2176]/10 border-b border-[#9f2176]/20 text-xs font-bold text-[#9f2176] uppercase tracking-wider">
                    <th className="py-4 px-6">Title &amp; Advisory</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9f2176]/10">
                  {rows.map((a: any) => {
                    const status = displayStatus(a)
                    return (
                      <tr key={a.id} className="hover:bg-[#9f2176]/5 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#1e1e2e]">{a.title}</div>
                          {a.status === 'rejected' && a.rejection_reason && (
                            <div className="text-xs text-[#dc3545] mt-1 font-medium bg-[#ffeaea] inline-block px-2 py-0.5 rounded">
                              Reason: {a.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#7D7D7D] font-medium">
                            {a.departments?.name || 'General Notice'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={status} />
                        </td>
                        <td suppressHydrationWarning className="py-4 px-6 text-[#7D7D7D] font-medium text-[13px]">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {status === 'live' || status === 'archived' || status === 'scheduled' ? (
                            <Link 
                              href={`/dashboard/submitter/${a.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-[#af1591] hover:text-[#9f2176] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Inspect Details
                            </Link>
                          ) : a.status === 'draft' || a.status === 'rejected' ? (
                            <Link
                              href={`/dashboard/submitter/new?edit=${a.id}`}
                              className="px-4 py-2 text-[#ffffff] bg-[#cfa2f7] hover:bg-[#9f2176] rounded-lg text-xs font-bold transition-colors inline-block"
                            >
                              Edit Draft
                            </Link>
                          ) : (
                            <span className="px-4 py-2 text-[#7D7D7D] bg-[#e5e7eb] rounded-lg text-xs font-semibold inline-block">
                              In Review
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
