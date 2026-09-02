import React from 'react'
import { Sparkles } from 'lucide-react'

// Renders the automated advisory checks attached to an announcement
export function AiAdvisoryPanel({ advisory }: { advisory: any }) {
  if (!advisory || typeof advisory !== 'object') return null
  const deterministic: string[] = Array.isArray(advisory.deterministic) ? advisory.deterministic : []
  const ai: string | null = typeof advisory.ai === 'string' ? advisory.ai : null
  if (deterministic.length === 0 && !ai) return null

  return (
    <div className="rounded-lg border border-[#212327] bg-[#141414] p-3.5 text-xs text-[#dadbdf] space-y-2">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-white">
        <Sparkles className="w-3.5 h-3.5 text-white" />
        <span>Automated Policy &amp; Safety Checks</span>
      </div>
      {deterministic.length > 0 && (
        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#7d8187]">
          {deterministic.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {ai && (
        <div className="pt-1.5 border-t border-[#212327] text-xs text-white/90">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#dadbdf]">Model Analysis:</span> {ai}
        </div>
      )}
    </div>
  )
}
