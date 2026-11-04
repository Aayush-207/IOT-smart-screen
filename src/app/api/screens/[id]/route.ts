import { createPublicClient } from '@/lib/supabase/public'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { comparePriority } from '@/lib/priority'
import { isScreenTargeted } from '@/lib/fleet'

// Public device endpoint — polled from Raspberry Pi agents and from browser
// kiosk pages on arbitrary origins, so it is CORS-open and never cached.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
  })
}

// Public, unauthenticated endpoint polled by physical screens (and by
// `scripts/sim-device.mjs` / `scripts/kiosk.html` in a demo). Each request is
// treated as a heartbeat: it stamps last_seen_at, resolves whichever
// announcement should currently be on that screen (an active emergency
// broadcast wins over everything else, then priority, then recency), advances
// the per-device delivery state machine, and hands back any pending
// force-refresh / reboot request (consumed once).
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid screen ID format' }, { status: 400, headers: CORS })
    }

    // Always the anon role: devices have no session, and a logged-in browser's
    // cookies must not change what a screen is served or whether it can heartbeat.
    const supabase = createPublicClient()
    const now = new Date()
    const nowIso = now.toISOString()

    const { data: screen, error: screenError } = await supabase
      .from('screens')
      .select('id, name, location, zone, current_announcement_id, force_refresh_requested, reboot_requested')
      .eq('id', id)
      .single()

    if (screenError || !screen) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404, headers: CORS })
    }

    const pendingForceRefresh = !!screen.force_refresh_requested
    const pendingReboot = !!screen.reboot_requested

    type Candidate = {
      id: string
      title: string
      body: string
      attachment_url: string | null
      is_emergency: boolean
      severity: string | null
      priority?: string
      created_at?: string
      target_all?: boolean
      target_zones?: string[] | null
      display_start?: string | null
    }

    const inWindow = (row: { display_start?: string | null; display_end?: string | null }) => {
      if (row.display_start && new Date(row.display_start).getTime() > now.getTime()) return false
      if (row.display_end && new Date(row.display_end).getTime() < now.getTime()) return false
      return true
    }

    // 1. Emergency broadcasts override everything, campus-wide.
    const { data: emergencies } = await supabase
      .from('announcements')
      .select('id, title, body, attachment_url, is_emergency, severity, display_start, display_end, created_at')
      .eq('is_emergency', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10)

    let chosen: Candidate | null =
      (emergencies || []).find((e) => inWindow(e)) ?? null
    let eligible: Candidate[] = []

    // 2. Otherwise the highest-priority approved announcement targeting this
    //    screen. Matching is done in JS so zone names with spaces /
    //    punctuation can't break a PostgREST filter string.
    if (!chosen) {
      const { data: candidates } = await supabase
        .from('announcements')
        .select('id, title, body, attachment_url, is_emergency, severity, priority, created_at, target_all, target_zones, display_start, display_end')
        .eq('status', 'approved')
        .eq('is_emergency', false)

      eligible = (candidates || []).filter((c) => {
        return inWindow(c) && isScreenTargeted(c, screen)
      })

      eligible.sort((a, b) => {
        const byPriority = comparePriority(a.priority, b.priority)
        if (byPriority !== 0) return byPriority
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })

      chosen = eligible[0] ?? null
    }

    await supabase
      .from('screens')
      .update({
        last_seen_at: nowIso,
        current_announcement_id: chosen?.id ?? null,
        force_refresh_requested: false,
        reboot_requested: false,
      })
      .eq('id', id)

    if (chosen) {
      // dispatched -> acknowledged (first poll that returns it) -> displaying
      // (a later poll where it was already the screen's current content).
      const state = screen.current_announcement_id === chosen.id ? 'displaying' : 'acknowledged'
      // Upsert needs to read the existing row, which RLS denies to anon, so
      // delivery tracking uses the service role when it is configured.
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const deliveries = serviceKey
        ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : supabase
      const { error: deliveryError } = await deliveries
        .from('announcement_deliveries')
        .upsert(
          {
            announcement_id: chosen.id,
            screen_id: id,
            state,
            last_confirmed_at: nowIso,
          },
          { onConflict: 'announcement_id,screen_id' }
        )
      if (deliveryError) console.error('delivery upsert failed:', deliveryError.message)
    }

    const mapItem = (item: Candidate) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      attachment_url: item.attachment_url,
      is_emergency: item.is_emergency,
      severity: item.severity,
      priority: item.priority,
    })

    return NextResponse.json({
      announcement: chosen ? mapItem(chosen) : null,
      playlist: chosen?.is_emergency
        ? [mapItem(chosen)]
        : eligible.slice(0, 10).map(mapItem),
      force_refresh: pendingForceRefresh,
      reboot_requested: pendingReboot,
    }, { headers: CORS })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS })
  }
}
