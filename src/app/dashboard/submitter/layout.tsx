import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import React from 'react'

export default async function SubmitterDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  return (
    <div className="h-screen flex overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans transition-colors duration-200">
      <AppSidebar role="submitter" userEmail={user.email || ''} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="p-8 md:p-12 max-w-[1400px] mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}
