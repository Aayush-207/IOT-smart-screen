'use client'

import { useFormStatus } from 'react-dom'
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

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
          const increment = prev > 80 ? 0.5 : prev > 40 ? 2 : 6
          return Math.min(prev + increment + Math.random() * 2, 99)
        })
      }, 100)
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
        className="group relative w-full bg-[#EA580C] text-white border-2 border-neutral-900 px-6 py-4 font-bold transition-all outline-none flex justify-center items-center gap-3 cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed hover:bg-[#C2410C] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#171717] active:translate-y-0 active:shadow-[0px_0px_0_0_#171717] disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {pending ? (
          <span className="uppercase tracking-widest text-sm">Authenticating...</span>
        ) : (
          <>
            <span className="uppercase tracking-widest text-sm">Enter Dashboard</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {pending && (
        <div className="w-full border-2 border-neutral-900 bg-neutral-100 p-1 flex items-center">
          <div className="h-2 bg-neutral-900 transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}
