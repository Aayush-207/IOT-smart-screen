// Announcement priority taxonomy (blueprint Part 15).
//
//   routine        — normal notices, HOD-approvable
//   timesensitive  — dated/urgent notices, HOD-approvable
//   critical       — campus-wide or cross-department, Campus Admin only
//   emergency      — Emergency Authority broadcast, no approval gate
//
// Emergency content never flows through this comparison in the render
// pipeline — it pre-empts the rotation entirely — but the rank is kept
// complete so a stray emergency row still sorts correctly.

export type Priority = 'routine' | 'timesensitive' | 'critical' | 'emergency'

export const PRIORITY_RANK: Record<Priority, number> = {
  routine: 0,
  timesensitive: 1,
  critical: 2,
  emergency: 3,
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  routine: 'Routine',
  timesensitive: 'Time-sensitive',
  critical: 'Critical',
  emergency: 'Emergency',
}

// Priorities an HOD may sign off on for their own department.
export const HOD_APPROVABLE: Priority[] = ['routine', 'timesensitive']

// Priorities that must be routed to a Campus Admin instead of an HOD.
export const ADMIN_APPROVABLE: Priority[] = ['critical']

function rankOf(p: string | null | undefined): number {
  return PRIORITY_RANK[(p ?? 'routine') as Priority] ?? 0
}

// Sort comparator: higher priority first, so
//   [...items].sort((a, b) => comparePriority(a.priority, b.priority))
// puts critical ahead of routine.
export function comparePriority(a: string | null | undefined, b: string | null | undefined): number {
  return rankOf(b) - rankOf(a)
}

export function priorityLabel(p: string | null | undefined): string {
  return PRIORITY_LABEL[(p ?? 'routine') as Priority] ?? String(p)
}
