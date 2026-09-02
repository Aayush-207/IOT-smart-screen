'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Shield, Users, UserCheck, AlertTriangle } from 'lucide-react'
import { login } from './actions'
import { SubmitButton } from './SubmitButton'

const DEMO_ACCOUNTS = [
  {
    role: 'Central Admin',
    desc: 'Screens & Safety',
    email: 'campus.admin@gmail.com',
    icon: Shield,
    badgeClass: 'sentry-chip-green',
  },
  {
    role: 'Department Head',
    desc: 'HOD Approver',
    email: 'campus.hod@gmail.com',
    icon: UserCheck,
    badgeClass: 'sentry-chip-pink',
  },
  {
    role: 'Club / Submitter',
    desc: 'Post Announcements',
    email: 'campus.submitter@gmail.com',
    icon: Users,
    badgeClass: 'sentry-chip-violet',
  },
  {
    role: 'Emergency Officer',
    desc: 'Campus Override',
    email: 'campus.emergency@gmail.com',
    icon: AlertTriangle,
    badgeClass: 'sentry-chip-pink',
  },
]

export function LoginFormClient({ message }: { message?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleQuickFill = (accEmail: string) => {
    setEmail(accEmail)
    setPassword('password123')
  }

  return (
    <div className="w-full space-y-6">
      {/* Fast Demo Role Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="sentry-mono-label text-[#a39cb0]">
            Quick Demo Logins (1-Click)
          </span>
          <span className="text-[10px] font-mono text-[#c2ef4e]">Click any card</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            const isSelected = email === acc.email
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#c2ef4e] bg-[#261c3d] shadow-[0_0_12px_rgba(194,239,78,0.2)]'
                    : 'border-[#362d59] bg-[#1f1633] hover:border-[#6a5fc1] hover:bg-[#261c3d]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#c2ef4e]' : 'text-[#8b8496]'}`} />
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${acc.badgeClass}`}>
                    {acc.desc}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{acc.role}</div>
                  <div className="text-[10px] text-[#8b8496] font-mono truncate mt-0.5">{acc.email.split('@')[0]}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#362d59]" />
        <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-[#8b8496]">or enter credentials</span>
        <div className="flex-grow border-t border-[#362d59]" />
      </div>

      <form action={login} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#bdb8c0] mb-1.5" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sentry-input text-xs"
            placeholder="you@university.edu"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#bdb8c0] mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sentry-input pr-10 text-xs"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8496] hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#c2ef4e]" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>

        {message && (
          <p className="p-3 bg-[#fa5252]/10 border border-[#fa5252]/30 text-[#fa5252] text-xs rounded-lg text-center font-bold">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
