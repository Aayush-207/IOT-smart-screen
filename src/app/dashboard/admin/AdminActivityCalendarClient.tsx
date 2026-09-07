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
  'Holiday & Festival': <PartyPopper className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
  'Tech & Hackathons': <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
  'Sports & Athletics': <Trophy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
  'Workshops & Seminars': <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  'Cultural & Campus Life': <Sparkles className="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />,
  'Trek & Adventure': <Compass className="w-3.5 h-3.5 text-teal-500 shrink-0" />,
  'Alumni & Careers': <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
  'Academic & General': <Award className="w-3.5 h-3.5 text-neutral-400 shrink-0" />,
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
    <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
      {/* Top Header & Structured Navigation */}
      <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-[#212327]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">
                Institutional Calendar &bull; Academic Year 2026&ndash;2027
              </span>
            </div>
            <h2 className="text-xl font-normal tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{activeMonthConfig.name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-neutral-200 dark:border-[#2b2d31] bg-neutral-50 dark:bg-[#18191c] text-neutral-600 dark:text-neutral-400 font-normal">
                {activeMonthConfig.term}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-0.5">
              Full calendar across all academic months: hackathons, sports championships, workshops, and institutional holidays.
            </p>
          </div>

          {/* Structured Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Month Dropdown (Great for direct jumping among 9 months) */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-[#2b2d31] bg-neutral-50 dark:bg-[#18191c] hover:bg-neutral-100 dark:hover:bg-white/5 text-xs text-neutral-900 dark:text-white font-medium flex items-center gap-2 transition-colors"
              >
                <span>Jump to Month: {activeMonthConfig.shortName}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 z-30 w-56 rounded-xl bg-white dark:bg-[#18191c] border border-neutral-200 dark:border-[#2b2d31] shadow-xl py-1 divide-y divide-neutral-100 dark:divide-[#24262a] animate-scale-up"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                      Odd Semester (2026)
                    </div>
                    {MONTH_CONFIGS.filter((m) => m.term === 'Odd Semester').map((m) => {
                      const isSelected = m.id === selectedMonthId
                      const count = monthsData[m.id]?.totalEvents || 0
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMonthId(m.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="font-mono text-[10px] opacity-70">
                            {count} events
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                      Even Semester (2027)
                    </div>
                    {MONTH_CONFIGS.filter((m) => m.term === 'Even Semester').map((m) => {
                      const isSelected = m.id === selectedMonthId
                      const count = monthsData[m.id]?.totalEvents || 0
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMonthId(m.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>{m.name}</span>
                          <span className="font-mono text-[10px] opacity-70">
                            {count} events
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Prev/Next Month Stepper */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                disabled={MONTH_CONFIGS[0].id === selectedMonthId}
                aria-label="Previous Month"
                title="Previous Month"
                className="p-2 rounded-lg border border-neutral-200 dark:border-[#2b2d31] hover:bg-neutral-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-neutral-700 dark:text-neutral-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={MONTH_CONFIGS[MONTH_CONFIGS.length - 1].id === selectedMonthId}
                aria-label="Next Month"
                title="Next Month"
                className="p-2 rounded-lg border border-neutral-200 dark:border-[#2b2d31] hover:bg-neutral-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-neutral-700 dark:text-neutral-300"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sync & Google Sheet link buttons */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Sync latest entries from Google Sheet"
              className="p-2 rounded-lg border border-neutral-200 dark:border-[#2b2d31] hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline font-mono text-[11px]">
                {refreshSuccess ? 'Synced' : 'Sync'}
              </span>
            </button>

            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-[#2b2d31] hover:bg-neutral-100 dark:hover:bg-white/5 text-xs text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Open Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Uncluttered Semester & Months Strip */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-[#1e2023] space-y-3">
          {/* Term Filter Pills & Month Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Term Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-[#1c1d20] border border-neutral-200 dark:border-[#2b2d31] self-start text-xs">
              {(['All', 'Odd Semester', 'Even Semester'] as const).map((term) => (
                <button
                  key={term}
                  onClick={() => setActiveTerm(term)}
                  className={`px-2.5 py-1 rounded-md transition-all font-mono text-[11px] ${
                    activeTerm === term
                      ? 'bg-white dark:bg-[#282a2e] text-neutral-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {term === 'All' ? 'All (9 Months)' : term}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono text-neutral-400 dark:text-[#7d8187]">
              Showing <strong className="text-neutral-700 dark:text-neutral-300">{activeMonthConfig.name}</strong> ({currentMonthData.totalEvents} activities)
            </div>
          </div>

          {/* Month Pills Selector (Smooth horizontal scroll, clean badges) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filteredMonths.map((month) => {
              const isActive = month.id === selectedMonthId
              const mData = monthsData[month.id]
              return (
                <button
                  key={month.id}
                  onClick={() => setSelectedMonthId(month.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs font-semibold'
                      : 'bg-neutral-50 dark:bg-[#18191c] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#2b2d31] hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <span>{month.shortName}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-900'
                        : 'bg-neutral-200/70 dark:bg-white/10 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {mData?.totalEvents ?? '...'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Month Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#18191c] border border-neutral-200/80 dark:border-[#26282c]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-[#7d8187] uppercase">
                Total Events
              </span>
              <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-xl font-normal text-neutral-900 dark:text-white mt-1">
              {stats.total}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-400 uppercase">
                Tech &amp; Coding
              </span>
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-normal text-indigo-900 dark:text-indigo-300 mt-1">
              {stats.tech}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 uppercase">
                Sports
              </span>
              <Trophy className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-normal text-emerald-900 dark:text-emerald-300 mt-1">
              {stats.sports}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 uppercase">
                Workshops
              </span>
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-normal text-amber-900 dark:text-amber-300 mt-1">
              {stats.workshops}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400 uppercase">
                Holidays
              </span>
              <PartyPopper className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-normal text-rose-900 dark:text-rose-300 mt-1">
              {stats.holidays}
            </div>
          </div>
        </div>

        {/* Search, Filter and View Toggle Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-[#1e2023]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search event, club (e.g. GDG, Hackathon, Volleyball, Trek)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-[#18191c] border border-neutral-200 dark:border-[#2b2d31] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-neutral-400 dark:focus:border-[#42454b] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-[#1c1d20] border border-neutral-200 dark:border-[#2b2d31] rounded-lg text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#282a2e] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Calendar Grid</span>
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-[#282a2e] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda ({agendaDays.length} days)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-3 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono shrink-0 transition-all border ${
              selectedCategory === 'ALL'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium'
                : 'bg-neutral-50 dark:bg-[#18191c] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#2b2d31] hover:text-neutral-900 dark:hover:text-white'
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
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? `${style.badgeClass} border-current font-medium shadow-2xs`
                    : 'bg-neutral-50 dark:bg-[#18191c] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#2b2d31] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
                <span>{catKey}</span>
              </button>
            )
          })}
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
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/10'
                      : 'text-neutral-500 dark:text-neutral-400 bg-neutral-50/70 dark:bg-white/5'
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
                          className="min-h-[105px] rounded-lg bg-neutral-50/40 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/[0.03]"
                        />
                      )
                    }

                    const matchingEvents = day.events.filter(filterEvent)
                    const hasHoliday = day.events.some(
                      (e) => e.category === 'Holiday & Festival'
                    )
                    const hasActiveFilter =
                      searchQuery.trim() !== '' || selectedCategory !== 'ALL'

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => setActiveDetailDay(day)}
                        className={`min-h-[110px] p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group ${
                          day.isCurrentMonth
                            ? hasHoliday
                              ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700/50'
                              : 'bg-white dark:bg-[#18191c] border-neutral-200/80 dark:border-[#26282c] hover:border-neutral-300 dark:hover:border-[#383b40] hover:shadow-xs'
                            : 'bg-neutral-50/50 dark:bg-white/[0.02] border-neutral-100 dark:border-white/[0.04] opacity-40 hover:opacity-75'
                        }`}
                      >
                        {/* Day header */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${
                              hasHoliday
                                ? 'text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/50'
                                : dIdx === 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : day.isCurrentMonth
                                ? 'text-neutral-900 dark:text-neutral-100'
                                : 'text-neutral-400 dark:text-neutral-600'
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          {matchingEvents.length > 0 && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                hasActiveFilter
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium'
                                  : 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
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
                            <div className="text-[9px] font-mono text-neutral-500 dark:text-[#7d8187] pl-1 font-medium group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                              +{matchingEvents.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Footer hover indicator */}
                        <div className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
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
        <div className="p-4 sm:p-6 divide-y divide-neutral-100 dark:divide-[#1e2023] max-h-[640px] overflow-y-auto">
          {agendaDays.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 font-mono text-xs">
              No campus events match your current search and category filters.
            </div>
          ) : (
            agendaDays.map(({ day, filteredEvents }) => {
              const hasHoliday = day.events.some((e) => e.category === 'Holiday & Festival')
              return (
                <div key={day.dateStr} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-3 sm:gap-6">
                  {/* Date Badge */}
                  <div className="sm:w-36 shrink-0">
                    <div
                      className={`inline-flex sm:flex flex-col p-2.5 rounded-lg border text-left ${
                        hasHoliday
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                          : 'bg-neutral-50 dark:bg-[#18191c] border-neutral-200/80 dark:border-[#26282c]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white leading-none">
                          {day.dayNum}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          {day.dayOfWeek.slice(0, 3)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1">
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
                          className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-[#18191c] border-neutral-200/70 dark:border-[#24262a] hover:border-neutral-300 dark:hover:border-[#383b40] ${style.borderClass} border-l-4`}
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                              {CATEGORY_ICONS[ev.category] || <Award className="w-3.5 h-3.5 text-neutral-400" />}
                              <span>{ev.title}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${style.badgeClass}`}
                              >
                                {ev.category}
                              </span>
                              {ev.club && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                                  Club: {ev.club}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-neutral-400 shrink-0 self-end sm:self-center">
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
      <div className="p-4 sm:p-5 bg-neutral-50/70 dark:bg-[#18191c]/70 border-t border-neutral-200 dark:border-[#212327]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-[#7d8187]">
              Legend:
            </span>
            {categoriesList.map((catKey) => {
              const style = CATEGORY_STYLES[catKey]
              return (
                <div key={catKey} className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                  <span className={`w-2 h-2 rounded-full ${style.dotClass}`} />
                  <span>{catKey}</span>
                </div>
              )
            })}
          </div>

          <div className="text-[11px] font-mono text-neutral-400 dark:text-[#7d8187] flex items-center gap-2">
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
            className="bg-white dark:bg-[#18191c] border border-neutral-200 dark:border-[#282a2e] rounded-xl max-w-lg w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-[#24262a] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Day Schedule Details
                  </span>
                  <span className="text-neutral-400">&bull;</span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {activeDetailDay.dayOfWeek}
                  </span>
                </div>
                <h3 className="text-lg font-normal text-neutral-900 dark:text-white">
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
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Events Content */}
            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-neutral-100 dark:divide-[#212327]">
              {activeDetailDay.events.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 font-mono text-xs">
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
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-white leading-snug">
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
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                            Organizing Unit: <strong className="font-semibold">{ev.club}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 dark:bg-[#141414] border-t border-neutral-200 dark:border-[#24262a] flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                {activeDetailDay.events.length} {activeDetailDay.events.length === 1 ? 'event' : 'events'} recorded
              </span>
              <button
                onClick={() => setActiveDetailDay(null)}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
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
