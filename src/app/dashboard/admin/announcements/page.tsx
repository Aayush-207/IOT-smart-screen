import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WithdrawClient } from './WithdrawClient'

// Campus Admin view of everything currently approved, with a per-item
// Withdraw action (blueprint Part 12/23: ANY STATE -> WITHDRAWN, logged).
export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'emergency') return redirect('/dashboard/admin')

  const { data: rows } = await supabase
    .from('announcements')
    .select('*, departments(name), profiles!announcements_submitted_by_fkey(email)')
    .in('status', ['approved', 'expired', 'withdrawn'])
    .order('created_at', { ascending: false })
    .limit(200)

  return <WithdrawClient initialRows={rows || []} actorId={user.id} />
}
