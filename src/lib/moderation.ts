// Advisory content moderation (blueprint Part 22).
//
// AI IS NOT CORE. This module produces *advisory metadata* shown to the
// approver — it never changes `announcement.status` and never blocks the
// workflow. `deterministicAdvisories` always runs (no dependencies, no key).
// `runAiAdvisory` runs only when ANTHROPIC_API_KEY is set and degrades to
// `null` on any error or timeout.

export interface AiAdvisory {
  deterministic: string[]
  ai: string | null
  at: string
}

interface AnnouncementText {
  title: string
  body: string
  displayStart?: string | null
  displayEnd?: string | null
}

// Cheap, explainable checks. Pure and unit-tested.
export function deterministicAdvisories(a: AnnouncementText): string[] {
  const out: string[] = []
  const title = (a.title ?? '').trim()
  const body = (a.body ?? '').trim()

  if (!a.displayStart || !a.displayEnd) {
    out.push('No display window set — the announcement will not appear on any screen until start and end times are provided.')
  } else if (new Date(a.displayEnd).getTime() < Date.now()) {
    out.push('Display end is in the past — this announcement would be expired on arrival.')
  } else if (new Date(a.displayEnd).getTime() < new Date(a.displayStart).getTime()) {
    out.push('Display end is before display start.')
  }

  if (body.length < 10 && !title) {
    out.push('Almost no text content — nothing meaningful to render.')
  }

  const letters = (title + ' ' + body).replace(/[^a-z]/gi, '')
  if (letters.length >= 12) {
    const upper = letters.replace(/[^A-Z]/g, '').length
    if (upper / letters.length > 0.7) {
      out.push('Mostly uppercase — reads as shouting; consider sentence case.')
    }
  }

  if (!/\d/.test(title + ' ' + body) && /\b(workshop|seminar|event|deadline|meeting|fest|exam|test)\b/i.test(title + ' ' + body)) {
    out.push('Mentions an event but contains no date or time — approvers cannot verify the schedule.')
  }

  return out
}

// Optional third-party classifier. Returns a short advisory string, or null
// if disabled / failed. Never throws.
export async function runAiAdvisory(text: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create(
      {
        model: 'claude-3-5-haiku-latest',
        max_tokens: 400,
        system:
          'You are an advisory reviewer for a campus digital-signage system. ' +
          'Given an announcement\'s title and body, list any potential issues a human approver should double-check: ' +
          'missing or ambiguous date/time, offensive or inappropriate language, internal contradictions, or obvious factual problems. ' +
          'Reply with a short bullet list, or exactly "NONE" if you see no issues. Do not approve or reject — you only advise.',
        messages: [{ role: 'user', content: text.slice(0, 4000) }],
      },
      { timeout: 8000 }
    )
    const raw = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')
      .trim()
    if (!raw || /^none\.?$/i.test(raw)) return null
    return raw
  } catch (err) {
    console.error('AI advisory failed (non-blocking):', err)
    return null
  }
}
