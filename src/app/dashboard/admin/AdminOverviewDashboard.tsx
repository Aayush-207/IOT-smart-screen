'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Network, Users, ChevronDown, CalendarDays, ExternalLink, User } from 'lucide-react'
import { ORG_DATA, TOTAL_CLUBS, TOTAL_SCHOOLS, TOTAL_EVENTS, School, Club } from '@/lib/data/orgData'

export function AdminOverviewDashboard({ totalDepartments }: { totalDepartments: number }) {
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)
  const [expandedClub, setExpandedClub] = useState<string | null>(null)

  const toggleSchool = (schoolId: string) => {
    if (expandedSchool === schoolId) {
      setExpandedSchool(null)
      setExpandedClub(null)
    } else {
      setExpandedSchool(schoolId)
      setExpandedClub(null)
    }
  }

  const toggleClub = (e: React.MouseEvent, clubId: string) => {
    e.stopPropagation()
    setExpandedClub(expandedClub === clubId ? null : clubId)
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:-translate-y-2 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
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

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:-translate-y-2 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Network className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-slate-900">{totalDepartments}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Departments Registered</div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:-translate-y-2 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-slate-900">{TOTAL_CLUBS}</div>
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Active Student Clubs</div>
        </div>
      </div>

      {/* Organizational Hierarchy Explorer */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Organizational Hierarchy & Activities</h2>
            <p className="text-sm text-slate-500">Explore the university structure down to the club and event level.</p>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            Academic Year 2026-27
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {ORG_DATA.map((school) => {
            const isSchoolExpanded = expandedSchool === school.id
            return (
              <div key={school.id} className="group">
                {/* School Row */}
                <button
                  onClick={() => toggleSchool(school.id)}
                  className="w-full px-6 md:px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSchoolExpanded ? 'bg-[#121826] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{school.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{school.clubs.length} Clubs &middot; {school.totalEvents} Scheduled Events</p>
                    </div>
                  </div>
                  <div className={`text-slate-400 transition-transform duration-300 ${isSchoolExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {/* Clubs & Events Drill-Down */}
                <AnimatePresence>
                  {isSchoolExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                      <div className="px-6 md:px-8 py-6 pl-14 md:pl-20 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Clubs</h4>
                        
                        {school.clubs.map((club) => {
                          const isClubExpanded = expandedClub === club.id
                          return (
                            <div key={club.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <div 
                                onClick={(e) => toggleClub(e, club.id)}
                                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{club.name}</span>
                                    <span className="px-2 py-0.5 rounded border border-indigo-100 bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                      {club.shortName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <User className="w-3.5 h-3.5" /> Advisor: {club.facultyAdvisor}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                    {club.events.length} Events
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isClubExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              {/* Club Events List */}
                              <AnimatePresence>
                                {isClubExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                                  >
                                    <div className="p-4 pl-6 space-y-2">
                                      {club.events.map((evt) => (
                                        <div key={evt.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                                          <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-[#121826]/5 rounded-lg text-[#121826] mt-0.5">
                                              <CalendarDays className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <div className="text-sm font-semibold text-slate-900">{evt.name}</div>
                                              <div className="text-xs text-slate-500 mt-0.5">{evt.category}</div>
                                            </div>
                                          </div>
                                          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                                            {evt.dateStr}
                                          </div>
                                        </div>
                                      ))}
                                      <button className="w-full mt-2 py-2.5 text-xs font-bold text-slate-600 hover:text-[#121826] hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                                        View All Historical Data <ExternalLink className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
