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

const ROLE_DISPLAY: Record<Role, { title: string; tag: string; chipClass: string }> = {
  submitter: { title: 'Submitter', tag: 'Club & Faculty', chipClass: 'sentry-chip-violet' },
  hod: { title: 'Department Head', tag: 'Approver', chipClass: 'sentry-chip-pink' },
  admin: { title: 'Central Admin', tag: 'Full Access', chipClass: 'sentry-chip-green' },
  emergency: { title: 'Emergency Officer', tag: 'Override Auth', chipClass: 'sentry-chip-pink' },
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
    { href: '/dashboard/admin/wall', label: 'Live Screen Wall', icon: Tv },
    { href: '/dashboard/admin/announcements', label: 'Broadcast Catalog', icon: ListOrdered },
    { href: '/dashboard/admin/emergency', label: 'Emergency Alert', icon: AlertTriangle },
    { href: '/dashboard/admin/analytics', label: 'Analytics & Telemetry', icon: BarChart3 },
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
    const isLight = document.documentElement.classList.contains('light')
    setTheme(isLight ? 'light' : 'dark')
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }

  const roleInfo = ROLE_DISPLAY[role] || { title: role, tag: 'User', chipClass: 'sentry-chip-violet' }

  return (
    <aside className="w-[260px] shrink-0 border-r border-[#362d59] bg-[#150f23] text-white flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#362d59] flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#c2ef4e] text-[#150f23] flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(194,239,78,0.4)] group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              CampusCast
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#a39cb0]">Smart Screen Hub</div>
          </div>
        </Link>
      </div>

      {/* Role Pill Banner */}
      <div className="px-5 py-3 border-b border-[#362d59] bg-[#1f1633]/60 flex items-center justify-between shrink-0">
        <div>
          <span className="font-semibold text-xs text-white block leading-tight">{roleInfo.title}</span>
          <span className="text-[10px] text-[#bdb8c0] font-mono">{roleInfo.tag}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#c2ef4e] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c2ef4e] animate-pulse" /> ONLINE
        </span>
      </div>

      {/* Navigation Stack */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-[#8b8496]">
          Navigation
        </div>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#c2ef4e] text-[#150f23] font-bold shadow-[0_0_10px_rgba(194,239,78,0.3)]'
                  : 'text-[#bdb8c0] hover:text-white hover:bg-[#1f1633]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#150f23]' : 'text-[#8b8496]'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {!!item.badge && item.badge > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-[#150f23] text-[#c2ef4e]' : 'bg-[#fa7faa]/20 text-[#fa7faa] border border-[#fa7faa]/40'
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#fa5252] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-md"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
              <span>Broadcast Alert</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-[#362d59] bg-[#1f1633]/80 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-white truncate text-[11px]" title={userEmail}>
              {userEmail}
            </p>
            <p className="text-[10px] text-[#8b8496] font-mono uppercase tracking-wider">{role}</p>
          </div>

          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-md border border-[#362d59] bg-[#150f23] text-[#bdb8c0] hover:text-white cursor-pointer transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#c2ef4e]" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="pt-1 border-t border-[#362d59]">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
