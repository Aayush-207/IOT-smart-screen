import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import { Manrope, Space_Grotesk } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-admin-mono',
  display: 'swap',
})

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role === 'emergency' ? 'emergency' : 'admin'

  return (
    <div 
      className={`h-screen flex overflow-hidden bg-[#f8f9fb] text-slate-900 transition-colors duration-200 ${manrope.variable} ${spaceGrotesk.variable} ${manrope.className}`}
      style={{
        '--font-geist-sans': 'var(--font-manrope)',
        '--font-inter': 'var(--font-manrope)',
        '--font-sans': 'var(--font-manrope)',
        '--font-admin-sans': 'var(--font-manrope)',
        '--font-manrope': 'var(--font-manrope)',
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
