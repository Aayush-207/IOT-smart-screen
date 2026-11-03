import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-admin-mono',
})

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role === 'emergency' ? 'emergency' : 'admin'

  return (
    <div 
      className={`h-screen flex overflow-hidden bg-[#f8f9fb] text-slate-900 transition-colors duration-200 ${plusJakarta.variable} ${spaceGrotesk.variable} ${plusJakarta.className}`}
      style={{
        '--font-geist-sans': 'var(--font-admin-sans)',
        '--font-inter': 'var(--font-admin-sans)',
        '--font-sans': 'var(--font-admin-sans)',
        '--font-geist-mono': 'var(--font-admin-mono)',
        '--font-mono': 'var(--font-admin-mono)'
      } as React.CSSProperties}
    >
      <AppSidebar role={role} userEmail={user.email || ''} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
