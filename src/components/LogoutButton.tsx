'use client'

import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button 
        type="submit"
        className="p-2 rounded-[6px] bg-[var(--canvas-inset)] hover:bg-rose-500/10 hover:text-rose-400 border border-[var(--hairline)] text-[var(--mute)] transition-all flex items-center justify-center"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </form>
  )
}
