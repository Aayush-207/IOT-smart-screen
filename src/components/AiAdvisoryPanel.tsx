import React from 'react'
import { Sparkles } from 'lucide-react'

// Renders the automated advisory checks attached to an announcement
export function AiAdvisoryPanel({ advisory }: { advisory: any }) {
  if (!advisory || typeof advisory !== 'object') return null
  const deterministic: string[] = Array.isArray(advisory.deterministic) ? advisory.deterministic : []
  const ai: string | null = typeof advisory.ai === 'string' ? advisory.ai : null
  if (deterministic.length === 0 && !ai) return null

  return (
    <div className="rounded-xl border border-[#6a5fc1]/40 bg-[#422082]/25 p-3.5 text-xs text-[#bdb8c0] space-y-1.5 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-[#c2ef4e]">
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Compliance &amp; Policy Checks</span>
      </div>
      {deterministic.length > 0 && (
        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#bdb8c0]">
          {deterministic.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {ai && (
        <div className="pt-1.5 border-t border-[#6a5fc1]/30 text-xs text-white/90">
          <span className="font-bold text-[#a79df5]">AI Review:</span> {ai}
        </div>
      )}
    </div>
  )
}
