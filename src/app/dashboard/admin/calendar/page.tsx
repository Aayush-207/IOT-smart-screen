import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllMonthsCalendarData } from '@/lib/activityCalendar'
import { AdminActivityCalendarClient } from '../AdminActivityCalendarClient'

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return redirect('/login')
  }

  const calendarData = await getAllMonthsCalendarData()

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-900 animate-fade-in-up font-sans">
      <AdminActivityCalendarClient initialMonthsData={calendarData} />
    </div>
  )
}
