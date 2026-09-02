'use client'

import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <form action="/auth/signout" method="post" className="w-full">
      <button 
        type="submit"
        className="w-full px-3 py-2 rounded-lg bg-[#150f23] hover:bg-[#fa5252]/15 hover:text-[#fa5252] hover:border-[#fa5252]/40 border border-[#362d59] text-[#8b8496] transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
        title="Sign Out of CampusCast"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>
    </form>
  )
}
