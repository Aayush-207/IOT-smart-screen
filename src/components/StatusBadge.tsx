'use client'

import React from 'react'
import type { DeviceStatus, DeliveryState, AnnouncementDisplayStatus } from '@/lib/fleet'

type AnyStatus = DeviceStatus | DeliveryState | AnnouncementDisplayStatus | string

const CONFIG: Record<string, { label: string; className: string }> = {
  // Device & delivery
  online: { label: 'Online', className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  live: { label: 'Live', className: 'border-white/30 text-white bg-white/10' },
  stale: { label: 'Stale', className: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  offline: { label: 'Offline', className: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  dispatched: { label: 'Dispatched', className: 'border-white/20 text-neutral-300 bg-white/5' },
  failed: { label: 'Failed', className: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  // Announcement states
  draft: { label: 'Draft', className: 'border-white/20 text-neutral-400 bg-white/5' },
  pending_hod: { label: 'Pending Review', className: 'border-[#ff7a17]/40 text-[#ffc285] bg-[#ff7a17]/10' },
  approved: { label: 'Approved', className: 'border-white/30 text-white bg-white/10' },
  rejected: { label: 'Rejected', className: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  withdrawn: { label: 'Withdrawn', className: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  scheduled: { label: 'Scheduled', className: 'border-white/20 text-neutral-300 bg-white/5' },
  expired: { label: 'Expired', className: 'border-white/15 text-neutral-500 bg-transparent' },
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const cfg = CONFIG[status] || {
    label: String(status).replace(/_/g, ' '),
    className: 'border-white/20 text-white bg-white/5',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider font-normal border ${cfg.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  )
}
