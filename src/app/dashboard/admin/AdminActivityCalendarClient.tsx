'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
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
  ArrowUpRight,
  ArrowLeft,
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

// Sophisticated, clean icons matching Donezo's modern iconography
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Tech & Hackathons': <Laptop className="w-4 h-4 text-purple-600 shrink-0" />,
  'Workshops & Seminars': <BookOpen className="w-4 h-4 text-violet-600 shrink-0" />,
  'Sports & Athletics': <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />,
  'Holiday & Festival': <PartyPopper className="w-4 h-4 text-rose-500 shrink-0" />,
  'Cultural & Campus Life': <Sparkles className="w-4 h-4 text-fuchsia-600 shrink-0" />,
  'Trek & Adventure': <Compass className="w-4 h-4 text-teal-600 shrink-0" />,
  'Alumni & Careers': <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />,
  'Academic & General': <Award className="w-4 h-4 text-slate-500 shrink-0" />,
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
    <div className="space-y-6 font-sans w-full">
      {/* ── 1. DONEZO-STYLE TOP HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/admin"
              className="p-1 rounded-full text-slate-400 hover:text-[#4c1d76] hover:bg-[#f4eefe] transition-colors"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20 font-sans">
              MIT-ADT University
            </span>
            <span className="text-xs font-semibold text-slate-400 font-sans">
              Academic Schedule &bull; AY 2026&ndash;2027
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-sans">
            Calendar
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1 font-normal font-sans">
            Plan, prioritize, and track institutional activities and department schedules with ease.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Donezo-style Pill Search Bar with ⌘F */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search task or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-full text-xs font-sans bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/15 shadow-2xs transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-400 pointer-events-none">
                ⌘F
              </span>
            )}
          </div>

          {/* Primary Donezo-style Pill Button: Sync Live */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-5 py-2.5 rounded-full bg-[#4c1d76] hover:bg-[#39125b] text-white text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer btn-press font-sans ${
              refreshSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{refreshSuccess ? 'Synced' : '+ Sync Schedule'}</span>
          </button>

          {/* Secondary Outlined Pill Button: Google Sheets */}
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:border-[#4c1d76]/40 text-slate-700 hover:text-[#4c1d76] text-xs font-semibold shadow-2xs hover:bg-[#faf8ff] transition-all flex items-center gap-2 font-sans"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Import / Sheets</span>
          </a>
        </div>
      </div>

      {/* ── 2. DONEZO-STYLE 4 STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Featured Hero Card (Deep Purple Gradient) */}
        <div className="bg-gradient-to-br from-[#4c1d76] via-[#3b1259] to-[#25093b] text-white rounded-[24px] p-6 shadow-md relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-medium text-white/90 font-sans">Total Events</span>
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition-transform group-hover:scale-110">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3 relative z-10">
            <div className="text-4xl font-extrabold text-white tracking-tight font-sans">
              {currentMonthData.totalEvents}
            </div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/10 text-white/90 text-xs font-medium font-sans">
              <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-[9px] font-bold">✓</span>
              <span>Active in {activeMonthConfig.shortName}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tech & Hackathons (Crisp White Donezo Card) */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 font-sans">Tech &amp; Hackathons</span>
            <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-transform group-hover:scale-110">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
              {stats.tech}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200/80 bg-purple-50/50 text-purple-900 text-xs font-semibold font-sans">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Coding &amp; Hackathons</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sports & Athletics (Crisp White Donezo Card) */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 font-sans">Sports &amp; Athletics</span>
            <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-transform group-hover:scale-110">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
              {stats.sports}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200/80 bg-emerald-50/50 text-emerald-900 text-xs font-semibold font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Tournaments &amp; Meets</span>
            </div>
          </div>
        </div>

        {/* Card 4: Workshops & Seminars (Crisp White Donezo Card) */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 font-sans">Workshops &amp; Seminars</span>
            <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-transform group-hover:scale-110">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
              {stats.workshops}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-200/80 bg-violet-50/50 text-violet-900 text-xs font-semibold font-sans">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              <span>Faculty &amp; Seminars</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. FULL WIDTH CALENDAR CARD (All side sections removed as requested) ── */}
      <div className="w-full bg-white rounded-[28px] border border-slate-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 md:p-8 space-y-6">
        {/* Controls Bar */}
        <div className="space-y-4 pb-4 border-b border-slate-100">
          {/* Row 1: Month Name & Navigation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f4eefe] border border-[#4c1d76]/15 flex items-center justify-center text-[#4c1d76]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                    {activeMonthConfig.name}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20 font-sans">
                    {activeMonthConfig.term}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-sans mt-0.5">
                  {currentMonthData.totalEvents} Total Events Scheduled &bull; Google Sheets Sync
                </p>
              </div>
            </div>

            {/* View Selector (Grid vs Agenda in Donezo pill) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Term Selector in rounded-full pill container */}
              <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80">
                {(['All', 'Odd Semester', 'Even Semester'] as const).map((term) => (
                  <button
                    key={term}
                    onClick={() => setActiveTerm(term)}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold font-sans transition-all cursor-pointer ${
                      activeTerm === term
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {term === 'All' ? 'All' : term.replace(' Semester', '')}
                  </button>
                ))}
              </div>

              {/* Grid / Agenda Switcher */}
              <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-semibold font-sans transition-all text-xs cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#4c1d76] text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-semibold font-sans transition-all text-xs cursor-pointer ${
                    viewMode === 'agenda'
                      ? 'bg-[#4c1d76] text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Agenda</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Month Carousel Steppers & Month Pills */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={handlePrevMonth}
                disabled={MONTH_CONFIGS[0].id === selectedMonthId}
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs flex items-center justify-center shrink-0 cursor-pointer"
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-sans transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#4c1d76] text-white shadow-xs font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-[#faf8ff] hover:text-[#4c1d76] hover:border-[#4c1d76]/30'
                    }`}
                  >
                    <span>{month.shortName.split(' ')[0]}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-500'
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
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs flex items-center justify-center shrink-0 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold font-sans flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Jump</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 z-30 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 animate-scale-up"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 font-sans">
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
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#4c1d76] text-white font-bold'
                              : 'text-slate-700 hover:bg-[#f8f5ff] hover:text-[#4c1d76]'
                          }`}
                        >
                          <span>{m.name}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
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
          </div>

          {/* Row 3: Category Pills (Donezo-style rounded-full chips) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold font-sans shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#4c1d76] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
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
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold font-sans shrink-0 transition-all flex items-center gap-1.5 border cursor-pointer ${
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
        </div>

        {/* ── CALENDAR VIEW CONTENT ── */}
        {viewMode === 'grid' ? (
          /* Full Width Month Calendar Grid */
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Weekday Column Headers */}
              <div className="grid grid-cols-7 gap-2.5 mb-2.5 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={`py-2 text-[11px] font-bold font-sans uppercase tracking-wider rounded-xl ${
                      idx === 0
                        ? 'text-rose-600 bg-rose-50/50'
                        : 'text-slate-500 bg-slate-50'
                    }`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Weeks Grid */}
              <div className="space-y-2.5">
                {(currentMonthData.weeks || []).map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 gap-2.5">
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${wIdx}-${dIdx}`}
                            className="min-h-[120px] rounded-2xl bg-slate-50/40 border border-slate-100"
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
                          className={`min-h-[120px] p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${
                            day.isCurrentMonth
                              ? isToday
                                ? 'bg-[#faf6ff] border-[#4c1d76] shadow-[0_0_0_1.5px_rgba(76,29,118,0.4)] hover:shadow-md'
                                : hasHoliday
                                ? 'bg-rose-50/20 border-rose-200/60 hover:border-rose-300 hover:shadow-sm'
                                : 'bg-white border-slate-200/70 hover:border-[#4c1d76]/40 hover:shadow-[0_4px_16px_rgba(76,29,118,0.06)] hover:-translate-y-0.5'
                              : 'bg-slate-50/30 border-slate-100 opacity-40 hover:opacity-75'
                          }`}
                        >
                          {/* Day Header */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-xs font-bold font-sans px-2.5 py-0.5 rounded-full transition-colors ${
                                isToday
                                  ? 'bg-[#4c1d76] text-white shadow-2xs font-extrabold'
                                  : hasHoliday
                                  ? 'text-rose-700 bg-rose-100/70'
                                  : isSunday
                                  ? 'text-rose-600 bg-rose-50/50'
                                  : day.isCurrentMonth
                                  ? 'text-slate-800 group-hover:text-[#4c1d76]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {day.dayNum}
                            </span>

                            {matchingEvents.length > 0 && (
                              <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded-full bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/15">
                                {matchingEvents.length}
                              </span>
                            )}
                          </div>

                          {/* Event Chips (Shows up to 3 in full width) */}
                          <div className="space-y-1.5 flex-1 overflow-hidden my-1">
                            {matchingEvents.slice(0, 3).map((ev, eIdx) => {
                              const style =
                                CATEGORY_STYLES[ev.category] ||
                                CATEGORY_STYLES['Academic & General']
                              return (
                                <div
                                  key={eIdx}
                                  title={ev.title}
                                  className={`text-[10px] px-2 py-1 rounded-lg border truncate font-medium font-sans flex items-center gap-1.5 shadow-2xs transition-colors ${style.badgeClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotClass}`} />
                                  <span className="truncate">{ev.title}</span>
                                </div>
                              )
                            })}

                            {matchingEvents.length > 3 && (
                              <div className="text-[9px] font-bold font-sans text-[#4c1d76] bg-[#f4eefe]/80 px-2.5 py-0.5 rounded-full border border-[#4c1d76]/15 text-center">
                                +{matchingEvents.length - 3} more
                              </div>
                            )}
                          </div>

                          {/* Hover prompt */}
                          <div className="text-[9px] font-semibold text-slate-400 group-hover:text-[#4c1d76] transition-colors flex justify-end">
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
          /* Full Width Agenda Timeline View */
          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto custom-scrollbar">
            {agendaDays.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium font-sans">
                No campus activities match your current filter parameters.
              </div>
            ) : (
              agendaDays.map(({ day, filteredEvents }) => {
                const hasHoliday = day.events.some((e) => e.category === 'Holiday & Festival')
                const isToday = day.dateStr === todayStr
                const isSunday = day.dayOfWeek.toLowerCase().startsWith('sun')

                return (
                  <div key={day.dateStr} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="sm:w-36 shrink-0">
                      <div
                        className={`p-3.5 rounded-2xl border text-left shadow-2xs ${
                          isToday
                            ? 'bg-[#f4eefe] border-[#4c1d76]/30 text-[#4c1d76]'
                            : hasHoliday || isSunday
                            ? 'bg-rose-50/60 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-2xl font-extrabold leading-none font-sans">
                            {day.dayNum}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 font-sans">
                            {day.dayOfWeek.slice(0, 3)}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium opacity-80 block mt-1 font-sans">
                          {activeMonthConfig.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5">
                      {filteredEvents.map((ev, eIdx) => {
                        const style =
                          CATEGORY_STYLES[ev.category] ||
                          CATEGORY_STYLES['Academic & General']
                        return (
                          <div
                            key={eIdx}
                            onClick={() => setActiveDetailDay(day)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm hover:border-[#4c1d76]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-slate-200/80 ${style.borderClass} border-l-[3.5px]`}
                          >
                            <div className="space-y-1.5">
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
                                {CATEGORY_ICONS[ev.category] || <Award className="w-4 h-4 text-slate-400" />}
                                <span>{ev.title}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-sans ${style.badgeClass}`}
                                >
                                  {ev.category}
                                </span>
                                {ev.club && (
                                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 font-sans">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span>{ev.club}</span>
                                  </span>
                                )}
                                {ev.department && (
                                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f4eefe] border border-[#4c1d76]/20 text-[#4c1d76] flex items-center gap-1 font-sans">
                                    <Building2 className="w-3 h-3 text-[#4c1d76]/70" />
                                    <span>{ev.department}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs font-bold text-[#4c1d76] shrink-0 self-end sm:self-center font-sans opacity-80 hover:opacity-100">
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
      </div>

      {/* ── 4. DONEZO-STYLE DAY DETAILS MODAL ── */}
      {activeDetailDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveDetailDay(null)}
        >
          <div
            className="bg-white border border-slate-100 rounded-[28px] max-w-lg w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-scale-up font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-white to-[#faf7ff] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4c1d76] bg-[#f4eefe] px-2.5 py-0.5 rounded-full border border-[#4c1d76]/20 font-sans">
                    Schedule Details
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-xs font-semibold text-slate-500 font-sans">
                    {activeDetailDay.dayOfWeek}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">
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
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Events Content */}
            <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100 custom-scrollbar">
              {activeDetailDay.events.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium font-sans">
                  No campus activities or holidays scheduled on this date.
                </div>
              ) : (
                activeDetailDay.events.map((ev, idx) => {
                  const style =
                    CATEGORY_STYLES[ev.category] ||
                    CATEGORY_STYLES['Academic & General']
                  return (
                    <div key={idx} className="pt-3.5 first:pt-0 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                          {CATEGORY_ICONS[ev.category]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug font-sans">
                            {ev.title}
                          </h4>
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border mt-1.5 font-sans ${style.badgeClass}`}>
                            {ev.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-11 pt-0.5">
                        {ev.club && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-sans">
                            Club: <strong className="font-bold text-slate-900">{ev.club}</strong>
                          </span>
                        )}
                        {ev.department && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#f4eefe] border border-[#4c1d76]/20 text-[#4c1d76] font-sans">
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
            <div className="p-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 font-sans">
                {activeDetailDay.events.length} {activeDetailDay.events.length === 1 ? 'event' : 'events'} recorded
              </span>
              <button
                onClick={() => setActiveDetailDay(null)}
                className="px-6 py-2 text-xs font-bold rounded-full bg-[#4c1d76] text-white hover:bg-[#3d1561] transition-colors shadow-sm cursor-pointer font-sans"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
