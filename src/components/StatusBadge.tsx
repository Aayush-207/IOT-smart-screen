'use client'

import React from 'react'
import type { DeviceStatus, DeliveryState, AnnouncementDisplayStatus } from '@/lib/fleet'

type AnyStatus = DeviceStatus | DeliveryState | AnnouncementDisplayStatus | string

const CONFIG: Record<string, { label: string; className: string }> = {
  // Device & delivery
  online: { label: 'Online', className: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  live: { label: 'Live', className: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  delivered: { label: 'Delivered', className: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  standby: { label: 'Standby', className: 'border-slate-200 text-slate-600 bg-slate-50' },
  stale: { label: 'Stale', className: 'border-amber-200 text-amber-700 bg-amber-50' },
  offline: { label: 'Offline', className: 'border-rose-200 text-rose-700 bg-rose-50' },
  dispatched: { label: 'Dispatched', className: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
  failed: { label: 'Failed', className: 'border-rose-200 text-rose-700 bg-rose-50' },

  // Announcement states
  draft: { label: 'Draft', className: 'border-slate-200 text-slate-600 bg-slate-50' },
  pending_hod: { label: 'Pending Review', className: 'border-amber-200 text-amber-700 bg-amber-50' },
  pending_approval: { label: 'Pending Approval', className: 'border-amber-200 text-amber-700 bg-amber-50' },
  pending: { label: 'Pending', className: 'border-amber-200 text-amber-700 bg-amber-50' },
  approved: { label: 'Approved', className: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Rejected', className: 'border-rose-200 text-rose-700 bg-rose-50' },
  withdrawn: { label: 'Withdrawn', className: 'border-slate-300 text-slate-500 bg-slate-100' },
  scheduled: { label: 'Scheduled', className: 'border-sky-200 text-sky-700 bg-sky-50' },
  expired: { label: 'Expired', className: 'border-slate-200 text-slate-500 bg-slate-100 opacity-80' },
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const normalized = String(status || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
  const cfg = CONFIG[normalized] || {
    label: String(status || 'Unknown').replace(/_/g, ' '),
    className: 'border-slate-200 text-slate-600 bg-slate-50',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-sm ${cfg.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
      <span>{cfg.label}</span>
    </span>
  )
}
