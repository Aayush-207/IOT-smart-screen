'use client'

import { useFormStatus } from 'react-dom'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function SubmitButton() {
  const { pending } = useFormStatus()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (pending) {
      setProgress(0)
      // Simulate rapid progress up to 99%
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 99) {
            clearInterval(interval)
            return 99
          }
          return prev + Math.floor(Math.random() * 15) + 5
        })
      }, 150)
    } else {
      setProgress(0)
    }
    return () => clearInterval(interval)
  }, [pending])

  return (
    <div className="w-full flex flex-col gap-3 mt-8">
      <button 
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--ink)] text-[var(--canvas)] hover:bg-[var(--ink)]/90 disabled:bg-[var(--ink)]/50 p-3 rounded-[6px] font-medium transition-all shadow-sm flex justify-center items-center gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Authenticating...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {pending && (
        <div className="w-full space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex justify-between items-center text-xs font-medium text-[var(--mute)]">
            <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               Establishing Secure Connection
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--canvas-inset)] rounded-full overflow-hidden border border-[var(--hairline)]">
            <div 
              className="h-full bg-[var(--ink)] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
