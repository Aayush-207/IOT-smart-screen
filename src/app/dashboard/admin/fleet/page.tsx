import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FleetMonitoringClient } from './FleetMonitoringClient'

export const dynamic = 'force-dynamic'

export default async function FleetMonitoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const nowIso = new Date().toISOString()

  const [{ data: screens }, { data: allActiveAnnouncements }] = await Promise.all([
    supabase
      .from('screens')
      .select('*, announcements(id, title, body, attachment_url, is_emergency, severity, priority)')
      .order('name'),
    supabase
      .from('announcements')
      .select('id, title, body, priority, attachment_url, display_start, display_end, target_zones, target_all')
      .eq('status', 'approved')
      .neq('status', 'withdrawn')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  return (
    <FleetMonitoringClient
      initialScreens={screens || []}
      allActiveAnnouncements={allActiveAnnouncements || []}
      userId={user.id}
    />
  )
}

