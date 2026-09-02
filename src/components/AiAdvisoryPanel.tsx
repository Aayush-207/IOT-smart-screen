import React from 'react'
import { Info } from 'lucide-react'

// Renders the advisory metadata attached to an announcement during the
// submit -> review transition (blueprint Part 22). Advisory only — it never
// gates the approver's decision.
export function AiAdvisoryPanel({ advisory }: { advisory: any }) {
  if (!advisory || typeof advisory !== 'object') return null
  const deterministic: string[] = Array.isArray(advisory.deterministic) ? advisory.deterministic : []
  const ai: string | null = typeof advisory.ai === 'string' ? advisory.ai : null
  if (deterministic.length === 0 && !ai) return null

  return (
    <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 p-3 text-xs text-[var(--body)]">
      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
        <Info className="w-3.5 h-3.5" /> Advisory checks (not a decision)
      </div>
      {deterministic.length > 0 && (
        <ul className="list-disc pl-4 space-y-0.5">
          {deterministic.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {ai && (
        <div className="mt-1.5 pt-1.5 border-t border-amber-400/30 whitespace-pre-wrap">
          <span className="font-medium">AI reviewer:</span> {ai}
        </div>
      )}
    </div>
  )
}
