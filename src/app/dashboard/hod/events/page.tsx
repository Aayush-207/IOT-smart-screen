import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllMonthsCalendarData, CATEGORY_STYLES, CalendarEvent } from '@/lib/activityCalendar'
import { Calendar as CalendarIcon, MapPin, Building2, Layers } from 'lucide-react'

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
      <div className="p-8 text-neutral-500 font-mono text-sm text-center">
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
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 dark:text-white animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 font-medium flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Department Scope
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187] uppercase">
              {monthData.title}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            {targetDepartment} Events
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            A filtered overview of all activities, workshops, and deadlines organized by {targetDepartment} for the month of September.
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end">
          <span className="text-3xl font-light text-indigo-600 dark:text-indigo-400">{totalEvents}</span>
          <span className="text-[10px] font-mono text-neutral-500 dark:text-[#7d8187] uppercase tracking-wider">Total Events</span>
        </div>
      </div>

      {/* Events Agenda List */}
      <div className="space-y-6">
        {deptDays.length === 0 ? (
          <div className="p-16 text-center border border-neutral-200 dark:border-[#212327] rounded-2xl bg-white dark:bg-[#141414] text-neutral-500 dark:text-[#7d8187]">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">No events scheduled</h3>
            <p className="text-xs max-w-sm mx-auto">
              There are no {targetDepartment} events scheduled for {monthData.title}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deptDays.map((day, idx) => {
              const dayDate = new Date(day.dateStr)
              const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
              const formattedDate = dayDate.toLocaleDateString('en-US', options)
              
              return (
                <div key={idx} className="p-5 rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] shadow-sm flex flex-col hover:border-neutral-300 dark:hover:border-[#383b40] transition-colors">
                  
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-[#212327]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex flex-col items-center justify-center">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white leading-none">{dayDate.getDate()}</span>
                      </div>
                      <div>
                        <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{day.dayOfWeek}</div>
                        <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{formattedDate}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-[#7d8187] flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-50 dark:bg-white/5">
                      <Layers className="w-3 h-3" /> {day.events.length}
                    </span>
                  </div>

                  {/* Events List */}
                  <div className="flex-1 space-y-3">
                    {day.events.map((ev, eIdx) => {
                      const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES['Academic & General']
                      return (
                        <div key={eIdx} className={`p-3 rounded-xl border bg-neutral-50/50 dark:bg-[#18191c] border-neutral-200/70 dark:border-[#24262a] flex flex-col gap-2 ${style.borderClass} border-l-4`}>
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-white leading-snug">
                            {ev.title}
                          </h4>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${style.badgeClass}`}>
                              {ev.category}
                            </span>
                            {ev.club && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/10 border border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white font-medium shadow-sm">
                                Club: {ev.club}
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
