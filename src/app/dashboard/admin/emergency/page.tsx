import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmergencyBroadcastClient } from './EmergencyBroadcastClient'

export default async function EmergencyBroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'emergency') return redirect('/dashboard/admin')

  const nowIso = new Date().toISOString()
  const [{ count: screenCount }, { data: active }] = await Promise.all([
    supabase.from('screens').select('id', { count: 'exact', head: true }),
    supabase
      .from('announcements')
      .select('id, title, severity, body, created_at')
      .eq('is_emergency', true)
      .eq('status', 'approved')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  return (
    <EmergencyBroadcastClient
      userId={user.id}
      screenCount={screenCount || 0}
      activeEmergencies={active || []}
    />
  )
}
