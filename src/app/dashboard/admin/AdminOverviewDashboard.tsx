'use client'

import { useState, useMemo } from 'react'
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
  GraduationCap
} from 'lucide-react'
import { ORG_DATA, TOTAL_CLUBS, TOTAL_SCHOOLS, TOTAL_EVENTS, School, Club } from '@/lib/data/orgData'

export function AdminOverviewDashboard({ totalDepartments }: { totalDepartments: number }) {
  const [activeSchoolId, setActiveSchoolId] = useState<string>(ORG_DATA[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const activeSchool = useMemo(() => {
    return ORG_DATA.find(s => s.id === activeSchoolId) || ORG_DATA[0]
  }, [activeSchoolId])

  // Filter clubs within the active school by search query (club name, shortName, facultyAdvisor, or event name)
  const filteredClubs = useMemo(() => {
    if (!activeSchool) return []
    if (!searchQuery.trim()) return activeSchool.clubs

    const q = searchQuery.toLowerCase().trim()
    return activeSchool.clubs.filter(club => {
      const matchName = club.name.toLowerCase().includes(q)
      const matchShort = club.shortName.toLowerCase().includes(q)
      const matchAdvisor = club.facultyAdvisor.toLowerCase().includes(q)
      const matchEvents = club.events.some(e => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      return matchName || matchShort || matchAdvisor || matchEvents
    })
  }, [activeSchool, searchQuery])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Refined Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Schools */}
        <div className="bg-gradient-to-br from-white via-white to-[#fbf9fe] border border-[#4c1d76]/20 p-5 rounded-2xl shadow-sm hover:border-[#4c1d76]/40 hover:shadow-[0_8px_25px_rgba(76,29,118,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4c1d76]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center border border-[#4c1d76]/20 text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider">
              {TOTAL_EVENTS} Events Total
            </span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{TOTAL_SCHOOLS}</div>
          <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Institutes &amp; Schools</div>
        </div>

        {/* Total Departments */}
        <div className="bg-gradient-to-br from-white via-white to-[#fbf9fe] border border-[#4c1d76]/20 p-5 rounded-2xl shadow-sm hover:border-[#4c1d76]/40 hover:shadow-[0_8px_25px_rgba(76,29,118,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4c1d76]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center border border-[#4c1d76]/20 text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
              <Network className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Mesh
            </span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{totalDepartments}</div>
          <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Academic Departments</div>
        </div>

        {/* Active Student Clubs */}
        <div className="bg-gradient-to-br from-white via-white to-[#fbf9fe] border border-[#4c1d76]/20 p-5 rounded-2xl shadow-sm hover:border-[#4c1d76]/40 hover:shadow-[0_8px_25px_rgba(76,29,118,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4c1d76]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="w-10 h-10 bg-[#f4eefe] rounded-xl flex items-center justify-center border border-[#4c1d76]/20 text-[#4c1d76] group-hover:bg-[#4c1d76] group-hover:text-white transition-colors duration-200">
              <Users className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-full text-[10px] font-bold text-[#4c1d76] uppercase tracking-wider">
              {TOTAL_CLUBS} Registered
            </span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 mb-0.5">{TOTAL_CLUBS}</div>
          <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Student Clubs &amp; Chapters</div>
        </div>
      </div>

      {/* 2. Master/Detail Organizational Console with Contained Viewport */}
      <div className="bg-white rounded-3xl border border-[#4c1d76]/15 overflow-hidden shadow-[0_4px_25px_rgba(76,29,118,0.06)] flex flex-col">
        {/* Console Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#fcfbfe] to-[#faf7ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4c1d76]/10 border border-[#4c1d76]/20 flex items-center justify-center text-[#4c1d76] shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Institutes, Clubs &amp; Scheduled Activities</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase bg-[#f4eefe] text-[#4c1d76] rounded-md border border-[#4c1d76]/20">
                  AY 2026-27
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Select an institute on the left to explore its clubs and scroll through scheduled activities.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search club, advisor, event..."
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

            {/* Link to Calendar */}
            <Link
              href="/dashboard/admin/calendar"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#f4eefe] hover:bg-[#ebdffd] text-[#4c1d76] border border-[#4c1d76]/20 rounded-xl text-xs font-bold transition-all shrink-0"
              title="Open full campus schedule calendar"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Full Calendar</span>
            </Link>
          </div>
        </div>

        {/* Master Detail Split View - Sized to fit all 11 Institutes comfortably without scroll */}
        <div className="flex flex-col md:flex-row h-auto md:h-[860px] bg-[#faf8ff] overflow-hidden">
          
          {/* Left Column (Master): Schools / Institutes list */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[#4c1d76]/10 bg-white flex flex-col h-full shrink-0">
            <div className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <span>Institutes &amp; Schools ({ORG_DATA.length})</span>
              <span className="text-[10px] text-slate-400 font-medium">All Institutes</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
              {ORG_DATA.map((school) => {
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
                    <div className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#f4eefe] text-[#4c1d76] group-hover:bg-[#ebdffd]'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="relative z-10 min-w-0 flex-1 pr-1">
                      <h3 className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#4c1d76]'}`}>
                        {school.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
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

          {/* Right Column (Detail): Clubs Grid & Contained Events Scroll */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf8ff]">
            {/* Detail Top Subheader */}
            <div className="px-6 py-3 border-b border-[#4c1d76]/10 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#4c1d76]" />
                <h3 className="text-sm font-extrabold text-slate-900 truncate">{activeSchool.name}</h3>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">&bull;</span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  {filteredClubs.length} of {activeSchool.clubs.length} Clubs Shown
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f4eefe] rounded-lg border border-[#4c1d76]/15 text-[11px] font-bold text-[#4c1d76]">
                <Sparkles className="w-3 h-3" />
                <span>{activeSchool.totalEvents} Scheduled Events</span>
              </div>
            </div>

            {/* Scrollable Clubs Container */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSchoolId + searchQuery}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredClubs.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#4c1d76]/20 p-8 shadow-sm">
                      <div className="w-12 h-12 bg-[#f4eefe] rounded-xl flex items-center justify-center mb-3 text-[#4c1d76]">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {searchQuery ? 'No matching clubs or events found' : 'No active clubs registered yet'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {searchQuery
                          ? `We couldn't find any results matching "${searchQuery}". Try a different keyword.`
                          : 'There are currently no registered clubs under this institute.'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-3 px-3 py-1.5 bg-[#4c1d76] text-white rounded-lg text-xs font-semibold hover:bg-[#39125b] transition-colors"
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
                          transition={{ duration: 0.25, delay: idx * 0.03, ease: 'easeOut' }}
                          key={club.id} 
                          className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(76,29,118,0.03)] border border-[#4c1d76]/15 hover:shadow-[0_8px_25px_rgba(76,29,118,0.1)] hover:border-[#4c1d76]/30 transition-all duration-200 flex flex-col justify-between group"
                        >
                          {/* Club Header */}
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2.5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-[#f4eefe] text-[#4c1d76] border border-[#4c1d76]/20">
                                    {club.shortName}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    {club.events.length} {club.events.length === 1 ? 'Event' : 'Events'}
                                  </span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-[#4c1d76] transition-colors line-clamp-2">
                                  {club.name}
                                </h4>
                              </div>
                            </div>

                            {/* Faculty Advisor Row */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3.5 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                              <User className="w-3.5 h-3.5 text-[#4c1d76] shrink-0" />
                              <span className="text-[11px] font-medium text-slate-500">Advisor:</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate">{club.facultyAdvisor}</span>
                            </div>
                          </div>

                          {/* Events Section with Contained Internal Scroll - Extended Height */}
                          <div className="pt-3 border-t border-slate-100 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-[#4c1d76]" /> Scheduled Activities
                              </span>
                              {club.events.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Scroll for all {club.events.length}
                                </span>
                              )}
                            </div>
                            
                            {club.events.length === 0 ? (
                              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 border-dashed text-center flex-1 flex items-center justify-center">
                                <p className="text-[11px] text-slate-400 font-medium">No events scheduled right now.</p>
                              </div>
                            ) : (
                              <div className="max-h-[230px] overflow-y-auto custom-scrollbar space-y-2 pr-1.5">
                                {club.events.map(evt => (
                                  <div
                                    key={evt.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 hover:bg-[#fcfaff] hover:border-[#4c1d76]/25 transition-all"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                      <div className="w-7 h-7 rounded-lg bg-[#f4eefe] border border-[#4c1d76]/20 flex items-center justify-center shrink-0 text-[#4c1d76]">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{evt.name}</p>
                                        <p className="text-[10px] font-medium text-slate-400 truncate">{evt.category}</p>
                                      </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-[#4c1d76] bg-white px-2.5 py-1 rounded-lg border border-[#4c1d76]/20 shrink-0 whitespace-nowrap shadow-2xs">
                                      {evt.dateStr.split(',')[0]}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* View in Calendar Footer Action */}
                            <Link
                              href="/dashboard/admin/calendar"
                              className="mt-3 pt-2.5 border-t border-slate-50 text-[11px] font-bold text-[#4c1d76] hover:text-[#320f52] flex items-center justify-between group/link transition-colors"
                            >
                              <span>View in ATE Calendar</span>
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
