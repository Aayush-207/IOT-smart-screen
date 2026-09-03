'use client'

import React from 'react'
import type { DeviceStatus, DeliveryState, AnnouncementDisplayStatus } from '@/lib/fleet'

type AnyStatus = DeviceStatus | DeliveryState | AnnouncementDisplayStatus | string

const CONFIG: Record<string, { label: string; className: string }> = {
  // Device & delivery
  online: { label: 'Online', className: 'border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15' },
  live: { label: 'Live', className: 'border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15' },
  delivered: { label: 'Delivered', className: 'border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15' },
  standby: { label: 'Standby', className: 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/40' },
  stale: { label: 'Stale', className: 'border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  offline: { label: 'Offline', className: 'border-rose-600/30 text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/15' },
  dispatched: { label: 'Dispatched', className: 'border-neutral-300 dark:border-white/20 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/10' },
  failed: { label: 'Failed', className: 'border-rose-600/30 text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/15' },

  // Announcement states
  draft: { label: 'Draft', className: 'border-neutral-300 dark:border-white/20 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/10' },
  pending_hod: { label: 'Pending Review', className: 'border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  pending_approval: { label: 'Pending Approval', className: 'border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  pending: { label: 'Pending', className: 'border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  approved: { label: 'Approved', className: 'border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20' },
  rejected: { label: 'Rejected', className: 'border-rose-600/30 text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/15' },
  withdrawn: { label: 'Withdrawn', className: 'border-neutral-300 dark:border-rose-500/30 text-neutral-700 dark:text-rose-300 bg-neutral-100 dark:bg-rose-500/10' },
  scheduled: { label: 'Scheduled', className: 'border-sky-600/30 text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-500/15' },
  expired: { label: 'Expired', className: 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-transparent' },
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const normalized = String(status || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
  const cfg = CONFIG[normalized] || {
    label: String(status || 'Unknown').replace(/_/g, ' '),
    className: 'border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-white/10',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold border ${cfg.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
      <span>{cfg.label}</span>
    </span>
  )
}
