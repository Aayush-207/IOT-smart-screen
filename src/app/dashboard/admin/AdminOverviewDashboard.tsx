'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  CalendarDays,
  ExternalLink,
  User,
  Search,
  X,
  Sparkles,
  ChevronRight,
  GraduationCap,
  ArrowUpRight,
} from 'lucide-react'
import { ORG_DATA, TOTAL_CLUBS, TOTAL_SCHOOLS, TOTAL_EVENTS } from '@/lib/data/orgData'

interface DepartmentItem {
  id: string
  name: string
  code?: string | null
  hod_id?: string | null
  profiles?: { email?: string | null } | null
}

export function AdminOverviewDashboard({
  departments = [],
}: {
  departments?: DepartmentItem[]
}) {
  const [activeSchoolId, setActiveSchoolId] = useState<string>(ORG_DATA[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [hoveredBox, setHoveredBox] = useState<'schools' | 'departments' | 'clubs' | null>(null)
  const [clubFilterInPopup, setClubFilterInPopup] = useState<string>('')
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (box: 'schools' | 'departments' | 'clubs') => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHoveredBox(box)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBox(null)
      setClubFilterInPopup('')
    }, 220)
  }

  const activeSchool = useMemo(() => {
    return ORG_DATA.find(s => s.id === activeSchoolId) || ORG_DATA[0]
  }, [activeSchoolId])

  // Flat list of all clubs across all schools for the clubs hover window
  const allClubs = useMemo(() => {
    return ORG_DATA.flatMap(school =>
      school.clubs.map(club => ({
        ...club,
        schoolId: school.id,
        schoolName: school.name,
      }))
    )
  }, [])

  // Filtered list for the clubs hover popup
  const filteredPopupClubs = useMemo(() => {
    if (!clubFilterInPopup.trim()) return allClubs
    const q = clubFilterInPopup.toLowerCase().trim()
    return allClubs.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.schoolName.toLowerCase().includes(q) ||
        c.facultyAdvisor.toLowerCase().includes(q)
    )
  }, [allClubs, clubFilterInPopup])

  // Filter clubs within the active school for the main view
  const filteredClubs = useMemo(() => {
    if (!activeSchool) return []
    if (!searchQuery.trim()) return activeSchool.clubs

    const q = searchQuery.toLowerCase().trim()
    return activeSchool.clubs.filter(club => {
      const matchName = club.name.toLowerCase().includes(q)
      const matchShort = club.shortName.toLowerCase().includes(q)
      const matchAdvisor = club.facultyAdvisor.toLowerCase().includes(q)
      const matchEvents = club.events.some(
        e => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
      )
      return matchName || matchShort || matchAdvisor || matchEvents
    })
  }, [activeSchool, searchQuery])

  return (
    <div className="space-y-6">
      {/* ── 1. TOP KPI METRIC CARDS WITH HOVER FLYOUTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
        {/* Box 1: Institutes & Schools */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('schools')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white border border-slate-200/90 hover:border-[#4c1d76]/40 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider flex items-center gap-1">
                <span>{TOTAL_EVENTS} Events</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{TOTAL_SCHOOLS}</div>
              <div className="text-slate-500 font-semibold text-xs flex items-center justify-between">
                <span>Institutes &amp; Schools</span>
                <span className="text-[10px] text-[#4c1d76] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Hover to view &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Hover Window for Institutes & Schools */}
          <AnimatePresence>
            {hoveredBox === 'schools' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_20px_45px_rgba(76,29,118,0.14)] p-4 z-50"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#4c1d76]" />
                    <span className="text-xs font-bold text-slate-900">All Institutes ({ORG_DATA.length})</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">Click to select</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {ORG_DATA.map(school => {
                    const isSelected = activeSchoolId === school.id
                    return (
                      <button
                        key={school.id}
                        onClick={() => {
                          setActiveSchoolId(school.id)
                          setSearchQuery('')
                          setHoveredBox(null)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#4c1d76] text-white font-bold'
                            : 'hover:bg-[#f4eefe] text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{school.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {school.clubs.length} clubs
                        </span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Box 2: Academic Departments */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('departments')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white border border-slate-200/90 hover:border-[#4c1d76]/40 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider flex items-center gap-1">
                <span>{departments.length} Units</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{departments.length}</div>
              <div className="text-slate-500 font-semibold text-xs flex items-center justify-between">
                <span>Academic Departments</span>
                <span className="text-[10px] text-[#4c1d76] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Hover to view &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Hover Window for Academic Departments */}
          <AnimatePresence>
            {hoveredBox === 'departments' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_20px_45px_rgba(76,29,118,0.14)] p-4 z-50"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#4c1d76]" />
                    <span className="text-xs font-bold text-slate-900">
                      Registered Departments ({departments.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Routing Nodes
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {departments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No departments found.</div>
                  ) : (
                    departments.map(dept => (
                      <div
                        key={dept.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-[#fcfaff] hover:border-[#4c1d76]/20 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{dept.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {dept.profiles?.email ? `HOD: ${dept.profiles.email}` : 'No HOD assigned'}
                          </p>
                        </div>
                        {dept.code && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#4c1d76]/10 text-[#4c1d76] shrink-0">
                            {dept.code}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Box 3: Student Clubs & Chapters */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('clubs')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white border border-slate-200/90 hover:border-[#4c1d76]/40 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider flex items-center gap-1">
                <span>{TOTAL_CLUBS} Total</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{TOTAL_CLUBS}</div>
              <div className="text-slate-500 font-semibold text-xs flex items-center justify-between">
                <span>Student Clubs &amp; Chapters</span>
                <span className="text-[10px] text-[#4c1d76] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Hover to view &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Hover Window for Student Clubs */}
          <AnimatePresence>
            {hoveredBox === 'clubs' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_20px_45px_rgba(76,29,118,0.14)] p-4 z-50"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#4c1d76]" />
                    <span className="text-xs font-bold text-slate-900">Student Clubs ({allClubs.length})</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">11 Institutes</span>
                </div>

                {/* Filter Input in Popup */}
                <div className="relative mb-2">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter clubs..."
                    value={clubFilterInPopup}
                    onChange={e => setClubFilterInPopup(e.target.value)}
                    className="w-full pl-7 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4c1d76]"
                    onClick={e => e.stopPropagation()}
                  />
                  {clubFilterInPopup && (
                    <button
                      onClick={() => setClubFilterInPopup('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {filteredPopupClubs.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">No clubs match filter.</div>
                  ) : (
                    filteredPopupClubs.map(club => (
                      <button
                        key={club.id}
                        onClick={() => {
                          setActiveSchoolId(club.schoolId)
                          setSearchQuery(club.shortName)
                          setHoveredBox(null)
                          setClubFilterInPopup('')
                        }}
                        className="w-full text-left p-2 rounded-xl text-xs hover:bg-[#f4eefe] flex items-center justify-between transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#4c1d76]/10 text-[#4c1d76]">
                              {club.shortName}
                            </span>
                            <span className="font-semibold text-slate-800 truncate group-hover:text-[#4c1d76]">
                              {club.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {club.schoolName.replace(/MIT-/, '')}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {club.events.length} evts
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 2. UNIVERSITY INSTITUTES & CLUBS DIRECTORY ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Console Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#4c1d76] shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">University Institutes &amp; Clubs</h2>
              <p className="text-xs text-slate-400 font-medium">Select an institute to view clubs and scheduled activities.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search club or event..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4c1d76] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Calendar Link */}
            <Link
              href="/dashboard/admin/calendar"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f4eefe] hover:bg-[#ebdffd] text-[#4c1d76] border border-[#4c1d76]/20 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        {/* Master Detail Split View - All 11 Institutes Fit Without Scroll on Desktop */}
        <div className="flex flex-col md:flex-row h-auto md:h-[860px] bg-[#faf8ff] overflow-hidden">
          {/* Left Column (Master): Institutes list */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200/80 bg-white flex flex-col h-full shrink-0">
            <div className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <span>Institutes ({ORG_DATA.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {ORG_DATA.map(school => {
                const isActive = activeSchoolId === school.id
                return (
                  <button
                    key={school.id}
                    onClick={() => {
                      setActiveSchoolId(school.id)
                      setSearchQuery('')
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#4c1d76] text-white shadow-xs'
                        : 'bg-transparent hover:bg-purple-50/50 text-slate-700 hover:text-[#4c1d76]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-[#4c1d76]'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 pr-1">
                      <h3 className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {school.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                          {school.clubs.length} Clubs
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {school.totalEvents} Events
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-300'
                    }`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column (Detail): Clubs Grid & Extended Events Scroll */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf8ff]">
            {/* Detail Subheader */}
            <div className="px-6 py-3 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#4c1d76]" />
                <h3 className="text-xs font-bold text-slate-900 truncate">{activeSchool.name}</h3>
                <span className="text-[11px] text-slate-400 font-medium">({filteredClubs.length} Clubs)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f4eefe] rounded-lg border border-[#4c1d76]/15 text-[10px] font-bold text-[#4c1d76]">
                <Sparkles className="w-3 h-3" />
                <span>{activeSchool.totalEvents} Total Events</span>
              </div>
            </div>

            {/* Scrollable Clubs Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSchoolId + searchQuery}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {filteredClubs.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 shadow-xs">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-2 text-[#4c1d76]">
                        <Users className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {searchQuery ? 'No matching clubs or events' : 'No active clubs registered'}
                      </h4>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2.5 px-3 py-1 bg-[#4c1d76] text-white rounded-lg text-xs font-semibold hover:bg-[#39125b] transition-colors cursor-pointer"
                        >
                          Clear Search Filter
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {filteredClubs.map((club) => (
                        <div
                          key={club.id}
                          className="bg-white rounded-xl p-4.5 shadow-xs border border-slate-200/90 hover:border-[#4c1d76]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                        >
                          {/* Club Header */}
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20">
                                    {club.shortName}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {club.events.length} {club.events.length === 1 ? 'Event' : 'Events'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-[#4c1d76] transition-colors line-clamp-2">
                                  {club.name}
                                </h4>
                              </div>
                            </div>

                            {/* Faculty Advisor */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <User className="w-3 h-3 text-[#4c1d76] shrink-0" />
                              <span className="text-[11px] font-medium text-slate-400">Advisor:</span>
                              <span className="text-[11px] font-semibold text-slate-700 truncate">{club.facultyAdvisor}</span>
                            </div>
                          </div>

                          {/* Events List */}
                          <div className="pt-2.5 border-t border-slate-100 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3 text-[#4c1d76]" /> Scheduled Activities
                              </span>
                            </div>

                            {club.events.length === 0 ? (
                              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 border-dashed text-center flex-1 flex items-center justify-center">
                                <p className="text-[11px] text-slate-400 font-medium">No events scheduled right now.</p>
                              </div>
                            ) : (
                              <div className="max-h-[230px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                                {club.events.map(evt => (
                                  <div
                                    key={evt.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-[#fcfaff] hover:border-[#4c1d76]/25 transition-all"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <div className="w-6 h-6 rounded-md bg-[#f4eefe] border border-[#4c1d76]/20 flex items-center justify-center shrink-0 text-[#4c1d76]">
                                        <CalendarDays className="w-3 h-3" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{evt.name}</p>
                                        <p className="text-[10px] font-medium text-slate-400 truncate">{evt.category}</p>
                                      </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-[#4c1d76] bg-white px-2 py-0.5 rounded-md border border-[#4c1d76]/20 shrink-0 whitespace-nowrap shadow-2xs">
                                      {evt.dateStr.split(',')[0]}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* View in Calendar */}
                            <Link
                              href="/dashboard/admin/calendar"
                              className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-bold text-[#4c1d76] hover:text-[#320f52] flex items-center justify-between group/link transition-colors"
                            >
                              <span>View in Calendar</span>
                              <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
