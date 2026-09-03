import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HodScreensClient } from './HodScreensClient'

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

  // Fetch approved / active announcements for this department
  const nowIso = new Date().toISOString()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, priority, attachment_url, display_start, display_end, target_zones, target_all')
    .eq('department_id', profile.department_id)
    .eq('status', 'approved')
    .neq('id', '56eac04b-54b5-4e0f-bc71-2c7c8fa90613') // Filter out SIH notice as requested
    .or(`display_end.is.null,display_end.gt.${nowIso}`)
    .order('created_at', { ascending: false })

  // Helper to determine if an announcement targets a specific screen
  const getActiveContentForScreen = (screen: { name: string; zone: string }) => {
    if (!announcements || announcements.length === 0) return null

    const match = announcements.find((a) => {
      // If broadcasted to all screens
      if (a.target_all) return true

      // If targeted to specific zones or screen names
      if (Array.isArray(a.target_zones) && a.target_zones.length > 0) {
        return a.target_zones.some((z: string) => {
          const zoneStr = String(z || '').trim().toLowerCase()
          return (
            zoneStr === screen.name.toLowerCase() ||
            zoneStr === screen.zone.toLowerCase() ||
            screen.name.toLowerCase().includes(zoneStr) ||
            screen.zone.toLowerCase().includes(zoneStr)
          )
        })
      }

      return false
    })

    if (!match) return null

    return {
      title: match.title,
      body: match.body,
      attachment_url: match.attachment_url,
      display_start: match.display_start,
      display_end: match.display_end,
      priority: match.priority,
    }
  }

  // The 3 screens with their hardware specs and content strictly filtered by submitter selection
  const screens = [
    {
      id: 'screen-1',
      name: 'Main Lobby Screen 01',
      location: 'Engineering Block A',
      zone: 'Engineering Wing',
      resolution: '1920x1080 (16:9)',
      orientation: 'landscape' as const,
      activeContent: getActiveContentForScreen({ name: 'Main Lobby Screen 01', zone: 'Engineering Wing' }),
    },
    {
      id: 'screen-2',
      name: 'Library Entrance Node',
      location: 'Central Library',
      zone: 'Library Atrium',
      resolution: '1920x1080 (16:9)',
      orientation: 'landscape' as const,
      activeContent: getActiveContentForScreen({ name: 'Library Entrance Node', zone: 'Library Atrium' }),
    },
    {
      id: 'screen-3',
      name: 'Cafeteria Kiosk Display',
      location: 'Student Center',
      zone: 'Student Cafeteria',
      resolution: '1920x1080 (16:9)',
      orientation: 'landscape' as const,
      activeContent: getActiveContentForScreen({ name: 'Cafeteria Kiosk Display', zone: 'Student Cafeteria' }),
    },
  ]

  return <HodScreensClient screens={screens} departmentName={departmentName} />
}
