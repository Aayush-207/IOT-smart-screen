import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('department_id').eq('id', user.id).single()

  let pendingApprovals = 0
  if (profile?.department_id) {
    const { count } = await supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', profile.department_id)
      .eq('status', 'pending_approval')
    pendingApprovals = count || 0
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--canvas)] text-[var(--ink)] font-geist-sans">
      <AppSidebar role="hod" userEmail={user.email || ''} pendingApprovals={pendingApprovals} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
