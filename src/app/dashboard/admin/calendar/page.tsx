import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react'
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
    <div className="space-y-8 max-w-6xl pb-16 text-slate-900  animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 ">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/admin"
              className="p-1 rounded-md text-slate-500 hover:text-slate-900   hover:bg-slate-100  transition-colors"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-slate-200  text-slate-900  bg-slate-100 ">
              Admin
            </span>
            <span className="text-xs font-mono text-slate-500 ">
              Campus Schedule
            </span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-slate-900 ">
            Academic &amp; Activity Calendar
          </h1>
          <p className="text-sm text-slate-600  max-w-2xl mt-1.5 leading-relaxed">
            Live institutional activity calendar across all academic months. Track departmental events, hackathons, sports tournaments, club workshops, and holidays.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="px-4 py-2 rounded-lg border border-slate-200  hover:bg-slate-100  text-xs text-slate-700  transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Admin Overview</span>
        </Link>
      </div>

      {/* Main Calendar Section */}
      <AdminActivityCalendarClient initialMonthsData={calendarData} />
    </div>
  )
}
