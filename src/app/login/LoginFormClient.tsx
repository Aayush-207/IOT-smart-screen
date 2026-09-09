'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Shield, Users, UserCheck, AlertTriangle, AlertCircle } from 'lucide-react'
import { login } from './actions'
import { SubmitButton } from './SubmitButton'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'campus.admin@gmail.com', icon: Shield },
  { role: 'HOD', email: 'campus.hod@gmail.com', icon: UserCheck },
  { role: 'Submitter', email: 'campus.submitter@gmail.com', icon: Users },
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
      {/* Demo Roles - Modern Flat Bento style */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            DEMO ROLES
          </span>
          <span className="text-[10px] font-bold text-[#562a75] bg-[#562a75]/10 px-3 py-1 rounded-full">
            One-Click Test
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            const isSelected = email === acc.email
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`group flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-[16px] transition-all duration-200 outline-none border cursor-pointer ${
                  isSelected
                    ? 'border-transparent bg-gradient-to-br from-[#562a75] to-[#8a44b8] text-white shadow-md shadow-[#562a75]/30 -translate-y-0.5'
                    : 'border-slate-200 bg-[#F8FAFC]/50 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-sm hover:-translate-y-0.5'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-white/25' : 'bg-[#F1F5F9] text-slate-400 group-hover:bg-[#E2E8F0] group-hover:text-slate-600'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'stroke-[1.5]'}`} />
                </div>
                <span className={`text-xs font-bold tracking-wide ${isSelected ? 'text-white' : 'text-slate-600'}`}>{acc.role}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form action={login} className="space-y-5 pt-2">
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-slate-800" htmlFor="email">
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
            className="w-full bg-[#F8FAFC]/50 border border-slate-200 rounded-[16px] px-5 py-4 text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-[#562a75]/15 focus:border-[#562a75] shadow-sm"
            placeholder="you@university.edu"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-slate-800" htmlFor="password">
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
              className="w-full bg-[#F8FAFC]/50 border border-slate-200 rounded-[16px] px-5 py-4 pr-12 text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-[#562a75]/15 focus:border-[#562a75] shadow-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>

        {message && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mt-6 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-rose-700">
              {message}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
