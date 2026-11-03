'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, LayoutDashboard, Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OrgManagementClient({
  initialDepartments,
  initialProfiles,
}: {
  initialDepartments: any[]
  initialProfiles: any[]
}) {
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments')
  const [loading, setLoading] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptHod, setNewDeptHod] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeptName.trim()) return
    setLoading(true)
    try {
      const { data: createdDept, error } = await supabase
        .from('departments')
        .insert({
          name: newDeptName.trim(),
          hod_id: newDeptHod || null,
        })
        .select('id')
        .single()
      if (error) throw error

      if (newDeptHod && createdDept?.id) {
        await supabase.from('profiles').update({ department_id: createdDept.id }).eq('id', newDeptHod)
      }

      setNewDeptName('')
      setNewDeptHod('')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to create department')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDepartment = async (deptId: string, newHodId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('departments').update({ hod_id: newHodId || null }).eq('id', deptId)
      if (error) throw error

      if (newHodId) {
        await supabase.from('profiles').update({ department_id: deptId }).eq('id', newHodId)
      }
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to update department')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (profileId: string, updates: { role?: string; department_id?: string | null }) => {
    setLoading(true)
    try {
      const payload: any = {}
      if (updates.role !== undefined) payload.role = updates.role
      if (updates.department_id !== undefined) payload.department_id = updates.department_id || null

      const { error } = await supabase.from('profiles').update(payload).eq('id', profileId)
      if (error) throw error
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to update user profile')
    } finally {
      setLoading(false)
    }
  }

  const hodUsers = initialProfiles.filter((p) => p.role === 'hod')

  return (
    <div className="space-y-4 text-slate-900">
      {/* Segmented Control Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/80">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'departments'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Departments ({initialDepartments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users &amp; Roles ({initialProfiles.length})</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm overflow-hidden">
        {activeTab === 'departments' && (
          <div className="space-y-5">
            {/* Create Department Form */}
            <form onSubmit={handleCreateDepartment} className="flex flex-wrap items-end gap-3 p-4 bg-purple-50/40 rounded-xl border border-purple-100 mb-2">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Department Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/15 shadow-2xs"
                />
              </div>
              <div className="min-w-[180px]">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign HOD (Optional)</label>
                <select
                  value={newDeptHod}
                  onChange={(e) => setNewDeptHod(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#4c1d76] focus:ring-2 focus:ring-[#4c1d76]/15 shadow-2xs"
                >
                  <option value="">-- None --</option>
                  {hodUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !newDeptName.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#4c1d76] hover:bg-[#39125b] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding…</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Department</span>
                  </>
                )}
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 rounded-l-xl">Department Name</th>
                    <th className="px-4 py-3">Assigned Department Head</th>
                    <th className="px-4 py-3 rounded-r-xl w-64">Reassign Head</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{dept.name}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {dept.profiles?.email ? (
                          <span className="text-slate-800 font-medium">{dept.profiles.email}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          disabled={loading}
                          value={dept.hod_id || ''}
                          onChange={(e) => handleUpdateDepartment(dept.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#4c1d76] focus:bg-white"
                        >
                          <option value="">-- Unassign --</option>
                          {hodUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 rounded-l-xl">User Email</th>
                  <th className="px-4 py-3 w-52">System Role</th>
                  <th className="px-4 py-3 rounded-r-xl w-64">Assigned Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{p.email}</td>
                    <td className="px-4 py-3">
                      <select
                        disabled={loading}
                        value={p.role}
                        onChange={(e) => handleUpdateProfile(p.id, { role: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#4c1d76] focus:bg-white capitalize"
                      >
                        <option value="submitter">Submitter</option>
                        <option value="hod">Department Head (HOD)</option>
                        <option value="admin">Central Admin</option>
                        <option value="emergency">Emergency Authority</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={loading}
                        value={p.department_id || ''}
                        onChange={(e) => handleUpdateProfile(p.id, { department_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#4c1d76] focus:bg-white"
                      >
                        <option value="">-- None / General --</option>
                        {initialDepartments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
