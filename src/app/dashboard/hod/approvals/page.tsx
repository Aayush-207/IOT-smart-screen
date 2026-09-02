import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApprovalQueueClient } from './ApprovalQueueClient'

export default async function ApprovalQueuePage() {
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

  // HODs sign off on their department's routine / time-sensitive items only;
  // critical items are routed to a Campus Admin (blueprint Part 8/13).
  const { data: requests } = await supabase
    .from('announcements')
    .select('*, profiles!announcements_submitted_by_fkey(email), departments(name)')
    .eq('department_id', profile.department_id)
    .eq('status', 'pending_approval')
    .in('priority', ['routine', 'timesensitive'])
    .order('created_at', { ascending: true })

  return (
    <ApprovalQueueClient
      initialRequests={requests || []}
      hodId={user.id}
      departmentId={profile.department_id}
    />
  )
}
