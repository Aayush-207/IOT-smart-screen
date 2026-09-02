import { describe, it, expect } from 'vitest'
import type { Priority } from '../src/lib/priority'

interface AnnouncementRecord {
  id: string
  title: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'withdrawn' | 'expired'
  priority: Priority
  department_id: string | null
}

function filterHodApprovalQueue(announcements: AnnouncementRecord[], hodDepartmentId: string) {
  return announcements.filter(
    (a) =>
      a.status === 'pending_approval' &&
      a.department_id === hodDepartmentId &&
      (a.priority === 'routine' || a.priority === 'timesensitive')
  )
}

function filterAdminApprovalQueue(announcements: AnnouncementRecord[]) {
  return announcements.filter(
    (a) =>
      a.status === 'pending_approval' &&
      (a.priority === 'critical' || a.department_id === null)
  )
}

describe('E2E Governance & Approval Routing', () => {
  const deptCSE = 'dept-cse-uuid'
  const deptMech = 'dept-mech-uuid'

  const sampleAnnouncements: AnnouncementRecord[] = [
    {
      id: 'cse-routine',
      title: 'CSE Lab Timetable Update',
      status: 'pending_approval',
      priority: 'routine',
      department_id: deptCSE,
    },
    {
      id: 'cse-timesensitive',
      title: 'CSE Paper Submission Deadline Tonight',
      status: 'pending_approval',
      priority: 'timesensitive',
      department_id: deptCSE,
    },
    {
      id: 'mech-routine',
      title: 'Workshop Safety Protocols',
      status: 'pending_approval',
      priority: 'routine',
      department_id: deptMech,
    },
    {
      id: 'campus-critical',
      title: 'University Convocation Ceremony',
      status: 'pending_approval',
      priority: 'critical',
      department_id: deptCSE,
    },
    {
      id: 'cross-dept-general',
      title: 'Campus Wide Blood Donation Camp',
      status: 'pending_approval',
      priority: 'routine',
      department_id: null, // Cross-department / General
    },
    {
      id: 'already-approved',
      title: 'Welcome New Students',
      status: 'approved',
      priority: 'routine',
      department_id: deptCSE,
    },
  ]

  it('HOD of CSE sees only CSE routine and time-sensitive pending approvals', () => {
    const cseQueue = filterHodApprovalQueue(sampleAnnouncements, deptCSE)
    expect(cseQueue.map((a) => a.id)).toEqual(['cse-routine', 'cse-timesensitive'])
  })

  it('HOD of Mech sees only Mech pending approvals', () => {
    const mechQueue = filterHodApprovalQueue(sampleAnnouncements, deptMech)
    expect(mechQueue.map((a) => a.id)).toEqual(['mech-routine'])
  })

  it('Admin queue includes critical notices and cross-department notices with null department_id', () => {
    const adminQueue = filterAdminApprovalQueue(sampleAnnouncements)
    expect(adminQueue.map((a) => a.id)).toEqual(['campus-critical', 'cross-dept-general'])
  })

  it('approved notices are excluded from both HOD and Admin approval queues', () => {
    const cseQueue = filterHodApprovalQueue(sampleAnnouncements, deptCSE)
    const adminQueue = filterAdminApprovalQueue(sampleAnnouncements)
    expect(cseQueue.some((a) => a.id === 'already-approved')).toBe(false)
    expect(adminQueue.some((a) => a.id === 'already-approved')).toBe(false)
  })
})
