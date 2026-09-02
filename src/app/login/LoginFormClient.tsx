'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Shield, Users, UserCheck, AlertTriangle } from 'lucide-react'
import { login } from './actions'
import { SubmitButton } from './SubmitButton'

const DEMO_ACCOUNTS = [
  {
    role: 'Central Admin',
    desc: 'Full Fleet',
    email: 'campus.admin@gmail.com',
    icon: Shield,
  },
  {
    role: 'Department Head',
    desc: 'Approver',
    email: 'campus.hod@gmail.com',
    icon: UserCheck,
  },
  {
    role: 'Club / Submitter',
    desc: 'Submitter',
    email: 'campus.submitter@gmail.com',
    icon: Users,
  },
  {
    role: 'Emergency Officer',
    desc: 'Override',
    email: 'campus.emergency@gmail.com',
    icon: AlertTriangle,
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8187]">
            Demo Roles (1-Click)
          </span>
          <span className="text-[10px] font-mono text-white">Instant auth</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            const isSelected = email === acc.email
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-white bg-[#191919] shadow-sm'
                    : 'border-[#212327] bg-[#0a0a0a] hover:border-white/30 hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#7d8187]'}`} />
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full border border-white/20 text-white bg-white/5">
                    {acc.desc}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-normal text-white leading-tight">{acc.role}</div>
                  <div className="text-[10px] text-[#7d8187] font-mono truncate mt-0.5">{acc.email.split('@')[0]}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#212327]" />
        <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-[#7d8187]">or credentials</span>
        <div className="flex-grow border-t border-[#212327]" />
      </div>

      <form action={login} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf] mb-1.5" htmlFor="email">
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
            className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
            placeholder="you@university.edu"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf] mb-1.5" htmlFor="password">
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
              className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 pr-10 text-xs text-white focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8187] hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>

        {message && (
          <p className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg text-center font-mono">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
