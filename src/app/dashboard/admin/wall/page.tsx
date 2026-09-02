import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VideoWallClient } from './VideoWallClient'

export const dynamic = 'force-dynamic'

export default async function VideoWallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'emergency') {
    return redirect('/dashboard/admin')
  }

  const nowIso = new Date().toISOString()

  const [{ data: screens }, { data: emergencies }] = await Promise.all([
    supabase
      .from('screens')
      .select('*, announcements(id, title, body, attachment_url, is_emergency, severity, priority)')
      .order('name'),
    supabase
      .from('announcements')
      .select('id, title, body, severity')
      .eq('is_emergency', true)
      .eq('status', 'approved')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  return (
    <VideoWallClient
      initialScreens={screens || []}
      activeEmergencies={emergencies || []}
      userId={user.id}
    />
  )
}
