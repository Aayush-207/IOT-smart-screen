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
  
  // Find current week based on today's date (local time)
  // For demo consistency in 2026, let's use the actual current date
  const now = new Date()
  
  // If we're out of bounds of the calendar data (e.g. testing in a different year),
  // fallback to September 2026 since that's our main dataset.
  let targetYear = now.getFullYear()
  let targetMonth = now.getMonth() + 1
  
  if (targetYear !== 2026 && targetYear !== 2027) {
    targetYear = 2026
    targetMonth = 9
  }
  
  const targetId = `${targetYear}-${String(targetMonth).padStart(2, '0')}`
  const monthData = calendarDataMap[targetId] || calendarDataMap['2026-09']
  
  // Create a YYYY-MM-DD string for today (or use a fallback date in Sept if not in the right year)
  let todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (now.getFullYear() !== 2026 && now.getFullYear() !== 2027) {
    todayStr = '2026-09-07' // Demo fallback
  }

  // Find the week containing today
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
    // If not found in current month (e.g., edge case), just take the first week with events
    if (currentWeek.length === 0 && monthData.weeks.length > 0) {
      currentWeek = monthData.weeks.find((w) => w && w.some((d) => d && d.events.length > 0)) || monthData.weeks[0]
    }
  }

  // Format the week title
  const validDays = currentWeek.filter(Boolean) as CalendarDay[]
  let weekTitle = 'This Week'
  if (validDays.length > 0) {
    const firstDay = new Date(validDays[0].dateStr)
    const lastDay = new Date(validDays[validDays.length - 1].dateStr)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    weekTitle = `${firstDay.toLocaleDateString('en-US', options)} - ${lastDay.toLocaleDateString('en-US', options)}`
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-neutral-900 dark:text-white animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-[#212327]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-medium flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3" /> Campus Calendar
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Upcoming Events
          </h1>
          <p className="text-sm text-neutral-600 dark:text-[#dadbdf] max-w-xl mt-1.5 leading-relaxed">
            Review this week's scheduled activities, workshops, and holidays to align your announcements.
          </p>
        </div>
      </div>

      {/* Week Title & Summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          {weekTitle}
          <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-white/10">
            {monthData.title}
          </span>
        </h2>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentWeek.map((day, idx) => {
          if (!day) {
            return (
              <div key={idx} className="p-5 rounded-2xl border border-neutral-200 dark:border-[#212327] bg-neutral-50/50 dark:bg-[#141414]/50 opacity-50 flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-xs font-mono text-neutral-400">Out of scope</span>
              </div>
            )
          }

          const isToday = day.dateStr === todayStr
          const dayDate = new Date(day.dateStr)

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col transition-all ${
                isToday
                  ? 'border-blue-500/50 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm relative overflow-hidden'
                  : 'border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] hover:border-neutral-300 dark:hover:border-[#383b40]'
              }`}
            >
              {isToday && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-lg">
                  Today
                </div>
              )}
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-2xl font-light ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-white'}`}>
                  {day.dayNum}
                </span>
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {day.dayOfWeek}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {day.events.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center text-neutral-400 dark:text-[#7d8187]">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-2">
                      <CalendarIcon className="w-4 h-4 opacity-50" />
                    </div>
                    <span className="text-xs font-mono">No events</span>
                  </div>
                ) : (
                  day.events.map((ev, eIdx) => {
                    const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES['Academic & General']
                    return (
                      <div
                        key={eIdx}
                        className={`p-3 rounded-xl border bg-white dark:bg-[#18191c] border-neutral-200/70 dark:border-[#24262a] shadow-xs flex flex-col gap-2 ${style.borderClass} border-l-4`}
                      >
                        <div className="text-xs font-medium text-neutral-900 dark:text-white leading-snug">
                          {ev.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${style.badgeClass}`}>
                            {ev.category}
                          </span>
                          {ev.club && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                              Club: {ev.club}
                            </span>
                          )}
                          {ev.department && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 text-indigo-700 dark:text-indigo-300">
                              Dept: {ev.department}
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
