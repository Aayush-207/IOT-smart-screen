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
    <div className="space-y-4 text-neutral-900 dark:text-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-[#212327] pb-3">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'departments'
              ? 'bg-white text-[#0a0a0a] font-medium'
              : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Departments ({initialDepartments.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'users'
              ? 'bg-white text-[#0a0a0a] font-medium'
              : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Users &amp; Permissions ({initialProfiles.length})
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg p-6 overflow-x-auto">
        {activeTab === 'departments' && (
          <div className="space-y-4">
            {/* Create Department Form */}
            <form onSubmit={handleCreateDepartment} className="flex flex-wrap items-end gap-3 p-4 bg-neutral-50 dark:bg-[#0a0a0a] rounded-lg border border-neutral-200 dark:border-[#212327] mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-mono text-neutral-500 dark:text-[#7d8187] uppercase tracking-wider mb-1">New Department Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-500 dark:text-[#7d8187] uppercase tracking-wider mb-1">Assign HOD (Optional)</label>
                <select
                  value={newDeptHod}
                  onChange={(e) => setNewDeptHod(e.target.value)}
                  className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-white font-mono"
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
                className="px-4 py-2 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

            <table className="xai-table text-left text-sm">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Assigned Department Head</th>
                  <th className="w-64">Reassign Head</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-[#212327]">
                {initialDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-normal text-neutral-900 dark:text-white text-xs">{dept.name}</td>
                    <td className="px-5 py-4 text-neutral-500 dark:text-[#7d8187] font-mono text-xs">{dept.profiles?.email || 'Unassigned'}</td>
                    <td className="px-5 py-4">
                      <select
                        disabled={loading}
                        value={dept.hod_id || ''}
                        onChange={(e) => handleUpdateDepartment(dept.id, e.target.value)}
                        className="bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-white font-mono"
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
        )}

        {activeTab === 'users' && (
          <table className="xai-table text-left text-sm">
            <thead>
              <tr>
                <th>User Email</th>
                <th className="w-48">System Role</th>
                <th className="w-64">Assigned Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-[#212327]">
              {initialProfiles.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-normal text-neutral-900 dark:text-white text-xs font-mono">{p.email}</td>
                  <td className="px-5 py-4">
                    <select
                      disabled={loading}
                      value={p.role}
                      onChange={(e) => handleUpdateProfile(p.id, { role: e.target.value })}
                      className="bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-white font-mono"
                    >
                      <option value="submitter">Submitter</option>
                      <option value="hod">Department Head (HOD)</option>
                      <option value="admin">Central Admin</option>
                      <option value="emergency">Emergency Authority</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      disabled={loading}
                      value={p.department_id || ''}
                      onChange={(e) => handleUpdateProfile(p.id, { department_id: e.target.value })}
                      className="bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-white font-mono"
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
        )}
      </div>
    </div>
  )
}
