'use client'

import React from 'react'
import type { DeviceStatus, DeliveryState, AnnouncementDisplayStatus } from '@/lib/fleet'

type AnyStatus = DeviceStatus | DeliveryState | AnnouncementDisplayStatus | string

const CONFIG: Record<string, { label: string; className: string }> = {
  // Device & delivery
  online: { label: 'Online', className: 'border-[#af1591]/30 text-[#af1591] bg-[#af1591]/10' },
  live: { label: 'Live', className: 'border-[#af1591]/30 text-[#af1591] bg-[#af1591]/10' },
  delivered: { label: 'Delivered', className: 'border-[#af1591]/30 text-[#af1591] bg-[#af1591]/10' },
  standby: { label: 'Standby', className: 'border-[#e5e7eb] text-[#7D7D7D] bg-[#f9fafb]' },
  stale: { label: 'Stale', className: 'border-[#cfa2f7]/30 text-[#cfa2f7] bg-[#cfa2f7]/10' },
  offline: { label: 'Offline', className: 'border-[#ef2045]/20 text-[#dc3545] bg-[#ffeaea]' },
  dispatched: { label: 'Dispatched', className: 'border-[#3D1165]/30 text-[#3D1165] bg-[#3D1165]/10' },
  failed: { label: 'Failed', className: 'border-[#ef2045]/20 text-[#dc3545] bg-[#ffeaea]' },

  // Announcement states
  draft: { label: 'Draft', className: 'border-[#e5e7eb] text-[#7D7D7D] bg-[#f9fafb]' },
  pending_hod: { label: 'Pending Review', className: 'border-[#cfa2f7]/30 text-[#cfa2f7] bg-[#cfa2f7]/10' },
  pending_approval: { label: 'Pending Approval', className: 'border-[#cfa2f7]/30 text-[#cfa2f7] bg-[#cfa2f7]/10' },
  pending: { label: 'Pending', className: 'border-[#cfa2f7]/30 text-[#cfa2f7] bg-[#cfa2f7]/10' },
  approved: { label: 'Approved', className: 'border-[#af1591]/30 text-[#af1591] bg-[#af1591]/10' },
  rejected: { label: 'Rejected', className: 'border-[#ef2045]/20 text-[#dc3545] bg-[#ffeaea]' },
  withdrawn: { label: 'Withdrawn', className: 'border-[#e5e7eb] text-[#7D7D7D] bg-[#f9fafb]' },
  scheduled: { label: 'Scheduled', className: 'border-[#3D1165]/30 text-[#3D1165] bg-[#3D1165]/10' },
  expired: { label: 'Expired', className: 'border-[#e5e7eb] text-[#7D7D7D] bg-[#f9fafb] opacity-80' },
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const normalized = String(status || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
  const cfg = CONFIG[normalized] || {
    label: String(status || 'Unknown').replace(/_/g, ' '),
    className: 'border-[#e5e7eb] text-[#7D7D7D] bg-[#f9fafb]',
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
