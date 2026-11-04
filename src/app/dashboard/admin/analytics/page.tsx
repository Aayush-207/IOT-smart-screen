import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'emergency') {
    return redirect('/dashboard/admin')
  }

  const [
    { data: announcements },
    { data: screens },
    { data: departments },
    { data: deliveries },
    { data: auditRows },
  ] = await Promise.all([
    supabase
      .from('announcements')
      .select('id, title, status, priority, is_emergency, department_id, target_all, target_zones, created_at')
      .neq('status', 'withdrawn')
      .order('created_at', { ascending: false }),
    supabase
      .from('screens')
      .select('id, name, zone, location, last_seen_at')
      .order('name'),
    supabase
      .from('departments')
      .select('id, name')
      .order('name'),
    supabase
      .from('announcement_deliveries')
      .select('id, state, announcement_id, screen_id, last_confirmed_at'),
    supabase
      .from('audit_log')
      .select('id, action, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  return (
    <AnalyticsClient
      announcements={announcements || []}
      screens={screens || []}
      departments={departments || []}
      deliveries={deliveries || []}
      auditRows={auditRows || []}
    />
  )
}
