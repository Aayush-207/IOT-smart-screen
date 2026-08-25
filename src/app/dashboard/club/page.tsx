import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClubDashboardClient } from './ClubDashboardClient'
import { LogoutButton } from '@/components/LogoutButton'

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

  // Fetch pending or rejected screen requests to show as ghost cards
  const { data: screenRequests } = await supabase
    .from('screen_requests')
    .select('*')
    .eq('club_id', club.id)
    .neq('status', 'approved') // Approved ones become real screens
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] font-geist-sans">
      <header className="sticky top-0 z-50 bg-[var(--canvas)]/90 border-b border-[var(--hairline)] backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-heading-lg">Club Dashboard</h1>
          <p className="text-sm text-[var(--mute)]">Managing {club.name}</p>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">


        <ClubDashboardClient 
          initialScreens={screensWithRequests}
          initialScreenRequests={screenRequests || []}
          clubId={club.id} 
        />
      </main>
    </div>
  )
}
