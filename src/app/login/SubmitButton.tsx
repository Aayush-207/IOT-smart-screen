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
    <div className="w-full flex flex-col gap-3">
      <button 
        type="submit"
        disabled={pending}
        className="sentry-btn-lime w-full py-3 px-6 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#150f23]" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In &rarr;</span>
        )}
      </button>

      {pending && (
        <div className="w-full space-y-1.5 animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#a39cb0]">
            <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-[#c2ef4e] rounded-full animate-pulse" />
               Establishing Session
            </span>
            <span className="tabular-nums text-[#c2ef4e] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-[#1f1633] rounded-full overflow-hidden border border-[#362d59]">
            <div 
              className="h-full bg-[#c2ef4e] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
