import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar as CalendarIcon, ArrowLeft, LayoutDashboard } from 'lucide-react'
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
    <div className="space-y-6 max-w-7xl pb-16 text-slate-900 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Link
              href="/dashboard/admin"
              className="p-1.5 rounded-xl text-slate-500 hover:text-[#4c1d76] hover:bg-[#f4eefe] transition-colors"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20">
              Campus Schedule
            </span>
            <span className="text-xs font-semibold text-slate-500">
              MIT-ADT University
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Institutional Activity Calendar
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1.5 leading-relaxed font-medium">
            Live schedule pulled directly from university spreadsheets. Filter and inspect departmental workshops, hackathons, sports tournaments, and holiday schedules.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#4c1d76]/30 text-xs text-slate-700 hover:text-[#4c1d76] font-semibold transition-all flex items-center gap-2 shadow-2xs self-start sm:self-auto"
        >
          <LayoutDashboard className="w-4 h-4 text-[#4c1d76]" />
          <span>Admin Overview</span>
        </Link>
      </div>

      {/* Main Calendar Section */}
      <AdminActivityCalendarClient initialMonthsData={calendarData} />
    </div>
  )
}
