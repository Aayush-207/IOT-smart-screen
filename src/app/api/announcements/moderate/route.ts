import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { deterministicAdvisories, runAiAdvisory, type AiAdvisory } from '@/lib/moderation'

// Advisory-only moderation pass (blueprint Part 22). Called fire-and-forget by
// the submitter form right after "Submit for Approval". Computes deterministic
// advisories (always) plus an optional AI advisory (only if ANTHROPIC_API_KEY
// is set), stores them on `announcements.ai_advisory` for the approver to see,
// and records that it ran. Never changes `status`; always returns 200.
//
// The persist step needs SUPABASE_SERVICE_ROLE_KEY: by the time this runs the
// announcement is already `pending_approval`, which the owner's RLS policy no
// longer lets them update. Without the key the advisory is still returned in
// the response, just not stored.

export async function POST(request: Request) {
  try {
    const { id } = await request.json().catch(() => ({ id: null }))
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const { data: a } = await supabase
      .from('announcements')
      .select('id, title, body, display_start, display_end, submitted_by')
      .eq('id', id)
      .single()

    if (!a) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (a.submitted_by !== user.id && !['admin', 'emergency'].includes(profile?.role || '')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const deterministic = deterministicAdvisories({
      title: a.title,
      body: a.body,
      displayStart: a.display_start,
      displayEnd: a.display_end,
    })
    const ai = await runAiAdvisory(`Title: ${a.title}\n\nBody: ${a.body}`)
    const advisory: AiAdvisory = { deterministic, ai, at: new Date().toISOString() }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && serviceKey) {
      const admin = createServiceClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      await admin.from('announcements').update({ ai_advisory: advisory }).eq('id', id)
      await admin.from('audit_log').insert({
        actor_id: user.id,
        action: 'moderation_ran',
        target_type: 'announcement',
        target_id: id,
        target_label: a.title,
        metadata: { flags: deterministic.length + (ai ? 1 : 0) },
      })
    } else {
      console.warn('moderate: SUPABASE_SERVICE_ROLE_KEY not set — advisory computed but not persisted')
    }

    return NextResponse.json({ ok: true, advisory, persisted: !!(url && serviceKey) })
  } catch (err) {
    console.error('moderate route failed (non-blocking):', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
