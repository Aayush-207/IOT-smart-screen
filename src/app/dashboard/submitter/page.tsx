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
    <div className="space-y-8 animate-fade-in-up font-sans">
      {/* Top Header Section */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            Submitter Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">Manage your announcements and broadcast requests.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/submitter/new"
            className="px-6 py-3 bg-[#121826] hover:bg-[#121826]/90 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Announcement
          </Link>
        </div>
      </div>

      {/* Bento Box Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        {/* Stat Card 1 */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl text-slate-900 shadow-sm hover:-translate-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 relative z-10 text-slate-900 transition-colors">{stats.total}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">Total Notices</div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl text-slate-900 shadow-sm hover:-translate-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 text-slate-700" />
            </div>
            <span className="flex items-center gap-2 text-[10px] font-extrabold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> 
              ON AIR
            </span>
          </div>
          <div className="text-2xl font-bold mb-1 relative z-10 text-slate-900 transition-colors">{stats.live}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">Live Broadcasts</div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl text-slate-900 shadow-sm hover:-translate-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 relative z-10 text-slate-900 transition-colors">{stats.pending}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">Awaiting Decision</div>
        </div>
      </div>

      {/* Publications / Notice Table */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Publication Ledger
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">{rows.length} records</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No announcements registered</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              You haven&apos;t created any campus announcements yet. Start broadcasting to digital screens across the MIT campus.
            </p>
            <Link 
              href="/dashboard/submitter/new" 
              className="px-6 py-3 bg-[#121826] hover:bg-[#121826]/90 text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Notice
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Title &amp; Advisory</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((a: any) => {
                    const status = displayStatus(a)
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                          {a.status === 'rejected' && a.rejection_reason && (
                            <div className="text-xs text-rose-600 mt-1 font-medium bg-rose-50 inline-block px-2 py-0.5 rounded border border-rose-100">
                              Reason: {a.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-slate-500 font-medium">
                            {a.departments?.name || 'General Notice'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={status} />
                        </td>
                        <td suppressHydrationWarning className="py-4 px-6 text-slate-500 font-medium text-[12px]">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {status === 'live' || status === 'archived' || status === 'scheduled' || status === 'expired' ? (
                            <Link 
                              href={`/dashboard/submitter/${a.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-[#0a0a0a] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Inspect Details
                            </Link>
                          ) : a.status === 'draft' || a.status === 'rejected' ? (
                            <Link
                              href={`/dashboard/submitter/new?edit=${a.id}`}
                              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold transition-colors inline-block"
                            >
                              Edit Draft
                            </Link>
                          ) : (
                            <span className="px-4 py-2 text-slate-500 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold inline-block">
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
