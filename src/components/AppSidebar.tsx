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
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

type Role = 'submitter' | 'hod' | 'admin' | 'emergency'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const ROLE_DISPLAY: Record<Role, { title: string; tag: string }> = {
  submitter: { title: 'Submitter', tag: 'Club & Faculty' },
  hod: { title: 'Department Head', tag: 'Approver' },
  admin: { title: 'Central Admin', tag: 'Full Access' },
  emergency: { title: 'Emergency Officer', tag: 'Override Auth' },
}

function navItemsFor(role: Role, pendingApprovals: number): NavItem[] {
  if (role === 'submitter') {
    return [
      { href: '/dashboard/submitter', label: 'My Announcements', icon: LayoutDashboard },
      { href: '/dashboard/submitter/new', label: 'Create Announcement', icon: PlusCircle },
    ]
  }
  if (role === 'hod') {
    return [
      { href: '/dashboard/hod', label: 'Department Overview', icon: LayoutDashboard },
      { href: '/dashboard/hod/approvals', label: 'Pending Approvals', icon: CheckSquare, badge: pendingApprovals },
      { href: '/dashboard/hod/screens', label: 'Screens', icon: Monitor },
    ]
  }
  if (role === 'emergency') {
    return [
      { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle },
      { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText },
    ]
  }
  // Admin
  return [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin/approvals', label: 'Admin Approvals', icon: CheckSquare },
    { href: '/dashboard/admin/fleet', label: 'Screens & Fleet', icon: Monitor },
    { href: '/dashboard/admin/announcements', label: 'Broadcast Catalog', icon: ListOrdered },
    { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle },
    { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText },
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.classList.add('theme-transition')
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 400)
  }

  const roleInfo = ROLE_DISPLAY[role] || { title: role, tag: 'User' }

  return (
    <aside className="w-[260px] shrink-0 border-r border-neutral-200 dark:border-[#212327] bg-[var(--canvas-inset)] dark:bg-[#0a0a0a] text-[var(--ink)] dark:text-white flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-200 dark:border-[#212327] flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-white/20 bg-neutral-200 dark:bg-white/5 text-[var(--ink)] dark:text-white flex items-center justify-center font-mono font-bold text-sm group-hover:border-neutral-400 dark:group-hover:border-white transition-colors">
            X
          </div>
          <div>
            <div className="text-sm font-normal tracking-tight text-[var(--ink)] dark:text-white flex items-center gap-1.5">
              CampusCast
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#7d8187]">Display Mesh</div>
          </div>
        </Link>
      </div>

      {/* Role Pill Banner */}
      <div className="px-5 py-3 border-b border-neutral-200 dark:border-[#212327] bg-neutral-100 dark:bg-[#141414] flex items-center justify-between shrink-0">
        <div>
          <span className="font-normal text-xs text-[var(--ink)] dark:text-white block leading-tight">{roleInfo.title}</span>
          <span className="text-[10px] text-[#7d8187] font-mono">{roleInfo.tag}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[var(--ink)] dark:text-white border border-neutral-300 dark:border-white/20 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
        </span>
      </div>

      {/* Navigation Stack */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#7d8187]">
          Navigation
        </div>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2 rounded-full text-xs transition-all ${
                isActive
                  ? 'bg-neutral-800 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-sm'
                  : 'text-neutral-500 dark:text-[#dadbdf] hover:text-[var(--ink)] dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#141414]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white dark:text-[#0a0a0a]' : 'text-neutral-400 dark:text-[#7d8187]'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {!!item.badge && item.badge > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                    isActive ? 'bg-white dark:bg-[#0a0a0a] text-[var(--ink)] dark:text-white' : 'bg-neutral-200 dark:bg-white/10 text-[var(--ink)] dark:text-white border border-neutral-300 dark:border-white/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {role === 'emergency' && (
          <div className="pt-4">
            <Link
              href="/dashboard/admin/emergency"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-rose-600 text-white text-xs uppercase tracking-wider hover:bg-rose-500 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
              <span>Broadcast Alert</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-neutral-200 dark:border-[#212327] bg-neutral-100 dark:bg-[#141414] space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <p className="font-normal text-[var(--ink)] dark:text-white truncate text-[11px]" title={userEmail}>
              {userEmail}
            </p>
            <p className="text-[10px] text-[#7d8187] font-mono uppercase tracking-wider">{role}</p>
          </div>

          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-full border border-neutral-300 dark:border-[#212327] bg-white dark:bg-[#141414] text-neutral-600 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white hover:scale-110 active:scale-95 cursor-pointer transition-all duration-200"
          >
            <span className="inline-block transition-transform duration-300 hover:rotate-45">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-700" />}
            </span>
          </button>
        </div>

        <div className="pt-1 border-t border-neutral-200 dark:border-[#212327]">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
