import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboardClient } from './AdminDashboardClient'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Verify Admin Role securely
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return redirect('/login')

  // Fetch all entities for management
  const [{ data: departments }, { data: clubs }, { data: screens }, { data: profiles }] = await Promise.all([
    supabase.from('departments').select('*, profiles(email)'),
    supabase.from('clubs').select('*, departments(name), profiles(email)'),
    supabase.from('screens').select('*, clubs(name)'),
    supabase.from('profiles').select('*')
  ])

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] font-geist-sans">
      <header className="sticky top-0 z-50 bg-[var(--canvas)]/90 border-b border-[var(--hairline)] backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-heading-lg">Admin Overview</h1>
          <p className="text-sm text-[var(--mute)]">System Master Control</p>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AdminDashboardClient 
          initialDepartments={departments || []}
          initialClubs={clubs || []}
          initialScreens={screens || []}
          profiles={profiles || []}
        />
      </main>
    </div>
  )
}
