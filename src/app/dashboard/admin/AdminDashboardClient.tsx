'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, LayoutDashboard, Monitor } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdminDashboardClient({ 
  initialDepartments, 
  initialClubs, 
  initialScreens, 
  profiles 
}: { 
  initialDepartments: any[], 
  initialClubs: any[], 
  initialScreens: any[], 
  profiles: any[] 
}) {
  const [activeTab, setActiveTab] = useState<'departments' | 'clubs' | 'screens'>('departments')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleUpdateDepartment = async (deptId: string, newHodId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('departments').update({ hod_id: newHodId || null }).eq('id', deptId)
      if (error) throw error
      router.refresh()
    } catch (e) {
      alert("Failed to update department")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClub = async (clubId: string, newPresId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('clubs').update({ president_id: newPresId || null }).eq('id', clubId)
      if (error) throw error
      router.refresh()
    } catch (e) {
      alert("Failed to update club")
    } finally {
      setLoading(false)
    }
  }

  const hodUsers = profiles.filter(p => p.role === 'hod')
  const clubUsers = profiles.filter(p => p.role === 'club')

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[var(--hairline)] pb-2">
        <button onClick={() => setActiveTab('departments')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'departments' ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] whisper-shadow' : 'text-[var(--mute)] hover:bg-[var(--canvas-inset)]'}`}>
          <LayoutDashboard className="w-4 h-4" /> Departments
        </button>
        <button onClick={() => setActiveTab('clubs')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'clubs' ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] whisper-shadow' : 'text-[var(--mute)] hover:bg-[var(--canvas-inset)]'}`}>
          <Users className="w-4 h-4" /> Clubs
        </button>
        <button onClick={() => setActiveTab('screens')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'screens' ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] whisper-shadow' : 'text-[var(--mute)] hover:bg-[var(--canvas-inset)]'}`}>
          <Monitor className="w-4 h-4" /> Screens
        </button>
      </div>

      {/* Content */}
      <div className="geist-card p-6 whisper-shadow overflow-x-auto">
        {activeTab === 'departments' && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--mute)]">
                <th className="pb-3 font-medium">Department Name</th>
                <th className="pb-3 font-medium">Assigned HOD</th>
                <th className="pb-3 font-medium w-64">Reassign HOD</th>
              </tr>
            </thead>
            <tbody>
              {initialDepartments.map(dept => (
                <tr key={dept.id} className="border-b border-[var(--hairline-soft)] last:border-0">
                  <td className="py-4 font-medium text-[var(--ink)]">{dept.name}</td>
                  <td className="py-4">{dept.profiles?.email || 'Unassigned'}</td>
                  <td className="py-4">
                    <select 
                      disabled={loading}
                      value={dept.hod_id || ''}
                      onChange={(e) => handleUpdateDepartment(dept.id, e.target.value)}
                      className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-[#0070f3]"
                    >
                      <option value="">-- Unassign --</option>
                      {hodUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.email}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'clubs' && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--mute)]">
                <th className="pb-3 font-medium">Club Name</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">President</th>
                <th className="pb-3 font-medium w-64">Reassign President</th>
              </tr>
            </thead>
            <tbody>
              {initialClubs.map(club => (
                <tr key={club.id} className="border-b border-[var(--hairline-soft)] last:border-0">
                  <td className="py-4 font-medium text-[var(--ink)]">{club.name}</td>
                  <td className="py-4 text-[var(--mute)]">{club.departments?.name}</td>
                  <td className="py-4">{club.profiles?.email || 'Unassigned'}</td>
                  <td className="py-4">
                    <select 
                      disabled={loading}
                      value={club.president_id || ''}
                      onChange={(e) => handleUpdateClub(club.id, e.target.value)}
                      className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-[#0070f3]"
                    >
                      <option value="">-- Unassign --</option>
                      {clubUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.email}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'screens' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialScreens.map(screen => (
              <div key={screen.id} className="border border-[var(--hairline)] rounded-xl p-4 bg-[var(--canvas-inset)]">
                <div className="flex items-start justify-between mb-2">
                  <Monitor className="w-5 h-5 text-[var(--mute)]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                    {screen.clubs?.name}
                  </span>
                </div>
                <h4 className="font-semibold text-sm mb-1">{screen.name}</h4>
                <p className="text-xs text-[var(--mute)] mb-4">{screen.location}</p>
                {screen.current_poster_url ? (
                  <img src={screen.current_poster_url} className="w-full h-24 object-cover rounded-md border border-[var(--hairline)]" alt="Screen Poster" />
                ) : (
                  <div className="w-full h-24 rounded-md border border-dashed border-[var(--hairline)] flex items-center justify-center text-[10px] text-[var(--mute)]">
                    NO ACTIVE POSTER
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
