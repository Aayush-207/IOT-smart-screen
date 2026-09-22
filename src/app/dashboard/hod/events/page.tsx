import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllMonthsCalendarData, CalendarEvent } from '@/lib/activityCalendar'
import { Building2, Layers, Calendar, ChevronRight } from 'lucide-react'

export default async function HodDepartmentEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const calendarDataMap = await getAllMonthsCalendarData()
  
  // As requested, explicitly targeting September 2026 and MIT-SOC
  const targetMonthId = '2026-09'
  const targetDepartment = 'MIT-SOC'
  
  const monthData = calendarDataMap[targetMonthId]
  
  if (!monthData) {
    return (
      <div className="p-8 text-slate-500 font-medium text-sm text-center border border-slate-200 rounded-2xl bg-white shadow-sm">
        Error loading calendar data for {targetMonthId}.
      </div>
    )
  }

  // Extract all days that have MIT-SOC events
  const deptDays: { dateStr: string; dayOfWeek: string; events: CalendarEvent[] }[] = []
  
  for (const week of monthData.weeks) {
    if (!week) continue
    for (const day of week) {
      if (!day) continue
      const deptEvents = day.events.filter((ev) => ev.department === targetDepartment)
      if (deptEvents.length > 0) {
        deptDays.push({
          dateStr: day.dateStr,
          dayOfWeek: day.dayOfWeek,
          events: deptEvents
        })
      }
    }
  }

  const totalEvents = deptDays.reduce((acc, curr) => acc + curr.events.length, 0)

  return (
    <div className="space-y-8 animate-fade-in-up font-[family-name:var(--font-inter)]">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-full flex items-center gap-1.5 shadow-sm">
              <Building2 className="w-3.5 h-3.5" /> Department Scope
            </span>
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-slate-200 text-slate-600 bg-white rounded-full shadow-sm">
              {monthData.title}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1">
            {targetDepartment} Events
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl mt-1">
            A filtered overview of all activities, workshops, and deadlines organized by {targetDepartment} for the month of September.
          </p>
        </div>
        
        {/* Stats Card in Header */}
        <div className="shrink-0 flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
            <Calendar className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalEvents}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Events</div>
          </div>
        </div>
      </div>

      {/* Events Agenda List */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          Scheduled Activities
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">{deptDays.length} Days</span>
        </h2>

        {deptDays.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No events scheduled</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              There are no {targetDepartment} events scheduled for {monthData.title}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deptDays.map((day, idx) => {
              const dayDate = new Date(day.dateStr)
              const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
              const formattedDate = dayDate.toLocaleDateString('en-US', options)
              
              return (
                <div key={idx} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group overflow-hidden relative">
                  
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                        <span className="text-2xl font-black text-slate-900 leading-none">{dayDate.getDate()}</span>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{day.dayOfWeek}</div>
                        <div className="text-sm font-semibold text-slate-900">{formattedDate}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" /> {day.events.length}
                    </span>
                  </div>

                  {/* Events List */}
                  <div className="flex-1 space-y-3 relative z-10">
                    {day.events.map((ev, eIdx) => {
                      return (
                        <div key={eIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-colors">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug mb-3">
                            {ev.title}
                          </h4>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md shadow-sm">
                              {ev.category}
                            </span>
                            {ev.club && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md shadow-sm">
                                {ev.club}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

