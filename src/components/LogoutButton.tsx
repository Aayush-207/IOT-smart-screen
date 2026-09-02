'use client'

import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <form action="/auth/signout" method="post" className="w-full">
      <button 
        type="submit"
        className="w-full px-3 py-1.5 rounded-full bg-[#0a0a0a] hover:bg-white/10 border border-[#212327] text-[#7d8187] hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-normal cursor-pointer"
        title="Sign Out of CampusCast"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>
    </form>
  )
}
