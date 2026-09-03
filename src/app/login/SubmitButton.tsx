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
        className="w-full py-2.5 px-6 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0a0a0a]" />
            <span>Authenticating...</span>
          </>
        ) : (
          <span>Sign In &rarr;</span>
        )}
      </button>

      {pending && (
        <div className="w-full space-y-1.5 animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#7d8187]">
            <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
               Connecting
            </span>
            <span className="tabular-nums text-white">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-[#141414] rounded-full overflow-hidden border border-[#212327]">
            <div 
              className="h-full bg-white transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
