import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllMonthsCalendarData, CalendarEvent } from '@/lib/activityCalendar'
import { Building2, Layers } from 'lucide-react'

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
      <div className="p-8 text-neutral-500 font-mono font-bold uppercase tracking-widest text-sm text-center border-2 border-neutral-900 bg-white">
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
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-neutral-900">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest border-2 border-neutral-900 text-white bg-[#10B981] shadow-[2px_2px_0_0_#171717] flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Department Scope
            </span>
            <span className="px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest border-2 border-neutral-900 text-neutral-900 bg-white shadow-[2px_2px_0_0_#171717]">
              {monthData.title}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-neutral-900">
            {targetDepartment} Events
          </h1>
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mt-2 bg-white border-2 border-neutral-200 px-3 py-1.5 inline-block shadow-[4px_4px_0_0_#171717]">
            A filtered overview of all activities, workshops, and deadlines organized by {targetDepartment} for the month of September.
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end border-4 border-neutral-900 bg-white p-4 shadow-[8px_8px_0_0_#171717]">
          <span className="text-4xl font-black text-[#EA580C]">{totalEvents}</span>
          <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest border-t-2 border-neutral-900 pt-1 mt-1 w-full text-right">Total Events</span>
        </div>
      </div>

      {/* Events Agenda List */}
      <div className="space-y-6">
        {deptDays.length === 0 ? (
          <div className="p-16 text-center border-2 border-neutral-900 bg-white shadow-[8px_8px_0_0_#171717]">
            <h3 className="text-xl font-black uppercase text-neutral-900 mb-2">No events scheduled</h3>
            <p className="text-sm font-bold max-w-sm mx-auto text-neutral-600 uppercase tracking-widest">
              There are no {targetDepartment} events scheduled for {monthData.title}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deptDays.map((day, idx) => {
              const dayDate = new Date(day.dateStr)
              const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
              const formattedDate = dayDate.toLocaleDateString('en-US', options).toUpperCase()
              
              return (
                <div key={idx} className="p-4 border-2 border-neutral-900 bg-white shadow-[6px_6px_0_0_#171717] flex flex-col hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#171717] transition-all">
                  
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-neutral-900">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border-4 border-neutral-900 bg-[#E1D7D1] flex flex-col items-center justify-center shadow-[2px_2px_0_0_#171717]">
                        <span className="text-lg font-black text-neutral-900 leading-none">{dayDate.getDate()}</span>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{day.dayOfWeek}</div>
                        <div className="text-sm font-black uppercase text-neutral-900">{formattedDate}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2 px-3 py-1 border-2 border-neutral-900 bg-[#F59E0B] shadow-[2px_2px_0_0_#171717]">
                      <Layers className="w-3 h-3" /> {day.events.length}
                    </span>
                  </div>

                  {/* Events List */}
                  <div className="flex-1 space-y-3">
                    {day.events.map((ev, eIdx) => {
                      return (
                        <div key={eIdx} className="p-3 border-2 border-neutral-900 bg-neutral-50 flex flex-col gap-2 shadow-[2px_2px_0_0_#171717]">
                          <h4 className="text-xs font-black uppercase text-neutral-900 leading-snug">
                            {ev.title}
                          </h4>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 border-t-2 border-neutral-200 pt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 border-2 border-neutral-900 bg-white">
                              {ev.category}
                            </span>
                            {ev.club && (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-[#10B981] border-2 border-neutral-900 text-neutral-900 shadow-[1px_1px_0_0_#171717]">
                                C: {ev.club}
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
