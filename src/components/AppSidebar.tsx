'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  CheckSquare,
  Monitor,
  ScrollText,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

type Role = 'submitter' | 'hod' | 'admin' | 'emergency'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const ROLE_DISPLAY: Record<Role, { title: string; tag: string; badgeStyle: string }> = {
  submitter: {
    title: 'Submitter',
    tag: 'Club & Faculty',
    badgeStyle: 'bg-purple-500/20 text-purple-200 border border-purple-400/30',
  },
  hod: {
    title: 'Dept Head',
    tag: 'Academic Approver',
    badgeStyle: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30',
  },
  admin: {
    title: 'Central Admin',
    tag: 'Full Governance',
    badgeStyle: 'bg-[#7c3aed]/30 text-purple-100 border border-purple-300/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
  },
  emergency: {
    title: 'Emergency Officer',
    tag: 'Override Auth',
    badgeStyle: 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
  },
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
      { href: '/dashboard/hod', label: 'Department Overview', icon: LayoutDashboard },
      { href: '/dashboard/hod/approvals', label: 'Pending Approvals', icon: CheckSquare, badge: pendingApprovals },
      { href: '/dashboard/hod/screens', label: 'Screens & Nodes', icon: Monitor },
      { href: '/dashboard/hod/events', label: 'Department Events', icon: Calendar },
    ]
  }
  if (role === 'emergency') {
    return [
      { href: '/dashboard/admin', label: 'System Overview', icon: LayoutDashboard },
      { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText },
    ]
  }
  // Admin
  return [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin/approvals', label: 'Admin Approvals', icon: CheckSquare },
    { href: '/dashboard/admin/fleet', label: 'Screens & Fleet', icon: Monitor },
    { href: '/dashboard/admin/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/admin/audit', label: 'Audit Log & Catalog', icon: ScrollText },
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
  const roleInfo = ROLE_DISPLAY[role] || { title: role, tag: 'User', badgeStyle: 'bg-purple-500/20 text-purple-200' }

  return (
    <aside className="w-[260px] shrink-0 bg-gradient-to-b from-[#180729] via-[#2a0e48] to-[#150424] border-r border-[#7c3aed]/20 text-white flex flex-col h-screen sticky top-0 select-none z-30 shadow-[4px_0_30px_rgba(10,2,18,0.7)] relative overflow-hidden">
      {/* Brand Header */}
      <div className="py-5 px-4 flex flex-col items-center border-b border-purple-500/15 shrink-0 relative z-10 backdrop-blur-md bg-black/15">
        <Link href="/" className="flex flex-row items-center gap-2.5 group w-full justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center p-1 rounded-2xl bg-white/10 border border-purple-400/25 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:border-purple-400/50 transition-all duration-300">
            <img
              src="/MIT_circular.png"
              alt="MIT ADT University Logo"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-full"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-[1.15rem] font-extrabold tracking-tight text-white font-[family-name:var(--font-inter)] leading-none pb-0.5">
              MIT-ADT
            </div>
            <div className="flex w-full h-[2.5px] my-0.5 rounded-full overflow-hidden">
              <div className="h-full flex-1 bg-[#a855f7]" />
              <div className="h-full flex-1 bg-[#f97316]" />
              <div className="h-full flex-1 bg-[#10b981]" />
            </div>
            <div className="text-[0.75rem] font-medium tracking-widest text-white/90 font-[family-name:var(--font-inter)] leading-none">
              UNIVERSITY
            </div>
          </div>
        </Link>
        <div className="w-4/5 flex flex-col items-center mt-1.5 pt-1 border-t border-purple-400/20">
          <div className="text-[9px] uppercase tracking-widest font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-[#e9d5ff] to-purple-200 text-center flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-300 shrink-0" />
            <span>Intelligent Broadcasts</span>
          </div>
        </div>
      </div>

      {/* Role Pill Banner with Multiple Tints */}
      <div className="px-4 py-3 shrink-0 relative z-10">
        <div className="p-3.5 rounded-2xl bg-purple-950/40 backdrop-blur-md border border-purple-400/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.3)] hover:border-purple-400/35 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg ${roleInfo.badgeStyle}`}>
              {roleInfo.title}
            </span>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full border border-purple-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.9)]" />
              <span className="text-[9px] font-mono text-purple-200/80 font-bold">LIVE</span>
            </div>
          </div>
          <span className="text-[11px] font-medium text-purple-200/70 block pl-0.5">
            {roleInfo.tag}
          </span>
        </div>
      </div>

      {/* Navigation Stack with Rich Purple Highlights */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto relative z-10 py-1.5 custom-scrollbar">
        <div className="px-3 pb-1 pt-1 text-[10px] font-extrabold text-purple-300/40 uppercase tracking-widest">
          Navigation
        </div>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-[#7c3aed]/40 via-[#4c1d76]/50 to-transparent text-white border-l-[3.5px] border-l-[#c084fc] border-t border-b border-r border-purple-400/20 shadow-[0_2px_12px_rgba(76,29,118,0.35)] translate-x-1'
                  : 'text-purple-200/75 hover:bg-white/[0.06] hover:text-white border border-transparent hover:border-purple-400/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 font-semibold text-xs relative z-10">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-[#e9d5ff]' : 'text-purple-300/60 group-hover:text-purple-100'
                  }`}
                />
                <span className="truncate tracking-wide">{item.label}</span>
              </div>

              {!!item.badge && item.badge > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full relative z-10 ${
                    isActive
                      ? 'bg-[#c084fc] text-[#1c0836] shadow-xs'
                      : 'bg-[#9333ea] text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3.5 m-3 rounded-2xl bg-purple-950/50 backdrop-blur-lg border border-purple-400/20 shrink-0 relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d76] border border-purple-300/30 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
              {userEmail ? userEmail.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-xs truncate drop-shadow-xs" title={userEmail}>
                {userEmail}
              </p>
              <p className="text-[10px] text-purple-300/70 font-medium uppercase tracking-wider">
                Role &bull; {role}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-purple-400/15">
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Abstract Ambient Footer Graphic - IoT Smart Campus Network */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[65%] pointer-events-none z-0 overflow-hidden opacity-[0.55] mix-blend-screen transition-opacity duration-300"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 20%, black 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 20%, black 80%)',
        }}
      >
        <img
          src="/sidebar-bg.jpg"
          alt="CampusCast Network Backdrop"
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </aside>
  )
}
