import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

export default async function HodDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('department_id').eq('id', user.id).single()

  if (!profile?.department_id) {
    return (
      <div className="p-8 text-center text-[var(--ink)]">
        <h2>You are not assigned to any department yet. Contact an admin.</h2>
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
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-coral">{department?.name}</span>
            <span className="text-xs font-mono text-[var(--mute)]">Department Authority</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Department Review &amp; Publishing
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-xl mt-1.5 leading-relaxed">
            Faculty and student submission review queue. Inspect automated AI policy advisories and authorize broadcast transmission across departmental screens.
          </p>
        </div>

        <Link
          href="/dashboard/hod/approvals"
          className="cohere-btn-primary self-start sm:self-auto shrink-0"
        >
          <ClipboardCheck className="w-4 h-4" /> Review Queue ({pending || 0})
        </Link>
      </div>

      {/* Metrics Row (Soft Stone Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cohere-card-stone p-6 space-y-1">
          <span className="cohere-mono-label text-[var(--mute)]">Awaiting Decision</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{pending || 0}</div>
          <p className="text-xs text-[var(--slate)] mt-1">Pending faculty / student notices</p>
        </div>

        <div className="cohere-card-stone p-6 space-y-1">
          <span className="cohere-mono-label text-[var(--cohere-deep-green)] dark:text-emerald-400">Approved &amp; Broadcasted</span>
          <div className="text-3xl font-normal text-[var(--ink)]">{approvedTotal || 0}</div>
          <p className="text-xs text-[var(--slate)] mt-1">Active departmental notices</p>
        </div>

        <div className="cohere-card-stone p-6 space-y-1">
          <span className="cohere-mono-label text-[var(--mute)]">Assigned Department</span>
          <div className="text-xl font-normal text-[var(--ink)] truncate">{department?.name}</div>
          <p className="text-xs text-[var(--slate)] mt-1">Authorized Department Approver</p>
        </div>
      </div>

      {/* Research-style Submissions Table */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Recent Department Submissions
            </h2>
            <p className="text-xs text-[var(--slate)]">Latest notices submitted for verification.</p>
          </div>
          <Link href="/dashboard/hod/approvals" className="cohere-btn-secondary text-xs">
            Review Queue &rarr;
          </Link>
        </div>

        {(!recentNotices || recentNotices.length === 0) ? (
          <div className="p-12 text-center border border-[var(--hairline)] rounded-xl bg-[var(--canvas-stone)]/30 text-xs text-[var(--slate)]">
            No announcements recorded in this department yet.
          </div>
        ) : (
          <div className="border-t border-[var(--hairline)]">
            <table className="research-table text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--mute)] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-2 font-semibold">Notice Title</th>
                  <th className="py-3 px-2 font-semibold">Submitted By</th>
                  <th className="py-3 px-2 font-semibold">Status</th>
                  <th className="py-3 px-2 font-semibold text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {recentNotices.map((n: any) => (
                  <tr key={n.id} className="hover:bg-[var(--canvas-stone)]/30 transition-colors">
                    <td className="py-4 px-2 font-medium text-xs text-[var(--ink)]">{n.title}</td>
                    <td className="py-4 px-2 text-xs text-[var(--slate)] font-mono">{n.profiles?.email}</td>
                    <td className="py-4 px-2">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="py-4 px-2 text-xs text-[var(--mute)] text-right font-mono">
                      {new Date(n.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
