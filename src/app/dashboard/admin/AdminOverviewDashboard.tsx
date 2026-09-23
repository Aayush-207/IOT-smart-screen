'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Network, Users, ChevronDown, CalendarDays, ExternalLink, User } from 'lucide-react'
import { ORG_DATA, TOTAL_CLUBS, TOTAL_SCHOOLS, TOTAL_EVENTS, School, Club } from '@/lib/data/orgData'

export function AdminOverviewDashboard({ totalDepartments }: { totalDepartments: number }) {
  const [activeSchoolId, setActiveSchoolId] = useState<string>(ORG_DATA[0]?.id || '')
  const activeSchool = ORG_DATA.find(s => s.id === activeSchoolId) || ORG_DATA[0]

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#4c1d76] p-6 rounded-3xl shadow-sm hover:shadow-[0_0_20px_rgba(76,29,118,0.4)] transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-slate-700" />
            </div>
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {TOTAL_EVENTS} Events
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-slate-900">{TOTAL_SCHOOLS}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Schools / Institutes</div>
        </div>

        <div className="bg-white border border-[#4c1d76] p-6 rounded-3xl shadow-sm hover:shadow-[0_0_20px_rgba(76,29,118,0.4)] transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Network className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-slate-900">{totalDepartments}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Departments Registered</div>
        </div>

        <div className="bg-white border border-[#4c1d76] p-6 rounded-3xl shadow-sm hover:shadow-[0_0_20px_rgba(76,29,118,0.4)] transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-slate-900">{TOTAL_CLUBS}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Active Student Clubs</div>
        </div>
      </div>

      {/* Organizational Hierarchy Explorer - Master/Detail Layout */}
      <div className="bg-white rounded-3xl border border-[#4c1d76]/10 overflow-hidden shadow-[0_4px_25px_rgba(76,29,118,0.05)] flex flex-col min-h-[600px]">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-[#fbf9ff]">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Organizational Hierarchy &amp; Activities</h2>
            <p className="text-sm text-slate-500 font-medium">Explore the university structure down to the club and event level.</p>
          </div>
          <div className="px-4 py-2 bg-[#f4eefe] border border-[#4c1d76]/20 rounded-xl text-xs font-bold text-[#4c1d76] shadow-inner">
            Academic Year 2026-27
          </div>
        </div>

        {/* Master Detail Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-[#faf8ff]">
          
          {/* Left Column (Master) - Schools */}
          <div className="w-full md:w-1/3 md:max-w-sm border-b md:border-b-0 md:border-r border-[#4c1d76]/10 overflow-y-auto bg-white flex flex-col custom-scrollbar">
            <div className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-50 sticky top-0 bg-white/95 z-10 backdrop-blur-md">
              Schools &amp; Institutes
            </div>
            <div className="p-3 space-y-1.5">
              {ORG_DATA.map((school) => {
                const isActive = activeSchoolId === school.id
                return (
                  <button
                    key={school.id}
                    onClick={() => setActiveSchoolId(school.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden focus:outline-none ${
                      isActive 
                        ? 'text-white shadow-[0_8px_20px_rgba(76,29,118,0.25)]'
                        : 'bg-transparent hover:bg-[#f8f5ff] text-slate-700 hover:text-[#4c1d76] border border-transparent hover:border-[#4c1d76]/10'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSchoolHighlight"
                        className="absolute inset-0 bg-gradient-to-r from-[#4c1d76] to-[#2e0d4a]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-white/20 text-white shadow-sm' : 'bg-slate-100 text-slate-400 group-hover:bg-[#4c1d76]/10 group-hover:text-[#4c1d76]'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="relative z-10 pr-2">
                      <h3 className={`text-sm font-extrabold leading-snug ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#4c1d76]'}`}>
                        {school.name}
                      </h3>
                      <p className={`text-xs mt-0.5 font-medium ${isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-500'}`}>
                        {school.clubs.length} Active Clubs
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column (Detail) - Clubs */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSchoolId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeSchool.name}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1.5">Viewing {activeSchool.clubs.length} active clubs and their scheduled events.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-[#4c1d76]/10 text-xs font-bold text-[#4c1d76] shadow-sm">
                    <Network className="w-4 h-4" />
                    {activeSchool.totalEvents} Total Events
                  </div>
                </div>

                {activeSchool.clubs.length === 0 ? (
                  <div className="py-24 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-semibold">No active clubs registered yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Check back later for updates from this institute.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {activeSchool.clubs.map((club, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        key={club.id} 
                        className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(76,29,118,0.03)] border border-[#4c1d76]/10 hover:shadow-[0_12px_40px_rgba(76,29,118,0.12)] hover:border-[#4c1d76]/25 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className="text-lg font-extrabold text-slate-900 leading-tight group-hover:text-[#4c1d76] transition-colors">{club.name}</h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-[#4c1d76]/10 text-[#4c1d76] border border-[#4c1d76]/20">
                                {club.shortName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Advisor: <span className="text-slate-700">{club.facultyAdvisor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-5 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Upcoming Events</h5>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {club.events.length}
                            </span>
                          </div>
                          
                          {club.events.length === 0 ? (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 border-dashed text-center">
                              <p className="text-[11px] text-slate-400 font-semibold">No events scheduled right now.</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {club.events.slice(0, 3).map(evt => (
                                <div key={evt.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-[#fbf9ff] group-hover:border-[#4c1d76]/10 transition-colors">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0 text-[#4c1d76] group-hover:border-[#4c1d76]/20 transition-colors">
                                      <CalendarDays className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate">{evt.name}</p>
                                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">{evt.category}</p>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shrink-0 ml-2 whitespace-nowrap shadow-sm">
                                    {evt.dateStr.split(',')[0]}
                                  </div>
                                </div>
                              ))}
                              {club.events.length > 3 && (
                                <button className="w-full mt-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#4c1d76] hover:bg-[#4c1d76]/10 rounded-lg transition-colors flex items-center justify-center gap-1 border border-transparent hover:border-[#4c1d76]/20">
                                  View All {club.events.length} Events <ExternalLink className="w-3 h-3 ml-0.5" />
                                </button>
                              )}
                            </div>
                          )}
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
  )
}
