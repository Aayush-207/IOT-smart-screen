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
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 dark:text-white animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/admin"
              className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
              Admin
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">
              Campus Schedule
            </span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">
            Academic &amp; Activity Calendar
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-2xl mt-1.5 leading-relaxed">
            Live institutional activity calendar across all academic months. Track departmental events, hackathons, sports tournaments, club workshops, and holidays.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-[#2b2d31] hover:bg-neutral-100 dark:hover:bg-white/5 text-xs text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
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
