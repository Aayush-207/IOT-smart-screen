'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Network,
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
  Info
} from 'lucide-react'
import { ORG_DATA, TOTAL_CLUBS, TOTAL_SCHOOLS, TOTAL_EVENTS, School, Club } from '@/lib/data/orgData'

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
    }, 200)
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
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Executive KPI Cards with Interactive Hover Popover Windows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
        
        {/* Box 1: Institutes & Schools */}
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter('schools')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-gradient-to-br from-white via-white to-[#fbf9fe] border border-[#4c1d76]/20 p-5 rounded-2xl shadow-sm hover:border-[#4c1d76]/40 hover:shadow-[0_8px_25px_rgba(76,29,118,0.12)] transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center border border-[#4c1d76]/20 text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider flex items-center gap-1">
                <span>{TOTAL_EVENTS} Events</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{TOTAL_SCHOOLS}</div>
            <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Institutes &amp; Schools</span>
              <span className="text-[10px] text-[#4c1d76] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                Hover to view
              </span>
            </div>
          </div>

          {/* Hover Window for Institutes & Schools */}
          <AnimatePresence>
            {hoveredBox === 'schools' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-[#4c1d76]/25 rounded-2xl shadow-[0_20px_45px_rgba(76,29,118,0.2)] p-4 z-50"
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
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#4c1d76] text-white font-bold shadow-xs'
                            : 'hover:bg-[#f4eefe] text-slate-700 hover:text-[#4c1d76]'
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{school.name.replace(/MIT-/, '')}</span>
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {school.clubs.length} clubs
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              isSelected ? 'bg-white/30 text-white' : 'bg-[#4c1d76]/10 text-[#4c1d76]'
                            }`}
                          >
                            {school.totalEvents} evts
                          </span>
                        </div>
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
          <div className="bg-gradient-to-br from-white via-white to-[#fbf9fe] border border-[#4c1d76]/20 p-5 rounded-2xl shadow-sm hover:border-[#4c1d76]/40 hover:shadow-[0_8px_25px_rgba(76,29,118,0.12)] transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center border border-[#4c1d76]/20 text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
                <Network className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Mesh
              </span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{departments.length}</div>
            <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Academic Departments</span>
              <span className="text-[10px] text-[#4c1d76] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                Hover to view
              </span>
            </div>
          </div>

          {/* Hover Window for Academic Departments */}
          <AnimatePresence>
            {hoveredBox === 'departments' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-[#4c1d76]/25 rounded-2xl shadow-[0_20px_45px_rgba(76,29,118,0.2)] p-4 z-50"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-[#4c1d76]" />
                    <span className="text-xs font-bold text-slate-900">
                      Registered Departments ({departments.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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
                        className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 hover:bg-[#fcfaff] hover:border-[#4c1d76]/20 transition-colors flex items-center justify-between gap-2"
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
          <div className="bg-gradient-to-br from-white via-white to-[#fbf9fe] border border-[#4c1d76]/20 p-5 rounded-2xl shadow-sm hover:border-[#4c1d76]/40 hover:shadow-[0_8px_25px_rgba(76,29,118,0.12)] transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center border border-[#4c1d76]/20 text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider flex items-center gap-1">
                <span>{TOTAL_CLUBS} Total</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{TOTAL_CLUBS}</div>
            <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Student Clubs &amp; Chapters</span>
              <span className="text-[10px] text-[#4c1d76] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                Hover to view
              </span>
            </div>
          </div>

          {/* Hover Window for Student Clubs */}
          <AnimatePresence>
            {hoveredBox === 'clubs' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-[#4c1d76]/25 rounded-2xl shadow-[0_20px_45px_rgba(76,29,118,0.2)] p-4 z-50"
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
                    className="w-full pl-7 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4c1d76]"
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

      {/* 2. Main Master/Detail Directory (Clean Header, No Fluff) */}
      <div className="bg-white rounded-3xl border border-[#4c1d76]/15 overflow-hidden shadow-[0_4px_25px_rgba(76,29,118,0.06)] flex flex-col">
        {/* Streamlined Console Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-white via-[#fcfbfe] to-[#faf7ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4c1d76]/10 border border-[#4c1d76]/20 flex items-center justify-center text-[#4c1d76] shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">University Institutes &amp; Clubs</h2>
              <p className="text-[11px] text-slate-400 font-medium">Select an institute to view clubs and scheduled activities.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search club or event..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#f8f5ff] border border-[#4c1d76]/15 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4c1d76] focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Calendar Link */}
            <Link
              href="/dashboard/admin/calendar"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#f4eefe] hover:bg-[#ebdffd] text-[#4c1d76] border border-[#4c1d76]/20 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        {/* Master Detail Split View - All 11 Institutes Fit Without Scroll on Desktop */}
        <div className="flex flex-col md:flex-row h-auto md:h-[860px] bg-[#faf8ff] overflow-hidden">
          
          {/* Left Column (Master): Institutes list */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[#4c1d76]/10 bg-white flex flex-col h-full shrink-0">
            <div className="px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <span>Institutes ({ORG_DATA.length})</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {ORG_DATA.map(school => {
                const isActive = activeSchoolId === school.id
                return (
                  <button
                    key={school.id}
                    onClick={() => {
                      setActiveSchoolId(school.id)
                      setSearchQuery('')
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group relative overflow-hidden focus:outline-none ${
                      isActive 
                        ? 'text-white shadow-[0_4px_16px_rgba(76,29,118,0.25)]'
                        : 'bg-transparent hover:bg-[#fbf9fe] text-slate-700 hover:text-[#4c1d76] border border-transparent hover:border-[#4c1d76]/10'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSchoolHighlight"
                        className="absolute inset-0 bg-gradient-to-r from-[#4c1d76] via-[#3a135b] to-[#250839]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#f4eefe] text-[#4c1d76] group-hover:bg-[#ebdffd]'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="relative z-10 min-w-0 flex-1 pr-1">
                      <h3 className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#4c1d76]'}`}>
                        {school.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                          {school.clubs.length} Clubs
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {school.totalEvents} Events
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`relative z-10 w-4 h-4 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-300 group-hover:text-[#4c1d76] group-hover:translate-x-0.5'
                    }`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column (Detail): Clubs Grid & Extended Events Scroll */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf8ff]">
            {/* Detail Subheader */}
            <div className="px-6 py-2.5 border-b border-[#4c1d76]/10 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#4c1d76]" />
                <h3 className="text-xs font-extrabold text-slate-900 truncate">{activeSchool.name}</h3>
                <span className="text-[11px] text-slate-400 font-medium">({filteredClubs.length} Clubs)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f4eefe] rounded-lg border border-[#4c1d76]/15 text-[10px] font-bold text-[#4c1d76]">
                <Sparkles className="w-3 h-3" />
                <span>{activeSchool.totalEvents} Events</span>
              </div>
            </div>

            {/* Scrollable Clubs Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSchoolId + searchQuery}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {filteredClubs.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#4c1d76]/20 p-6 shadow-sm">
                      <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center mb-2 text-[#4c1d76]">
                        <Users className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {searchQuery ? 'No matching clubs or events' : 'No active clubs registered'}
                      </h4>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2.5 px-3 py-1 bg-[#4c1d76] text-white rounded-lg text-xs font-semibold hover:bg-[#39125b] transition-colors"
                        >
                          Clear Search Filter
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {filteredClubs.map((club, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.02, ease: 'easeOut' }}
                          key={club.id} 
                          className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(76,29,118,0.03)] border border-[#4c1d76]/15 hover:shadow-[0_8px_25px_rgba(76,29,118,0.1)] hover:border-[#4c1d76]/30 transition-all duration-200 flex flex-col justify-between group"
                        >
                          {/* Club Header */}
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20">
                                    {club.shortName}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    {club.events.length} {club.events.length === 1 ? 'Event' : 'Events'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-[#4c1d76] transition-colors line-clamp-2">
                                  {club.name}
                                </h4>
                              </div>
                            </div>

                            {/* Faculty Advisor */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                              <User className="w-3 h-3 text-[#4c1d76] shrink-0" />
                              <span className="text-[11px] font-medium text-slate-500">Advisor:</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate">{club.facultyAdvisor}</span>
                            </div>
                          </div>

                          {/* Events List */}
                          <div className="pt-2.5 border-t border-slate-100 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1">
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
                                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/90 border border-slate-100 hover:bg-[#fcfaff] hover:border-[#4c1d76]/25 transition-all"
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
                              className="mt-2.5 pt-2 border-t border-slate-50 text-[10px] font-bold text-[#4c1d76] hover:text-[#320f52] flex items-center justify-between group/link transition-colors"
                            >
                              <span>View in Calendar</span>
                              <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </motion.div>
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
