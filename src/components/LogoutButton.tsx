'use client'

import React, { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'

export function LogoutButton() {
  const [signingOut, setSigningOut] = useState(false)
  const label = signingOut ? 'Signing out' : 'Sign out'

  return (
    <form action="/auth/signout" method="post" className="shrink-0" onSubmit={() => setSigningOut(true)}>
      <button
        type="submit"
        disabled={signingOut}
        aria-label={label}
        title={label}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors cursor-pointer disabled:opacity-60"
      >
        {signingOut ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />}
      </button>
    </form>
  )
}
