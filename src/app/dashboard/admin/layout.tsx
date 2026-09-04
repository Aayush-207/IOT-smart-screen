import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role === 'emergency' ? 'emergency' : 'admin'

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-100 dark:bg-[#0a0a0a] text-neutral-900 dark:text-white font-geist-sans transition-colors duration-200">
      <AppSidebar role={role} userEmail={user.email || ''} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
