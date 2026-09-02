'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, LayoutDashboard } from 'lucide-react'
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
    } catch {
      alert('Failed to update department')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (profileId: string, changes: { role?: string; department_id?: string }) => {
    setLoading(true)
    try {
      const payload: Record<string, string | null> = {}
      if (changes.role !== undefined) payload.role = changes.role
      if (changes.department_id !== undefined) payload.department_id = changes.department_id || null
      const { error } = await supabase.from('profiles').update(payload).eq('id', profileId)
      if (error) throw error
      router.refresh()
    } catch {
      alert('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const hodUsers = initialProfiles.filter((p) => p.role === 'hod')

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b border-[var(--hairline)] pb-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'departments' ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] whisper-shadow' : 'text-[var(--mute)] hover:bg-[var(--canvas-inset)]'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Departments
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'users' ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] whisper-shadow' : 'text-[var(--mute)] hover:bg-[var(--canvas-inset)]'}`}
        >
          <Users className="w-4 h-4" /> Users
        </button>
      </div>

      <div className="geist-card p-6 whisper-shadow overflow-x-auto">
        {activeTab === 'departments' && (
          <div className="space-y-4">
            {/* Create Department Form */}
            <form onSubmit={handleCreateDepartment} className="flex flex-wrap items-end gap-3 p-4 bg-[var(--canvas-inset)] rounded-xl border border-[var(--hairline)] mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">New Department Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#0070f3]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">Assign Initial HOD (Optional)</label>
                <select
                  value={newDeptHod}
                  onChange={(e) => setNewDeptHod(e.target.value)}
                  className="w-full bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:border-[#0070f3] h-[34px]"
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
                className="bg-[var(--ink)] text-[var(--canvas)] px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity h-[34px] cursor-pointer"
              >
                Create
              </button>
            </form>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--mute)]">
                  <th className="pb-3 font-medium">Department Name</th>
                  <th className="pb-3 font-medium">Assigned HOD</th>
                  <th className="pb-3 font-medium w-64">Reassign HOD</th>
                </tr>
              </thead>
              <tbody>
                {initialDepartments.map((dept) => (
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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--mute)]">
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium w-40">Role</th>
                <th className="pb-3 font-medium w-64">Department</th>
              </tr>
            </thead>
            <tbody>
              {initialProfiles.map((p) => (
                <tr key={p.id} className="border-b border-[var(--hairline-soft)] last:border-0">
                  <td className="py-4 font-medium text-[var(--ink)]">{p.email}</td>
                  <td className="py-4">
                    <select
                      disabled={loading}
                      value={p.role}
                      onChange={(e) => handleUpdateProfile(p.id, { role: e.target.value })}
                      className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-[#0070f3]"
                    >
                      <option value="submitter">Submitter</option>
                      <option value="hod">HOD</option>
                      <option value="admin">Admin</option>
                      <option value="emergency">Emergency Authority</option>
                    </select>
                  </td>
                  <td className="py-4">
                    <select
                      disabled={loading}
                      value={p.department_id || ''}
                      onChange={(e) => handleUpdateProfile(p.id, { department_id: e.target.value })}
                      className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-[#0070f3]"
                    >
                      <option value="">-- None --</option>
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
