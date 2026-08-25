import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HodDashboardClient } from './HodDashboardClient'
import { LogoutButton } from '@/components/LogoutButton'

export default async function HodDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch the department for this HOD
  const { data: department } = await supabase
    .from('departments')
    .select('*')
    .eq('hod_id', user.id)
    .single()

  if (!department) {
    return (
      <div className="p-8 text-center text-[var(--ink)]">
        <h2>You are not assigned to any department.</h2>
      </div>
    )
  }

  // Fetch all clubs under this department
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('department_id', department.id)

  const clubIds = clubs?.map(c => c.id) || []

  // Fetch poster requests for these clubs
  let requests = []
  let screenRequests = []
  let screens = []
  if (clubIds.length > 0) {
    const { data: reqs } = await supabase
      .from('poster_requests')
      .select('*, screens(name, location), clubs(name)')
      .in('club_id', clubIds)
      .order('created_at', { ascending: false })
    requests = reqs || []

    const { data: sreqs } = await supabase
      .from('screen_requests')
      .select('*, clubs(name)')
      .in('club_id', clubIds)
      .order('created_at', { ascending: false })
    screenRequests = sreqs || []

    const { data: s } = await supabase
      .from('screens')
      .select('*, clubs(name)')
      .in('club_id', clubIds)
      .order('name', { ascending: true })
    screens = s || []
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] font-geist-sans">
      <header className="sticky top-0 z-50 bg-[var(--canvas)]/90 border-b border-[var(--hairline)] backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-heading-lg">HOD Review Dashboard</h1>
          <p className="text-sm text-[var(--mute)]">Department: {department.name}</p>
        </div>
        <LogoutButton />
      </header>

      <main className="flex w-full flex-1">

        <HodDashboardClient 
          initialRequests={requests} 
          initialScreenRequests={screenRequests}
          initialScreens={screens}
        />
      </main>
    </div>
  )
}
