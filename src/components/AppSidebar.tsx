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
  submitter: { title: 'Submitter', tag: 'Club & Faculty', color: 'bg-[#cfa2f7]/10 text-[#cfa2f7] border border-[#cfa2f7]/30 relative overflow-hidden' },
  hod: { title: 'Department Head', tag: 'Approver', color: 'bg-[#00eaff]/10 text-[#00eaff]' },
  admin: { title: 'Central Admin', tag: 'Full Access', color: 'bg-[#ffeaea] text-[#ef2045]' },
  emergency: { title: 'Emergency Officer', tag: 'Override Auth', color: 'bg-[#af1591]/10 text-[#af1591]' },
}

function navItemsFor(role: Role, pendingApprovals: number): NavItem[] {
  if (role === 'submitter') {
    return [
      { href: '/dashboard/submitter', label: 'My Announcements', icon: LayoutDashboard },
      { href: '/dashboard/submitter/new', label: 'Create Announcement', icon: PlusCircle },
      { href: '/dashboard/submitter/events', label: 'Events Calendar', icon: Calendar },
    ]
  }
  if (role === 'hod') {
    return [
      { href: '/dashboard/hod', label: 'Department Overview', icon: LayoutDashboard, colorClass: 'bg-indigo-600' },
      { href: '/dashboard/hod/approvals', label: 'Pending Approvals', icon: CheckSquare, badge: pendingApprovals, colorClass: 'bg-[#af1591]' },
      { href: '/dashboard/hod/screens', label: 'Screens', icon: Monitor, colorClass: 'bg-blue-500' },
      { href: '/dashboard/hod/events', label: 'Department Events', icon: Calendar, colorClass: 'bg-[#00eaff]' },
    ]
  }
  if (role === 'emergency') {
    return [
      { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, colorClass: 'bg-indigo-600' },
      { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle, colorClass: 'bg-red-600' },
      { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText, colorClass: 'bg-[#fdf4ff]0' },
    ]
  }
  // Admin
  return [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, colorClass: 'bg-[#3D1165]' },
    { href: '/dashboard/admin/approvals', label: 'Admin Approvals', icon: CheckSquare, colorClass: 'bg-[#af1591]' },
    { href: '/dashboard/admin/fleet', label: 'Screens & Fleet', icon: Monitor, colorClass: 'bg-[#9f2176]' },
    { href: '/dashboard/admin/announcements', label: 'Broadcast Catalog', icon: ListOrdered, colorClass: 'bg-[#512a74]' },
    { href: '/dashboard/admin/calendar', label: 'Calendar', icon: Calendar, colorClass: 'bg-[#cfa2f7] text-[#3D1165]' },
    { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle, colorClass: 'bg-red-600' },
    { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText, colorClass: 'bg-[#fdf4ff]0' },
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
  const roleInfo = ROLE_DISPLAY[role] || { title: role, tag: 'User', color: 'bg-[#e5e7eb] text-[#1e1e2e]' }

  return (
    <aside className="w-[260px] shrink-0 bg-gradient-to-b from-[#1c0836] via-[#3D1165] to-[#1c0836] border-r border-white/5 text-[#ffffff] flex flex-col h-screen sticky top-0 select-none z-30 shadow-[4px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Background Glows Removed */}

      {/* Brand Header */}
      <div className="py-5 flex flex-col items-center px-4 border-b border-white/5 shrink-0 relative z-10 backdrop-blur-sm bg-black/10">
        <Link href="/" className="flex flex-row items-center gap-2 group w-full justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/MIT_circular.png"
            alt="MIT ADT University Logo"
            className="w-16 h-16 object-contain group-hover:scale-105 transition-all duration-300 shrink-0"
          />
          <div className="flex flex-col items-center text-center pt-0.5">
            <div className="text-[1.15rem] font-extrabold tracking-tight text-white font-[family-name:var(--font-inter)] leading-none pb-0.5">
              MIT-ADT
            </div>
            <div className="flex w-full h-[2.5px] mb-0.5">
              <div className="h-full flex-1 bg-[#a855f7]"></div>
              <div className="h-full flex-1 bg-[#f97316]"></div>
              <div className="h-full flex-1 bg-[#10b981]"></div>
            </div>
            <div className="text-[0.75rem] font-medium tracking-widest text-white font-[family-name:var(--font-inter)] leading-none">
              UNIVERSITY
            </div>
          </div>
        </Link>
        <div className="w-4/5 flex flex-col items-center mt-0 pt-1 border-t border-white/90">
          <div className="text-[9px] uppercase tracking-widest font-extrabold bg-gradient-to-r from-purple-100 via-[#cfa2f7] to-purple-100 bg-clip-text text-transparent text-center">
            Intelligent Broadcasts
          </div>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-5 pb-4 shrink-0 pt-6 relative z-10">
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_20px_rgba(0,0,0,0.2)] group hover:bg-white/[0.06] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg shadow-sm ${roleInfo.color}`}>
              {roleInfo.title}
            </span>
            <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#af1591] animate-pulse shadow-[0_0_8px_rgba(175,21,145,0.8)]" />
            </div>
          </div>
          <span className="text-[12px] font-medium text-[#cfa2f7]/80 group-hover:text-[#cfa2f7] transition-colors pl-1">{roleInfo.tag}</span>
        </div>
      </div>

      {/* Navigation Stack */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto relative z-10 py-2 custom-scrollbar">
        <div className="px-3 pb-2 pt-2 text-[10px] font-bold text-[#cfa2f7]/60 uppercase tracking-widest">
          Navigation
        </div>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500 group relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-r from-[#cfa2f7]/20 to-[#cfa2f7]/5 text-[#cfa2f7] border border-[#cfa2f7]/40 translate-x-2`
                  : 'text-[#cfa2f7] hover:bg-gradient-to-r hover:from-transparent hover:to-[#e879f9]/15 hover:text-[#e879f9] border border-transparent hover:border-[#e879f9]/40'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#cfa2f7]" />
              )}
              {/* Hover Left Indicator */}
              {!isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#e879f9] rounded-r-full transition-all duration-300 group-hover:h-3/4" />
              )}

              <div className="flex items-center gap-3.5 min-w-0 font-bold text-[14px] relative z-10">
                <Icon className={`w-[18px] h-[18px] shrink-0 transition-all duration-500 ${isActive ? 'text-[#cfa2f7] animate-pulse' : 'text-[#cfa2f7]/70 group-hover:scale-125 group-hover:rotate-12 group-hover:text-[#e879f9]'}`} />
                <span className={`truncate tracking-wide transition-transform duration-300 ${!isActive && 'group-hover:translate-x-1.5'}`}>{item.label}</span>
              </div>

              {!!item.badge && item.badge > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full relative z-10 ${
                    isActive ? 'bg-[#cfa2f7] text-[#1c0836]' : 'bg-[#ef2045] text-[#ffffff] shadow-[0_0_10px_rgba(239,32,69,0.5)]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {role === 'emergency' && (
          <div className="pt-6 px-1">
            <Link
              href="/dashboard/admin/emergency"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-[#ffffff] rounded-xl text-sm font-extrabold shadow-[0_8px_25px_rgba(220,38,38,0.5),inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-red-400/30 transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse group-hover:scale-110 transition-transform" />
              <span className="tracking-wide">Broadcast Alert</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 m-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shrink-0 relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-black/30 transition-colors">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[#ffffff] text-xs truncate drop-shadow-sm" title={userEmail}>
              {userEmail}
            </p>
            <p className="text-[10px] text-[#00eaff]/80 font-medium mt-1 uppercase tracking-wider">Role: {role}</p>
          </div>
          <div className="pt-3 border-t border-white/10">
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Abstract Footer Graphic */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[65%] pointer-events-none z-0 overflow-hidden opacity-[0.4] mix-blend-screen"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)'
        }}
      >
        <img 
          src="/sidebar-bg.jpg" 
          alt="" 
          className="w-full h-full object-cover object-center"
        />
      </div>
    </aside>
  )
}
