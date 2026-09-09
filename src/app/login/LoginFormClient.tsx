'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Shield, Users, UserCheck, AlertTriangle } from 'lucide-react'
import { login } from './actions'
import { SubmitButton } from './SubmitButton'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'campus.admin@gmail.com', icon: Shield },
  { role: 'HOD', email: 'campus.hod@gmail.com', icon: UserCheck },
  { role: 'Submitter', email: 'campus.submitter@gmail.com', icon: Users },
  { role: 'Emergency', email: 'campus.emergency@gmail.com', icon: AlertTriangle },
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
    <div className="w-full space-y-8">
      {/* Demo Roles - Neo Brutalism style */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b-2 border-neutral-900 pb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-900">
            Demo Roles
          </span>
          <span className="text-[10px] font-bold text-neutral-500 uppercase">One-Click Test</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            const isSelected = email === acc.email
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`flex items-center gap-3 p-3 text-left transition-all outline-none border-2 ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-[4px_4px_0_0_#A8A29E]'
                    : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-900 hover:shadow-[4px_4px_0_0_#E5E5E5]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-neutral-900'}`} />
                <span className="text-sm font-bold tracking-tight truncate">{acc.role}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form action={login} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-900" htmlFor="email">
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
            className="w-full bg-white border-2 border-neutral-200 px-4 py-3.5 text-neutral-900 font-medium outline-none transition-all placeholder:text-neutral-400 placeholder:font-normal focus:border-neutral-900 focus:shadow-[4px_4px_0_0_#171717]"
            placeholder="you@university.edu"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-900" htmlFor="password">
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
              className="w-full bg-white border-2 border-neutral-200 px-4 py-3.5 pr-12 text-neutral-900 font-medium outline-none transition-all placeholder:text-neutral-400 placeholder:font-normal focus:border-neutral-900 focus:shadow-[4px_4px_0_0_#171717]"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer outline-none focus-visible:text-neutral-900"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>

        {message && (
          <div className="p-4 bg-red-50 border-2 border-red-900 text-red-900 mt-6 shadow-[4px_4px_0_0_#7F1D1D]">
            <p className="text-sm font-bold">
              {message}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
