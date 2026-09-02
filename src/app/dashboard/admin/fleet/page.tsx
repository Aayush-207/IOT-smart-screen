import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FleetMonitoringClient } from './FleetMonitoringClient'

export default async function FleetMonitoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: screens } = await supabase
    .from('screens')
    .select('*, announcements(title)')
    .order('name')

  return <FleetMonitoringClient initialScreens={screens || []} userId={user.id} />
}
