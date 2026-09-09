import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { redirect } from 'next/navigation'
import { HodScreensClient } from './HodScreensClient'

export const dynamic = 'force-dynamic'

export default async function HodScreensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('id', user.id)
    .single()

  if (!profile?.department_id) {
    return redirect('/dashboard/hod')
  }

  const { data: department } = await supabase
    .from('departments')
    .select('name')
    .eq('id', profile.department_id)
    .single()

  const departmentName = department?.name || 'Department'

  // Fetch approved / active announcements across physical screen fleet using public client (unrestricted by user department RLS)
  const publicSupabase = createPublicClient()
  const nowIso = new Date().toISOString()

  const [{ data: dbScreens }, { data: liveAnnouncements }] = await Promise.all([
    publicSupabase.from('screens').select('*').order('name'),
    publicSupabase
      .from('announcements')
      .select('id, title, body, priority, attachment_url, display_start, display_end, target_zones, target_all, department_id, departments(name)')
      .eq('status', 'approved')
      .neq('status', 'withdrawn')
      .or(`display_end.is.null,display_end.gt.${nowIso}`)
      .order('created_at', { ascending: false }),
  ])

  // Helper to determine all announcements currently targeting a specific screen
  const getActiveContentsForScreen = (screen: { name: string; zone?: string; location?: string }) => {
    if (!liveAnnouncements || liveAnnouncements.length === 0) return []

    const matches = liveAnnouncements.filter((a) => {
      // If broadcasted to all screens
      if (a.target_all) return true

      // If targeted to specific zones or screen names
      if (Array.isArray(a.target_zones) && a.target_zones.length > 0) {
        return a.target_zones.some((z: string) => {
          const zoneStr = String(z || '').trim().toLowerCase()
          return (
            zoneStr === screen.name.toLowerCase() ||
            (screen.zone && zoneStr === screen.zone.toLowerCase()) ||
            (screen.location && zoneStr === screen.location.toLowerCase()) ||
            screen.name.toLowerCase().includes(zoneStr) ||
            (screen.zone && screen.zone.toLowerCase().includes(zoneStr)) ||
            (screen.location && screen.location.toLowerCase().includes(zoneStr)) ||
            zoneStr.includes(screen.name.toLowerCase()) ||
            (screen.zone && zoneStr.includes(screen.zone.toLowerCase())) ||
            (screen.location && zoneStr.includes(screen.location.toLowerCase()))
          )
        })
      }

      return false
    })

    return matches.map((match) => ({
      id: match.id,
      title: match.title,
      body: match.body,
      attachment_url: match.attachment_url,
      display_start: match.display_start,
      display_end: match.display_end,
      priority: match.priority,
      department_name: (match as any).departments?.name,
    }))
  }

  // Use database screens if registered, otherwise default to the 3 standard campus displays
  const defaultScreens = [
    {
      id: 'screen-1',
      name: 'Main Lobby Screen 01',
      location: 'Engineering Block A',
      zone: 'Engineering Wing',
    },
    {
      id: 'screen-2',
      name: 'Library Entrance Node',
      location: 'Central Library',
      zone: 'Library Atrium',
    },
    {
      id: 'screen-3',
      name: 'Cafeteria Kiosk Display',
      location: 'Student Center',
      zone: 'Student Cafeteria',
    },
  ]

  const activeScreensList = dbScreens && dbScreens.length > 0 ? dbScreens : defaultScreens

  const screens = activeScreensList.map((s: any) => {
    const isOnline = s.name === 'Main Lobby Screen 01'
    return {
      id: s.id,
      name: s.name,
      location: s.location || 'Campus Location',
      zone: s.zone || 'General Zone',
      resolution: '1672x941 (16:9)',
      orientation: 'landscape' as const,
      isOnline,
      contents: isOnline ? getActiveContentsForScreen(s) : [],
    }
  })

  return <HodScreensClient screens={screens} departmentName={departmentName} />
}
