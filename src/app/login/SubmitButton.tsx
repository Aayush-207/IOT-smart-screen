'use client'

import { useFormStatus } from 'react-dom'
import { useState, useEffect } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

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
        className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-gradient-to-br from-[#562a75] to-[#8a44b8] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#562a75] transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
      >
        {/* Subtle shine effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 ease-out group-hover:translate-x-full" />

        {pending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Authenticating...</span>
          </>
        ) : (
          <>
            <span className="text-sm">Enter Dashboard</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {pending && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-[#3b82f6] transition-all duration-150 ease-out rounded-full" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  )
}
