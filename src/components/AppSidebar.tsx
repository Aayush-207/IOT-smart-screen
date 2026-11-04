'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, CheckSquare, Monitor, ScrollText, Calendar } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

type Role = 'submitter' | 'hod' | 'admin' | 'emergency'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const ROLE_TITLE: Record<Role, string> = {
  submitter: 'Submitter',
  hod: 'Department Head',
  admin: 'Central Admin',
  emergency: 'Emergency Officer',
}

const CREATE_ITEM: NavItem = { href: '/dashboard/submitter/new', label: 'Create Announcement', icon: Plus }

function navItemsFor(role: Role, pendingApprovals: number): NavItem[] {
  if (role === 'submitter') {
    return [
      { href: '/dashboard/submitter', label: 'My Announcements', icon: LayoutDashboard },
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

// Row height + gap; the active pill slides by this step between pages.
const ROW_HEIGHT = 42
const ROW_GAP = 4

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
  const create = role === 'submitter' ? CREATE_ITEM : null
  // Longest matching href wins, so /fleet/[id] still highlights Screens & Fleet.
  const activeHref = [...items, ...(create ? [create] : [])]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .reduce((best, item) => (item.href.length > best.length ? item.href : best), '')
  const activeIndex = items.findIndex((item) => item.href === activeHref)

  return (
    <aside className="w-[272px] shrink-0 h-screen p-3 pr-0 select-none font-sans z-30">
      <div className="h-full flex flex-col rounded-2xl text-white bg-gradient-to-b from-[#250a3f] via-[#321054] to-[#1e0733]">
        <Link href="/" className="flex items-center gap-3 px-4 pt-5 pb-5 shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/MIT_circular.png" alt="" className="w-11 h-11 shrink-0 rounded-full object-contain" />
          <span className="min-w-0">
            <span className="block text-[15px] font-extrabold tracking-tight leading-tight">MIT-ADT University</span>
            <span className="block text-xs text-white/60 pt-0.5">Intelligent Broadcasts</span>
          </span>
        </Link>

        {create && (
          <div className="px-3 pb-4 shrink-0">
            <Link
              href={create.href}
              aria-current={activeHref === create.href ? 'page' : undefined}
              className={`flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 ${
                activeHref === create.href ? 'bg-white text-[#321054]' : 'bg-[#9333ea] text-white hover:bg-[#a855f7]'
              }`}
            >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2.25} />
              {create.label}
            </Link>
          </div>
        )}

        <nav aria-label="Main" className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3">
          <div className="relative flex flex-col" style={{ gap: ROW_GAP }}>
            {activeIndex >= 0 && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 rounded-xl bg-white transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ height: ROW_HEIGHT, transform: `translateY(${(ROW_HEIGHT + ROW_GAP) * activeIndex}px)` }}
              />
            )}
            {items.map((item) => {
              const Icon = item.icon
              const isActive = item.href === activeHref
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  style={{ height: ROW_HEIGHT }}
                  className={`relative flex items-center gap-3 px-3 rounded-xl text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 ${
                    isActive ? 'text-[#321054] font-semibold' : 'text-white/75 font-medium hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#7e22ce]' : ''}`} strokeWidth={1.75} />
                  <span className="truncate flex-1">{item.label}</span>
                  {!!item.badge && (
                    <span
                      className={`min-w-5 h-5 px-1.5 rounded-md flex items-center justify-center text-xs font-semibold tabular-nums ${
                        isActive ? 'bg-[#7e22ce]/10 text-[#7e22ce]' : 'bg-[#9333ea] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="flex items-center gap-3 m-3 mt-2 pt-3 border-t border-white/10 shrink-0">
          <span className="w-9 h-9 rounded-full bg-[#9333ea] text-sm font-semibold uppercase flex items-center justify-center shrink-0">
            {userEmail.charAt(0) || 'U'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold truncate" title={userEmail}>{userEmail.split('@')[0]}</span>
            <span className="block text-xs text-white/60 truncate">{ROLE_TITLE[role] ?? role}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
