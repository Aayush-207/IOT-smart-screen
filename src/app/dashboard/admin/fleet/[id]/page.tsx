import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DeviceDetailClient } from './DeviceDetailClient'

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: screen } = await supabase
    .from('screens')
    .select('*, announcements(id, title, body, attachment_url, is_emergency)')
    .eq('id', id)
    .single()

  if (!screen) return notFound()

  const { data: deliveries } = await supabase
    .from('announcement_deliveries')
    .select('*, announcements(title)')
    .eq('screen_id', id)
    .not('last_confirmed_at', 'is', null)
    .order('last_confirmed_at', { ascending: false })
    .limit(5)

  const { data: auditRows } = await supabase
    .from('audit_log')
    .select('*, profiles(email)')
    .eq('target_type', 'screen')
    .eq('target_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return <DeviceDetailClient screen={screen} deliveries={deliveries || []} auditRows={auditRows || []} userId={user.id} />
}
