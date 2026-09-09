'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  CheckSquare,
  Monitor,
  Tv,
  ListOrdered,
  BarChart3,
  ScrollText,
  AlertTriangle,
  Sun,
  Moon,
  Calendar,
  Zap
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

type Role = 'submitter' | 'hod' | 'admin' | 'emergency'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
  colorClass?: string
}

const ROLE_DISPLAY: Record<Role, { title: string; tag: string; color: string }> = {
  submitter: { title: 'Submitter', tag: 'Club & Faculty', color: 'bg-indigo-100 text-indigo-700' },
  hod: { title: 'Department Head', tag: 'Approver', color: 'bg-emerald-100 text-emerald-700' },
  admin: { title: 'Central Admin', tag: 'Full Access', color: 'bg-rose-100 text-rose-700' },
  emergency: { title: 'Emergency Officer', tag: 'Override Auth', color: 'bg-amber-100 text-amber-700' },
}

function navItemsFor(role: Role, pendingApprovals: number): NavItem[] {
  if (role === 'submitter') {
    return [
      { href: '/dashboard/submitter', label: 'My Announcements', icon: LayoutDashboard, colorClass: 'bg-indigo-600' },
      { href: '/dashboard/submitter/new', label: 'Create Announcement', icon: PlusCircle, colorClass: 'bg-rose-500' },
      { href: '/dashboard/submitter/events', label: 'Events Calendar', icon: Calendar, colorClass: 'bg-emerald-500' },
    ]
  }
  if (role === 'hod') {
    return [
      { href: '/dashboard/hod', label: 'Department Overview', icon: LayoutDashboard, colorClass: 'bg-indigo-600' },
      { href: '/dashboard/hod/approvals', label: 'Pending Approvals', icon: CheckSquare, badge: pendingApprovals, colorClass: 'bg-amber-500' },
      { href: '/dashboard/hod/screens', label: 'Screens', icon: Monitor, colorClass: 'bg-blue-500' },
      { href: '/dashboard/hod/events', label: 'Department Events', icon: Calendar, colorClass: 'bg-emerald-500' },
    ]
  }
  if (role === 'emergency') {
    return [
      { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, colorClass: 'bg-indigo-600' },
      { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle, colorClass: 'bg-red-600' },
      { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText, colorClass: 'bg-slate-500' },
    ]
  }
  // Admin
  return [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, colorClass: 'bg-indigo-600' },
    { href: '/dashboard/admin/approvals', label: 'Admin Approvals', icon: CheckSquare, colorClass: 'bg-amber-500' },
    { href: '/dashboard/admin/fleet', label: 'Screens & Fleet', icon: Monitor, colorClass: 'bg-blue-500' },
    { href: '/dashboard/admin/announcements', label: 'Broadcast Catalog', icon: ListOrdered, colorClass: 'bg-purple-500' },
    { href: '/dashboard/admin/calendar', label: 'Calendar', icon: Calendar, colorClass: 'bg-emerald-500' },
    { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle, colorClass: 'bg-red-600' },
    { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText, colorClass: 'bg-slate-500' },
  ]
}

export function AppSidebar({
  role,
  userEmail,
  pendingApprovals = 0,
}: {
  role: Role
  userEmail: string
  pendingApprovals?: number
}) {
  const pathname = usePathname()
  const items = navItemsFor(role, pendingApprovals)
  const roleInfo = ROLE_DISPLAY[role] || { title: role, tag: 'User', color: 'bg-slate-100 text-slate-700' }

  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-slate-200 text-slate-900 flex flex-col h-screen sticky top-0 select-none z-30 font-sans shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-3 group w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.png" 
            alt="Campus Cast" 
            className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
          />
          <div className="hidden fallback-logo w-8 h-8 bg-indigo-600 rounded-lg text-white items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
            CC
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 truncate">
            Campus Cast
          </span>
        </Link>
      </div>

      {/* Role Pill Banner */}
      <div className="px-6 pb-6 shrink-0">
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${roleInfo.color}`}>
              {roleInfo.title}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-500">{roleInfo.tag}</span>
        </div>
      </div>

      {/* Navigation Stack */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </div>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? `${item.colorClass} text-white shadow-md shadow-slate-200/50`
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 font-medium text-sm">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {!!item.badge && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {role === 'emergency' && (
          <div className="pt-6">
            <Link
              href="/dashboard/admin/emergency"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 transition-all"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Broadcast Alert</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-xs truncate" title={userEmail}>
              {userEmail}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Role: {role}</p>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  )
}
