import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllMonthsCalendarData, CATEGORY_STYLES, CATEGORY_ICONS, CalendarDay } from '@/lib/activityCalendar'
import { Calendar as CalendarIcon, Award, MapPin } from 'lucide-react'

export default async function SubmitterEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const calendarDataMap = await getAllMonthsCalendarData()
  
  const now = new Date()
  let targetYear = now.getFullYear()
  let targetMonth = now.getMonth() + 1
  
  if (targetYear !== 2026 && targetYear !== 2027) {
    targetYear = 2026
    targetMonth = 9
  }
  
  const targetId = `${targetYear}-${String(targetMonth).padStart(2, '0')}`
  const monthData = calendarDataMap[targetId] || calendarDataMap['2026-09']
  
  let todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (now.getFullYear() !== 2026 && now.getFullYear() !== 2027) {
    todayStr = '2026-09-07' // Demo fallback
  }

  let currentWeek: (CalendarDay | null)[] = []
  if (monthData && monthData.weeks) {
    for (const week of monthData.weeks) {
      if (!week) continue
      const hasToday = week.some((day) => day && day.dateStr === todayStr)
      if (hasToday) {
        currentWeek = week
        break
      }
    }
    if (currentWeek.length === 0 && monthData.weeks.length > 0) {
      currentWeek = monthData.weeks.find((w) => w && w.some((d) => d && d.events.length > 0)) || monthData.weeks[0]
    }
  }

  const validDays = currentWeek.filter(Boolean) as CalendarDay[]
  let weekTitle = 'This Week'
  if (validDays.length > 0) {
    const firstDay = new Date(validDays[0].dateStr)
    const lastDay = new Date(validDays[validDays.length - 1].dateStr)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    weekTitle = `${firstDay.toLocaleDateString('en-US', options)} - ${lastDay.toLocaleDateString('en-US', options)}`
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full flex items-center gap-1.5 shadow-sm">
              <CalendarIcon className="w-3.5 h-3.5" /> Campus Calendar
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Upcoming Events
          </h1>
          <p className="text-slate-500 mt-2">
            Review this week's scheduled activities, workshops, and holidays to align your announcements.
          </p>
        </div>
      </div>

      {/* Week Title & Summary */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          {weekTitle}
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            {monthData.title}
          </span>
        </h2>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {currentWeek.map((day, idx) => {
          if (!day) {
            return (
              <div key={idx} className="p-6 rounded-3xl bg-slate-100 flex flex-col items-center justify-center min-h-[200px] border border-slate-200 border-dashed opacity-70">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Out of scope</span>
              </div>
            )
          }

          const isToday = day.dateStr === todayStr
          const dayDate = new Date(day.dateStr)

          return (
            <div
              key={idx}
              className={`p-5 rounded-3xl border transition-all min-h-[220px] flex flex-col relative ${
                isToday
                  ? 'border-indigo-200 bg-indigo-50 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:-translate-y-0.5'
                  : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {isToday && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-tr-3xl rounded-bl-xl shadow-sm">
                  Today
                </div>
              )}
              
              <div className="flex items-baseline gap-2 mb-4 border-b border-slate-100 pb-3">
                <span className={`text-4xl font-bold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                  {day.dayNum}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {day.dayOfWeek}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {day.events.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                    <CalendarIcon className="w-6 h-6 mb-2 opacity-50 text-slate-400" />
                    <span className="text-xs font-semibold">No events</span>
                  </div>
                ) : (
                  day.events.map((ev, eIdx) => {
                    return (
                      <div
                        key={eIdx}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:border-indigo-300 hover:shadow-md transition-all"
                      >
                        <div className="text-sm font-semibold text-slate-800 leading-tight">
                          {ev.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2 border-t border-slate-50">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-sm ${CATEGORY_STYLES[ev.category as keyof typeof CATEGORY_STYLES] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {ev.category}
                          </span>
                          {ev.club && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                              {ev.club}
                            </span>
                          )}
                          {ev.department && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {ev.department}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
