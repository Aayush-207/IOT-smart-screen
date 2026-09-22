'use client'

import { useState, useMemo } from 'react'
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
  Check,
  ChevronDown,
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Holiday & Festival': <PartyPopper className="w-3.5 h-3.5 text-[#ef2045] shrink-0" />,
  'Tech & Hackathons': <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
  'Sports & Athletics': <Trophy className="w-3.5 h-3.5 text-[#00eaff] shrink-0" />,
  'Workshops & Seminars': <BookOpen className="w-3.5 h-3.5 text-[#af1591] shrink-0" />,
  'Cultural & Campus Life': <Sparkles className="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />,
  'Trek & Adventure': <Compass className="w-3.5 h-3.5 text-teal-500 shrink-0" />,
  'Alumni & Careers': <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
  'Academic & General': <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
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

  // Categories list
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

  // Filter months by semester term if filtered
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
      const catMatch = event.category.toLowerCase().includes(q)
      if (!titleMatch && !clubMatch && !catMatch) return false
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
    <div className="bg-white  border border-slate-200  rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
      {/* Top Header & Structured Navigation */}
      <div className="p-4 sm:p-5 border-b border-slate-200  space-y-4">
        {/* ROW 1: Title & Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-slate-100  text-slate-800 ">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-medium text-slate-900  flex items-center gap-2">
                <span>{activeMonthConfig.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-200  bg-slate-50  text-slate-600 ">
                  {activeMonthConfig.term}
                </span>
              </h2>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500  mt-0.5">
                Academic Year 2026&ndash;2027
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search events, clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-50  border border-slate-200  text-slate-900  placeholder-slate-400 focus:outline-hidden focus:border-slate-400  transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 "
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Sync latest entries"
              className="p-1.5 rounded-lg border border-slate-200  hover:bg-slate-100  transition-colors text-slate-700 "
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Google Sheet"
              className="p-1.5 rounded-lg border border-slate-200  hover:bg-slate-100  transition-colors text-slate-700 "
            >
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
          </div>
        </div>

        {/* ROW 2: Filters, View Toggles, Jump */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {/* Term Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100  border border-slate-200  shrink-0 text-xs">
              {(['All', 'Odd Semester', 'Even Semester'] as const).map((term) => (
                <button
                  key={term}
                  onClick={() => setActiveTerm(term)}
                  className={`px-2 py-1 rounded-md transition-all font-mono text-[10px] ${
                    activeTerm === term
                      ? 'bg-white  text-slate-900  font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 '
                  }`}
                >
                  {term === 'All' ? 'All' : term.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-slate-200  mx-1 shrink-0" />

            {/* Steppers & Month Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handlePrevMonth}
                disabled={MONTH_CONFIGS[0].id === selectedMonthId}
                className="p-1 rounded-md border border-slate-200  hover:bg-slate-100  disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700 "
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {filteredMonths.map((month) => {
                const isActive = month.id === selectedMonthId
                const mData = monthsData[month.id]
                return (
                  <button
                    key={month.id}
                    onClick={() => setSelectedMonthId(month.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#121826] text-white   border-[#121826]  shadow-xs font-semibold'
                        : 'bg-slate-50  text-slate-600  border-slate-200  hover:text-slate-900 '
                    }`}
                  >
                    <span>{month.shortName.split(' ')[0]}</span>
                    <span
                      className={`font-mono text-[9px] px-1 py-0.5 rounded-sm ${
                        isActive
                          ? 'bg-white/20 text-white  '
                          : 'bg-slate-200/70  text-slate-500 '
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
                className="p-1 rounded-md border border-slate-200  hover:bg-slate-100  disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700 "
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Jump Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200  bg-slate-50  hover:bg-slate-100  text-[11px] text-slate-900  font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Jump</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 z-30 w-48 rounded-xl bg-white  border border-slate-200  shadow-xl py-1 divide-y divide-slate-100  animate-scale-up"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="p-1 max-h-64 overflow-y-auto scrollbar-none">
                    {MONTH_CONFIGS.map((m) => {
                      const isSelected = m.id === selectedMonthId
                      const count = monthsData[m.id]?.totalEvents || 0
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMonthId(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#121826] text-white   font-semibold'
                              : 'text-slate-700  hover:bg-slate-100 '
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="font-mono text-[9px] opacity-70">{count} events</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center p-0.5 bg-slate-100  border border-slate-200  rounded-lg text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all text-[11px] ${
                  viewMode === 'grid'
                    ? 'bg-white  text-slate-900  shadow-xs'
                    : 'text-slate-600  hover:text-slate-900 '
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all text-[11px] ${
                  viewMode === 'agenda'
                    ? 'bg-white  text-slate-900  shadow-xs'
                    : 'text-slate-600  hover:text-slate-900 '
                }`}
              >
                <List className="w-3 h-3" />
                <span className="hidden sm:inline">Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* ROW 3: Categories & Compact Stats */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-t border-slate-100  pt-3">
          {/* Category Pill Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2 py-1 rounded-full text-[10px] font-mono shrink-0 transition-all border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#121826] text-white   border-[#121826]  font-medium'
                  : 'bg-slate-50  text-slate-600  border-slate-200  hover:text-slate-900 '
              }`}
            >
              All
            </button>
            {categoriesList.map((catKey) => {
              const isSelected = selectedCategory === catKey
              const style = CATEGORY_STYLES[catKey]
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2 py-1 rounded-full text-[10px] font-mono shrink-0 transition-all border flex items-center gap-1 ${
                    isSelected
                      ? `${style.badgeClass} border-current font-medium shadow-2xs`
                      : 'bg-slate-50  text-slate-600  border-slate-200  hover:text-slate-900 '
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
                  <span>{catKey.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Compact Stats */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono shrink-0">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100  border border-slate-200  text-slate-700 ">
              <CalendarDays className="w-3 h-3 opacity-70" />
              <span>{stats.total} Total</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50  border border-indigo-100  text-indigo-700 ">
              <Laptop className="w-3 h-3 opacity-70" />
              <span>{stats.tech} Tech</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00eaff]/10  border border-[#00eaff]/10  text-[#00eaff] ">
              <Trophy className="w-3 h-3 opacity-70" />
              <span>{stats.sports} Sports</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#af1591]/10  border border-[#af1591]/10  text-[#af1591] ">
              <BookOpen className="w-3 h-3 opacity-70" />
              <span>{stats.workshops} Workshop</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ffeaea]  border border-[#ffeaea]  text-[#ef2045] ">
              <PartyPopper className="w-3 h-3 opacity-70" />
              <span>{stats.holidays} Holiday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'grid' ? (
        /* Calendar Grid View */
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-2 text-[11px] font-mono font-medium uppercase tracking-wider rounded-md ${
                    idx === 0
                      ? 'text-[#ef2045]  bg-[#ffeaea]/40 '
                      : 'text-slate-500  bg-slate-50/70 '
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Weeks Grid */}
            <div className="space-y-1.5">
              {(currentMonthData.weeks || []).map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-7 gap-1.5">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${wIdx}-${dIdx}`}
                          className="min-h-[105px] rounded-lg bg-slate-50/40  border border-slate-100 "
                        />
                      )
                    }

                    const matchingEvents = day.events.filter(filterEvent)
                    const hasHoliday = day.events.some(
                      (e) => e.category === 'Holiday & Festival'
                    )
                    const hasActiveFilter =
                      searchQuery.trim() !== '' || selectedCategory !== 'ALL'
                    const isToday = day.dateStr === todayStr

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => setActiveDetailDay(day)}
                        className={`min-h-[110px] p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group ${
                          day.isCurrentMonth
                            ? isToday
                              ? 'bg-blue-50/50  border-blue-400  shadow-[0_0_0_1px_rgba(59,130,246,0.5)] hover:border-blue-500'
                              : hasHoliday
                                ? 'bg-[#ffeaea]/30  border-[#ef2045]/30  hover:border-[#ef2045] '
                                : 'bg-white  border-slate-200/80  hover:border-slate-300  hover:shadow-xs'
                            : 'bg-slate-50/50  border-slate-100  opacity-40 hover:opacity-75'
                        }`}
                      >
                        {/* Day header */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${
                              isToday
                                ? 'text-white bg-blue-600'
                                : hasHoliday
                                ? 'text-[#ef2045]  bg-[#ffeaea]/70 '
                                : dIdx === 0
                                ? 'text-[#ef2045] '
                                : day.isCurrentMonth
                                ? 'text-slate-900 '
                                : 'text-slate-400 '
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          {matchingEvents.length > 0 && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                hasActiveFilter
                                  ? 'bg-blue-100 text-blue-800   font-medium'
                                  : 'bg-slate-100  text-slate-600 '
                              }`}
                            >
                              {matchingEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events Preview Chips */}
                        <div className="space-y-1 flex-1 overflow-hidden my-0.5">
                          {matchingEvents.slice(0, 2).map((ev, eIdx) => {
                            const style =
                              CATEGORY_STYLES[ev.category] ||
                              CATEGORY_STYLES['Academic & General']
                            return (
                              <div
                                key={eIdx}
                                title={ev.title}
                                className={`text-[10px] px-1.5 py-0.5 rounded border truncate transition-colors font-medium flex items-center gap-1 ${style.badgeClass}`}
                              >
                                <span className={`w-1 h-1 rounded-full shrink-0 ${style.dotClass}`} />
                                <span className="truncate">{ev.title}</span>
                              </div>
                            )
                          })}

                          {matchingEvents.length > 2 && (
                            <div className="text-[9px] font-mono text-slate-500  pl-1 font-medium group-hover:text-slate-900  transition-colors">
                              +{matchingEvents.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Footer hover indicator */}
                        <div className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <span>View Details &rarr;</span>
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
        /* Agenda / List View */
        <div className="p-4 sm:p-6 divide-y divide-slate-100  max-h-[640px] overflow-y-auto">
          {agendaDays.length === 0 ? (
            <div className="py-12 text-center text-slate-400  font-mono text-xs">
              No campus events match your current search and category filters.
            </div>
          ) : (
            agendaDays.map(({ day, filteredEvents }) => {
              const hasHoliday = day.events.some((e) => e.category === 'Holiday & Festival')
              const isToday = day.dateStr === todayStr
              return (
                <div key={day.dateStr} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-3 sm:gap-6">
                  {/* Date Badge */}
                  <div className="sm:w-36 shrink-0">
                    <div
                      className={`inline-flex sm:flex flex-col p-2.5 rounded-lg border text-left ${
                        isToday
                          ? 'bg-blue-50  border-blue-400 '
                          : hasHoliday
                          ? 'bg-[#ffeaea]  border-[#ef2045]/30 '
                          : 'bg-slate-50  border-slate-200/80 '
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xl font-bold font-mono leading-none ${isToday ? 'text-blue-700 ' : 'text-slate-900 '}`}>
                          {day.dayNum}
                        </span>
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isToday ? 'text-blue-600  font-semibold' : 'text-slate-500 '}`}>
                          {day.dayOfWeek.slice(0, 3)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500  mt-1">
                        {activeMonthConfig.name}
                      </span>
                    </div>
                  </div>

                  {/* Day Events List */}
                  <div className="flex-1 space-y-2">
                    {filteredEvents.map((ev, eIdx) => {
                      const style =
                        CATEGORY_STYLES[ev.category] ||
                        CATEGORY_STYLES['Academic & General']
                      return (
                        <div
                          key={eIdx}
                          onClick={() => setActiveDetailDay(day)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white  border-slate-200/70  hover:border-slate-300  ${style.borderClass} border-l-4`}
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-900  flex items-center gap-1.5">
                              {CATEGORY_ICONS[ev.category] || <Award className="w-3.5 h-3.5 text-slate-400" />}
                              <span>{ev.title}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${style.badgeClass}`}
                              >
                                {ev.category}
                              </span>
                              {ev.club && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100  border border-slate-200  text-slate-600 ">
                                  Club: {ev.club}
                                </span>
                              )}
                              {ev.department && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50  border border-indigo-200  text-indigo-700 ">
                                  Dept: {ev.department}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 shrink-0 self-end sm:self-center">
                            Inspect &rarr;
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

      {/* Category Legend & Sheet Info Footer */}
      <div className="p-4 sm:p-5 bg-slate-50/70  border-t border-slate-200 ">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 ">
              Legend:
            </span>
            {categoriesList.map((catKey) => {
              const style = CATEGORY_STYLES[catKey]
              return (
                <div key={catKey} className="flex items-center gap-1.5 text-[11px] text-slate-600 ">
                  <span className={`w-2 h-2 rounded-full ${style.dotClass}`} />
                  <span>{catKey}</span>
                </div>
              )
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400  flex items-center gap-2">
            <span>Month GID: {activeMonthConfig.gid}</span>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {activeDetailDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveDetailDay(null)}
        >
          <div
            className="bg-white  border border-slate-200  rounded-xl max-w-lg w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200  flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-blue-600 ">
                    Day Schedule Details
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {activeDetailDay.dayOfWeek}
                  </span>
                </div>
                <h3 className="text-lg font-normal text-slate-900 ">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900  hover:bg-slate-100  transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Events Content */}
            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 ">
              {activeDetailDay.events.length === 0 ? (
                <div className="py-8 text-center text-slate-400  font-mono text-xs">
                  No campus activities or holidays scheduled on this date.
                </div>
              ) : (
                activeDetailDay.events.map((ev, idx) => {
                  const style =
                    CATEGORY_STYLES[ev.category] ||
                    CATEGORY_STYLES['Academic & General']
                  return (
                    <div key={idx} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5">{CATEGORY_ICONS[ev.category]}</span>
                          <h4 className="text-sm font-medium text-slate-900  leading-snug">
                            {ev.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-6">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${style.badgeClass}`}
                        >
                          {ev.category}
                        </span>

                        {ev.club && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100  border border-slate-200  text-slate-600 ">
                            Club: <strong className="font-semibold">{ev.club}</strong>
                          </span>
                        )}
                        {ev.department && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50  border border-indigo-200  text-indigo-700 ">
                            Department: <strong className="font-semibold">{ev.department}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50  border-t border-slate-200  flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 ">
                {activeDetailDay.events.length} {activeDetailDay.events.length === 1 ? 'event' : 'events'} recorded
              </span>
              <button
                onClick={() => setActiveDetailDay(null)}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[#121826] text-white   hover:opacity-90 transition-opacity"
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
