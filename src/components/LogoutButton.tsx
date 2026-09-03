'use client'

import React, { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'

export function LogoutButton() {
  const [signingOut, setSigningOut] = useState(false)

  return (
    <form
      action="/auth/signout"
      method="post"
      className="w-full"
      onSubmit={() => setSigningOut(true)}
    >
      <button 
        type="submit"
        disabled={signingOut}
        className="w-full px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#0a0a0a] dark:hover:bg-white/10 border border-neutral-300 dark:border-[#212327] text-neutral-600 hover:text-neutral-900 dark:text-[#7d8187] dark:hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-normal cursor-pointer disabled:opacity-60"
        title="Sign Out of CampusCast"
      >
        {signingOut ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600 dark:text-neutral-400" />
            <span>Signing Out…</span>
          </>
        ) : (
          <>
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </>
        )}
      </button>
    </form>
  )
}
