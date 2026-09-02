'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Shield, Users, UserCheck, AlertTriangle } from 'lucide-react'
import { login } from './actions'
import { SubmitButton } from './SubmitButton'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'campus.admin@gmail.com', icon: Shield, color: 'text-indigo-500 hover:border-indigo-500/50 bg-indigo-500/5' },
  { role: 'HOD', email: 'campus.hod@gmail.com', icon: UserCheck, color: 'text-purple-500 hover:border-purple-500/50 bg-purple-500/5' },
  { role: 'Submitter', email: 'campus.submitter@gmail.com', icon: Users, color: 'text-blue-500 hover:border-blue-500/50 bg-blue-500/5' },
  { role: 'Emergency', email: 'campus.emergency@gmail.com', icon: AlertTriangle, color: 'text-rose-500 hover:border-rose-500/50 bg-rose-500/5' },
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
      {/* Quick Account Fill Selector */}
      <div>
        <span className="cohere-mono-label text-[var(--mute)] block text-center mb-2.5">
          Fast Demo Role Credentials
        </span>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className="p-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas-stone)]/50 hover:bg-[var(--canvas-stone)] text-left transition-all cursor-pointer flex items-center gap-2"
              >
                <Icon className="w-3.5 h-3.5 text-[var(--slate)] shrink-0" />
                <div className="truncate min-w-0">
                  <div className="text-xs font-semibold text-[var(--ink)]">{acc.role}</div>
                  <div className="text-[10px] text-[var(--mute)] font-mono truncate">{acc.email.split('@')[0]}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[var(--hairline)]" />
        <span className="flex-shrink mx-3 text-xs text-[var(--mute)] font-mono uppercase text-[10px]">or email login</span>
        <div className="flex-grow border-t border-[var(--hairline)]" />
      </div>

      <form action={login} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5" htmlFor="email">
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
            className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg focus:outline-none focus:border-[var(--focus-blue)] text-[var(--ink)] text-xs font-medium"
            placeholder="you@university.edu"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]" htmlFor="password">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-10 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg focus:outline-none focus:border-[var(--focus-blue)] text-[var(--ink)] text-xs font-medium"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] p-1 rounded-md transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>

        {message && (
          <p className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs rounded-lg text-center font-medium border border-rose-200 dark:border-rose-900">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
