'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, ClipboardCheck, Monitor, ScrollText, AlertTriangle, Sun, Moon, Tv, BarChart3 } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

type Role = 'submitter' | 'hod' | 'admin' | 'emergency'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const ROLE_LABEL: Record<Role, string> = {
  submitter: 'SUBMITTER',
  hod: 'HOD',
  admin: 'ADMIN',
  emergency: 'EMERGENCY AUTHORITY',
}

function navItemsFor(role: Role, pendingApprovals: number): NavItem[] {
  if (role === 'submitter') {
    return [
      { href: '/dashboard/submitter', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/submitter/new', label: 'New Announcement', icon: FileText },
    ]
  }
  if (role === 'hod') {
    return [
      { href: '/dashboard/hod', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/hod/approvals', label: 'Approval Queue', icon: ClipboardCheck, badge: pendingApprovals },
    ]
  }
  // Emergency Authority: no device management, no approvals (blueprint Part 8).
  if (role === 'emergency') {
    return [
      { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/admin/audit', label: 'Audit Log', icon: ScrollText },
    ]
  }
  // admin
  return [
    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/approvals', label: 'Critical Approvals', icon: ClipboardCheck },
    { href: '/dashboard/admin/wall', label: 'Live Video Wall', icon: Tv },
    { href: '/dashboard/admin/fleet', label: 'Devices', icon: Monitor },
    { href: '/dashboard/admin/announcements', label: 'Published', icon: FileText },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <aside className="w-[250px] shrink-0 border-r border-[var(--hairline)] bg-[var(--canvas)] flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[var(--hairline)] flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--cohere-near-black)] text-white flex items-center justify-center font-bold">
            <svg viewBox="0 0 76 65" className="w-4 h-4 fill-current">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-[var(--ink)]">CampusCast</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--mute)]">Command Console</div>
          </div>
        </Link>
      </div>

      {/* Role Pill & Status Indicator */}
      <div className="px-6 py-3.5 border-b border-[var(--hairline)] bg-[var(--canvas-stone)]/40 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[var(--slate)]">
          {ROLE_LABEL[role]}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[var(--cohere-deep-green)] dark:text-emerald-400 font-semibold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#003c33] dark:bg-emerald-400 animate-pulse" /> Live Node
        </span>
      </div>

      {/* Navigation Stack */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-[var(--mute)]">
          Console Navigation
        </div>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-[var(--cohere-near-black)] text-white font-medium shadow-xs'
                  : 'text-[var(--ink)] hover:bg-[var(--canvas-stone)] font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--slate)]'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {!!item.badge && (
                <span className="cohere-chip-coral text-[10px] py-0 px-2 leading-tight">
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
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#b30000] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
              <span>Broadcast Alert</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-[var(--hairline)] bg-[var(--canvas-stone)]/30 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-[var(--ink)] truncate text-[11px]" title={userEmail}>
              {userEmail}
            </p>
            <p className="text-[10px] text-[var(--mute)] font-mono uppercase tracking-wider">{ROLE_LABEL[role] || role}</p>
          </div>

          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-1.5 rounded-md border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--slate)] hover:text-[var(--ink)] cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          </button>
        </div>

        <div className="pt-1 border-t border-[var(--hairline)]/50">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
