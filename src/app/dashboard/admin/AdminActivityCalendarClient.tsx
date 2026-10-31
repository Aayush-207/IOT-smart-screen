'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles,
  Award,
  Trophy,
  Laptop,
  BookOpen,
  PartyPopper,
  Compass,
  GraduationCap,
  CalendarDays,
  ChevronDown,
  Building2,
  Users,
  Check,
} from 'lucide-react'
import {
  MonthCalendarData,
  CalendarDay,
  CalendarEvent,
  MONTH_CONFIGS,
  CATEGORY_STYLES,
} from '@/lib/activityCalendar'

interface AdminActivityCalendarClientProps {
  initialMonthsData: Record<string, MonthCalendarData>
}

// Sophisticated, calm icons matching university tone (no eye-straining neons)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Tech & Hackathons': <Laptop className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
  'Workshops & Seminars': <BookOpen className="w-3.5 h-3.5 text-violet-600 shrink-0" />,
  'Sports & Athletics': <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  'Holiday & Festival': <PartyPopper className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
  'Cultural & Campus Life': <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />,
  'Trek & Adventure': <Compass className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
  'Alumni & Careers': <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
  'Academic & General': <Award className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
}

export function AdminActivityCalendarClient({
  initialMonthsData,
}: AdminActivityCalendarClientProps) {
  const [monthsData, setMonthsData] = useState<Record<string, MonthCalendarData>>(initialMonthsData)
  const [selectedMonthId, setSelectedMonthId] = useState<string>('2026-09')
  const [activeTerm, setActiveTerm] = useState<'All' | 'Odd Semester' | 'Even Semester'>('All')
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeDetailDay, setActiveDetailDay] = useState<CalendarDay | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshSuccess, setRefreshSuccess] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const activeMonthConfig = useMemo(
    () => MONTH_CONFIGS.find((m) => m.id === selectedMonthId) || MONTH_CONFIGS[0],
    [selectedMonthId]
  )

  const currentMonthData = useMemo(() => {
    return (
      monthsData[selectedMonthId] || {
        id: selectedMonthId,
        title: activeMonthConfig.name,
        shortName: activeMonthConfig.shortName,
        term: activeMonthConfig.term,
        year: activeMonthConfig.year,
        month: activeMonthConfig.month,
        weeks: [],
        events: [],
        totalEvents: 0,
      }
    )
  }, [monthsData, selectedMonthId, activeMonthConfig])

  // Navigation handlers
  const handlePrevMonth = () => {
    const currentIndex = MONTH_CONFIGS.findIndex((m) => m.id === selectedMonthId)
    if (currentIndex > 0) {
      setSelectedMonthId(MONTH_CONFIGS[currentIndex - 1].id)
    }
  }

  const handleNextMonth = () => {
    const currentIndex = MONTH_CONFIGS.findIndex((m) => m.id === selectedMonthId)
    if (currentIndex < MONTH_CONFIGS.length - 1) {
      setSelectedMonthId(MONTH_CONFIGS[currentIndex + 1].id)
    }
  }

  // Live refresh from API
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch('/api/calendar')
      const json = await res.json()
      if (json.success && json.data) {
        setMonthsData(json.data)
        setRefreshSuccess(true)
        setTimeout(() => setRefreshSuccess(false), 2500)
      }
    } catch (e) {
      console.error('Failed to refresh calendar:', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  const categoriesList = useMemo(() => {
    return Object.keys(CATEGORY_STYLES)
  }, [])

  // Stats calculation
  const stats = useMemo(() => {
    const events = currentMonthData.events || []
    const tech = events.filter((e) => e.category === 'Tech & Hackathons').length
    const sports = events.filter((e) => e.category === 'Sports & Athletics').length
    const workshops = events.filter((e) => e.category === 'Workshops & Seminars').length
    const holidays = events.filter((e) => e.category === 'Holiday & Festival').length
    const cultural = events.filter((e) => e.category === 'Cultural & Campus Life').length
    return { total: events.length, tech, sports, workshops, holidays, cultural }
  }, [currentMonthData])

  // Filter months by semester term
  const filteredMonths = useMemo(() => {
    if (activeTerm === 'All') return MONTH_CONFIGS
    return MONTH_CONFIGS.filter((m) => m.term === activeTerm)
  }, [activeTerm])

  // Filtered events logic
  const filterEvent = (event: CalendarEvent) => {
    if (selectedCategory !== 'ALL' && event.category !== selectedCategory) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = event.title.toLowerCase().includes(q)
      const clubMatch = event.club ? event.club.toLowerCase().includes(q) : false
      const deptMatch = event.department ? event.department.toLowerCase().includes(q) : false
      const catMatch = event.category.toLowerCase().includes(q)
      if (!titleMatch && !clubMatch && !deptMatch && !catMatch) return false
    }
    return true
  }

  // Filtered days for Agenda view
  const agendaDays = useMemo(() => {
    const days: { day: CalendarDay; filteredEvents: CalendarEvent[] }[] = []
    const allDays = (currentMonthData.weeks || []).flat().filter(Boolean) as CalendarDay[]
    for (const d of allDays) {
      if (!d.isCurrentMonth) continue
      const filtered = d.events.filter(filterEvent)
      if (filtered.length > 0) {
        days.push({ day: d, filteredEvents: filtered })
      }
    }
    return days
  }, [currentMonthData, selectedCategory, searchQuery])

  const sheetUrl = `https://docs.google.com/spreadsheets/d/1DUIFEJNlvkBvof1FB5jK4tF35tyD9Err8PF-ozT6SW8/edit?gid=${activeMonthConfig.gid}#gid=${activeMonthConfig.gid}`

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_24px_rgba(76,29,118,0.04)] overflow-hidden animate-fade-in-up">
      {/* ── TOP HEADER / CONTROLS ── */}
      <div className="p-5 md:p-6 border-b border-slate-100 bg-gradient-to-b from-white to-[#fbfaff] space-y-5">
        {/* ROW 1: Month Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#f4eefe] border border-[#4c1d76]/15 flex items-center justify-center text-[#4c1d76] shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeMonthConfig.name}
                </h2>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20">
                  {activeMonthConfig.term}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Academic Year 2026&ndash;2027 &bull; {currentMonthData.totalEvents} Total Events Scheduled
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search event, club, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/10 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Sync latest live Google Sheet data"
              className={`p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#4c1d76] hover:border-[#4c1d76]/30 shadow-2xs transition-all flex items-center gap-1.5 text-xs font-semibold ${
                refreshSuccess ? 'text-emerald-600 border-emerald-300 bg-emerald-50/50' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#4c1d76]' : ''}`} />
              <span className="hidden sm:inline">{refreshSuccess ? 'Synced' : 'Refresh'}</span>
            </button>

            {/* Open Google Sheet External Link */}
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open current month in Google Sheets"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#4c1d76] hover:border-[#4c1d76]/30 shadow-2xs transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <ExternalLink className="w-4 h-4 opacity-70" />
              <span className="hidden sm:inline">Sheets</span>
            </a>
          </div>
        </div>

        {/* ROW 2: Month Navigation & View Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          {/* Month Steppers & Pill List */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {/* Term Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shrink-0">
              {(['All', 'Odd Semester', 'Even Semester'] as const).map((term) => (
                <button
                  key={term}
                  onClick={() => setActiveTerm(term)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTerm === term
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {term === 'All' ? 'All' : term.replace(' Semester', '')}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

            {/* Month Steppers */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handlePrevMonth}
                disabled={MONTH_CONFIGS[0].id === selectedMonthId}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {filteredMonths.map((month) => {
                const isActive = month.id === selectedMonthId
                const mData = monthsData[month.id]
                return (
                  <button
                    key={month.id}
                    onClick={() => setSelectedMonthId(month.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                      isActive
                        ? 'bg-[#4c1d76] text-white border-[#4c1d76] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-[#fcfaff] hover:text-[#4c1d76] hover:border-[#4c1d76]/30'
                    }`}
                  >
                    <span>{month.shortName.split(' ')[0]}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white font-bold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {mData?.totalEvents ?? '...'}
                    </span>
                  </button>
                )
              })}

              <button
                onClick={handleNextMonth}
                disabled={MONTH_CONFIGS[MONTH_CONFIGS.length - 1].id === selectedMonthId}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Jump Dropdown & Grid/Agenda View Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            {/* Quick Month Jump Menu */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>Jump</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 z-30 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 animate-scale-up"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Select Month
                  </div>
                  <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {MONTH_CONFIGS.map((m) => {
                      const isSelected = m.id === selectedMonthId
                      const count = monthsData[m.id]?.totalEvents || 0
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMonthId(m.id)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#4c1d76] text-white font-bold'
                              : 'text-slate-700 hover:bg-[#f8f5ff] hover:text-[#4c1d76]'
                          }`}
                        >
                          <span>{m.name}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grid / Agenda Toggle */}
            <div className="flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all text-xs ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all text-xs ${
                  viewMode === 'agenda'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* ROW 3: Category Filter Pills & Key Counters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#4c1d76] text-white border-[#4c1d76] shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {categoriesList.map((catKey) => {
              const isSelected = selectedCategory === catKey
              const style = CATEGORY_STYLES[catKey]
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? `${style.badgeClass} ring-2 ring-[#4c1d76]/20 font-bold shadow-2xs`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dotClass}`} />
                  <span>{catKey.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Clean, Non-Garish Metric Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>{stats.total}</strong> Total</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/80 border border-purple-200 text-purple-900">
              <Laptop className="w-3.5 h-3.5 text-purple-600" />
              <span><strong>{stats.tech}</strong> Tech</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>{stats.sports}</strong> Sports</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50/80 border border-violet-200 text-violet-900">
              <BookOpen className="w-3.5 h-3.5 text-violet-600" />
              <span><strong>{stats.workshops}</strong> Workshop</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-900">
              <PartyPopper className="w-3.5 h-3.5 text-rose-600" />
              <span><strong>{stats.holidays}</strong> Holiday</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT VIEW ── */}
      {viewMode === 'grid' ? (
        /* Calendar Grid View */
        <div className="p-4 sm:p-6 overflow-x-auto bg-[#faf9fc]">
          <div className="min-w-[780px]">
            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2.5 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl border ${
                    idx === 0
                      ? 'text-rose-700 bg-rose-50/70 border-rose-100'
                      : 'text-slate-600 bg-white border-slate-200/70'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Weeks Grid */}
            <div className="space-y-2">
              {(currentMonthData.weeks || []).map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-7 gap-2">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${wIdx}-${dIdx}`}
                          className="min-h-[116px] rounded-2xl bg-slate-50/60 border border-slate-100"
                        />
                      )
                    }

                    const matchingEvents = day.events.filter(filterEvent)
                    const hasHoliday = day.events.some(
                      (e) => e.category === 'Holiday & Festival'
                    )
                    const isToday = day.dateStr === todayStr
                    const isSunday = dIdx === 0

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => setActiveDetailDay(day)}
                        className={`min-h-[116px] p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${
                          day.isCurrentMonth
                            ? isToday
                              ? 'bg-[#faf6ff] border-[#4c1d76] shadow-[0_0_0_1.5px_rgba(76,29,118,0.4)] hover:shadow-md'
                              : hasHoliday
                              ? 'bg-rose-50/30 border-rose-200/60 hover:border-rose-300 hover:shadow-sm'
                              : 'bg-white border-slate-200/80 hover:border-[#4c1d76]/40 hover:shadow-[0_4px_16px_rgba(76,29,118,0.06)] hover:-translate-y-0.5'
                            : 'bg-slate-50/40 border-slate-100 opacity-40 hover:opacity-75'
                        }`}
                      >
                        {/* Day Card Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-colors ${
                              isToday
                                ? 'bg-[#4c1d76] text-white shadow-2xs font-extrabold'
                                : hasHoliday
                                ? 'text-rose-700 bg-rose-100/70'
                                : isSunday
                                ? 'text-rose-700 bg-rose-50/50'
                                : day.isCurrentMonth
                                ? 'text-slate-800 group-hover:text-[#4c1d76]'
                                : 'text-slate-400'
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          {matchingEvents.length > 0 && (
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/15">
                              {matchingEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event Chips List */}
                        <div className="space-y-1.5 flex-1 overflow-hidden my-1">
                          {matchingEvents.slice(0, 2).map((ev, eIdx) => {
                            const style =
                              CATEGORY_STYLES[ev.category] ||
                              CATEGORY_STYLES['Academic & General']
                            return (
                              <div
                                key={eIdx}
                                title={ev.title}
                                className={`text-[10px] px-2 py-1 rounded-lg border truncate font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${style.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotClass}`} />
                                <span className="truncate">{ev.title}</span>
                              </div>
                            )
                          })}

                          {matchingEvents.length > 2 && (
                            <div className="text-[10px] font-bold text-[#4c1d76] bg-[#f4eefe]/70 px-2 py-0.5 rounded-md border border-[#4c1d76]/15 text-center">
                              +{matchingEvents.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Subtle Footer */}
                        <div className="text-[9px] font-semibold text-slate-400 group-hover:text-[#4c1d76] transition-colors flex justify-end pt-1">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Details &rarr;</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda / Timeline View */
        <div className="p-5 sm:p-6 divide-y divide-slate-100 max-h-[640px] overflow-y-auto custom-scrollbar bg-white">
          {agendaDays.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              No campus activities or events match your current filter parameters.
            </div>
          ) : (
            agendaDays.map(({ day, filteredEvents }) => {
              const hasHoliday = day.events.some((e) => e.category === 'Holiday & Festival')
              const isToday = day.dateStr === todayStr
              const isSunday = day.dayOfWeek.toLowerCase().startsWith('sun')

              return (
                <div key={day.dateStr} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Date Badge */}
                  <div className="sm:w-36 shrink-0">
                    <div
                      className={`p-3 rounded-2xl border text-left shadow-2xs ${
                        isToday
                          ? 'bg-[#f4eefe] border-[#4c1d76]/30 text-[#4c1d76]'
                          : hasHoliday || isSunday
                          ? 'bg-rose-50/60 border-rose-200 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xl font-extrabold leading-none">
                          {day.dayNum}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          {day.dayOfWeek.slice(0, 3)}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium opacity-80 block mt-1">
                        {activeMonthConfig.name}
                      </span>
                    </div>
                  </div>

                  {/* Day Events List */}
                  <div className="flex-1 space-y-2.5">
                    {filteredEvents.map((ev, eIdx) => {
                      const style =
                        CATEGORY_STYLES[ev.category] ||
                        CATEGORY_STYLES['Academic & General']
                      return (
                        <div
                          key={eIdx}
                          onClick={() => setActiveDetailDay(day)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm hover:border-[#4c1d76]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-slate-200/80 ${style.borderClass} border-l-[3.5px]`}
                        >
                          <div className="space-y-1.5">
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {CATEGORY_ICONS[ev.category] || <Award className="w-4 h-4 text-slate-400" />}
                              <span>{ev.title}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${style.badgeClass}`}
                              >
                                {ev.category}
                              </span>
                              {ev.club && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>{ev.club}</span>
                                </span>
                              )}
                              {ev.department && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#f4eefe] border border-[#4c1d76]/20 text-[#4c1d76] flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-[#4c1d76]/70" />
                                  <span>{ev.department}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-xs font-bold text-[#4c1d76] shrink-0 self-end sm:self-center opacity-80 hover:opacity-100">
                            Details &rarr;
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── FOOTER LEGEND ── */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Legend:
            </span>
            {categoriesList.map((catKey) => {
              const style = CATEGORY_STYLES[catKey]
              return (
                <div key={catKey} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${style.dotClass}`} />
                  <span>{catKey}</span>
                </div>
              )
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>Month GID: {activeMonthConfig.gid}</span>
          </div>
        </div>
      </div>

      {/* ── DAY DETAILS MODAL ── */}
      {activeDetailDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveDetailDay(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-white to-[#faf7ff] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4c1d76] bg-[#f4eefe] px-2.5 py-0.5 rounded-full border border-[#4c1d76]/20">
                    Schedule Details
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {activeDetailDay.dayOfWeek}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {new Date(activeDetailDay.dateStr).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailDay(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Events Content */}
            <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100 custom-scrollbar">
              {activeDetailDay.events.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No campus activities or holidays scheduled on this date.
                </div>
              ) : (
                activeDetailDay.events.map((ev, idx) => {
                  const style =
                    CATEGORY_STYLES[ev.category] ||
                    CATEGORY_STYLES['Academic & General']
                  return (
                    <div key={idx} className="pt-3.5 first:pt-0 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          {CATEGORY_ICONS[ev.category]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {ev.title}
                          </h4>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1.5 ${style.badgeClass}`}>
                            {ev.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-9 pt-0.5">
                        {ev.club && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                            Club: <strong className="font-bold text-slate-900">{ev.club}</strong>
                          </span>
                        )}
                        {ev.department && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#f4eefe] border border-[#4c1d76]/20 text-[#4c1d76]">
                            Department: <strong className="font-bold text-[#4c1d76]">{ev.department}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {activeDetailDay.events.length} {activeDetailDay.events.length === 1 ? 'event' : 'events'} recorded
              </span>
              <button
                onClick={() => setActiveDetailDay(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#4c1d76] text-white hover:bg-[#3d1561] transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
