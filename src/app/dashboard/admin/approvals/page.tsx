import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminApprovalQueueClient } from './AdminApprovalQueueClient'

// Campus Admin approval queue: critical / cross-department items that an HOD
// cannot sign off on (blueprint Part 8/13).
export default async function AdminApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return redirect('/dashboard/admin')

  const { data: requests } = await supabase
    .from('announcements')
    .select('*, profiles!announcements_submitted_by_fkey(email), departments(name)')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true })

  return <AdminApprovalQueueClient initialRequests={requests || []} adminId={user.id} />
}
