import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Scheduled expiry job (blueprint Parts 11 & 14). Flips approved announcements
// whose display window has closed to `expired`, writes one audit row each, and
// marks their per-device delivery rows `expired`. The screen poll already
// filters `status = 'approved'`, so expired content drops from every screen on
// its next heartbeat regardless of this job — this makes the state explicit
// and auditable, and is the "server also pushes an explicit remove" backstop
// for clock-skew (Part 29).
//
// Trigger: Vercel Cron (see vercel.json) sends `Authorization: Bearer
// $CRON_SECRET`. Also callable by hand for demos:
//   curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/expire

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Server missing SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const nowIso = new Date().toISOString()

  const { data: due, error } = await supabase
    .from('announcements')
    .select('id, title')
    .eq('status', 'approved')
    .not('display_end', 'is', null)
    .lt('display_end', nowIso)

  if (error) {
    console.error('expire job: query failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ids = (due || []).map((a) => a.id)
  if (ids.length === 0) {
    return NextResponse.json({ expired: 0, ids: [] })
  }

  const { error: updateError } = await supabase
    .from('announcements')
    .update({ status: 'expired', updated_at: nowIso })
    .in('id', ids)
  if (updateError) {
    console.error('expire job: update failed', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  await supabase.from('announcement_deliveries').update({ state: 'expired' }).in('announcement_id', ids)
  await supabase.from('audit_log').insert(
    (due || []).map((a) => ({
      actor_id: null,
      action: 'expired',
      target_type: 'announcement',
      target_id: a.id,
      target_label: a.title,
      metadata: { by: 'scheduler' },
    }))
  )

  return NextResponse.json({ expired: ids.length, ids })
}
