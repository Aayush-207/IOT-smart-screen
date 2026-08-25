import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClubDashboardClient } from './ClubDashboardClient'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationsBell } from './NotificationsBell'

export default async function ClubDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch the club assigned to this user
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('president_id', user.id)
    .single()

  if (!club) {
    return (
      <div className="p-8 text-center text-[var(--ink)]">
        <h2>You are not assigned to any club.</h2>
      </div>
    )
  }

  // Fetch screens for this club
  const { data: screens } = await supabase
    .from('screens')
    .select('*')
    .eq('club_id', club.id)

  // Fetch latest poster requests for these screens
  const { data: requests } = await supabase
    .from('poster_requests')
    .select('*')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  // Map latest request to each screen
  const screensWithRequests = screens?.map((screen) => {
    const latestRequest = requests?.find((r) => r.screen_id === screen.id)
    return {
      ...screen,
      latestRequest,
    }
  }) || []

  // Fetch all screen requests to compile notifications
  const { data: screenRequests } = await supabase
    .from('screen_requests')
    .select('*')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  const notifications: any[] = []
  
  requests?.forEach((req: any) => {
    if (req.status === 'rejected') {
      notifications.push({ id: `p-${req.id}`, type: 'error', title: 'Poster Rejected', message: `Reason: ${req.rejection_reason || 'N/A'}`, date: req.created_at })
    } else if (req.status === 'changes_requested') {
      notifications.push({ id: `p-${req.id}`, type: 'info', title: 'Poster Changes Requested', message: `Feedback: ${req.rejection_reason || 'N/A'}`, date: req.created_at })
    } else if (req.status === 'approved') {
      notifications.push({ id: `p-${req.id}`, type: 'success', title: 'Poster Approved', message: 'Your poster is now live on screen.', date: req.created_at })
    }
  })

  screenRequests?.forEach((req: any) => {
    if (req.status === 'rejected') {
      notifications.push({ id: `s-${req.id}`, type: 'error', title: `Screen "${req.name}" Rejected`, message: `Reason: ${req.rejection_reason || 'Hardware denied'}`, date: req.created_at })
    } else if (req.status === 'changes_requested') {
      notifications.push({ id: `s-${req.id}`, type: 'info', title: `Screen "${req.name}" Changes Requested`, message: `Feedback: ${req.rejection_reason || 'Please adjust request'}`, date: req.created_at })
    } else if (req.status === 'approved') {
      notifications.push({ id: `s-${req.id}`, type: 'success', title: `Screen "${req.name}" Approved`, message: 'Your new screen slot is ready.', date: req.created_at })
    }
  })

  // Sort newest first
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Filter only pending requests for the dashboard placeholders
  const pendingScreenRequests = screenRequests?.filter((req: any) => req.status === 'pending') || []

  const rejectedRequests = screenRequests?.filter(req => req.status === 'rejected') || []

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] font-geist-sans">
      <header className="sticky top-0 z-50 bg-[var(--canvas)]/90 border-b border-[var(--hairline)] backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-heading-lg">Club Dashboard</h1>
          <p className="text-sm text-[var(--mute)]">Managing {club.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsBell notifications={notifications} />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">


        <ClubDashboardClient 
          initialScreens={screensWithRequests}
          initialScreenRequests={pendingScreenRequests}
          clubId={club.id} 
        />
      </main>
    </div>
  )
}
