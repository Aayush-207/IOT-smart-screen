import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const { id } = await request.json().catch(() => ({ id: null }))
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing announcement id' }, { status: 400 })
    }

    // 1. Verify caller authentication
    const userClient = await createClient()
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await userClient
      .from('profiles')
      .select('role, department_id')
      .eq('id', user.id)
      .single()

    // 2. Fetch the announcement to check permissions
    const { data: announcement, error: fetchErr } = await userClient
      .from('announcements')
      .select('id, title, department_id, submitted_by, status')
      .eq('id', id)
      .single()

    if (fetchErr || !announcement) {
      return NextResponse.json({ ok: false, error: 'Announcement not found' }, { status: 404 })
    }

    // Check authorization: Admins, or HODs of the department, or the author
    const isAdmin = ['admin', 'emergency'].includes(profile?.role || '')
    const isHodOfDept = profile?.role === 'hod' && profile?.department_id === announcement.department_id
    const isAuthor = announcement.submitted_by === user.id

    if (!isAdmin && !isHodOfDept && !isAuthor) {
      return NextResponse.json({ ok: false, error: 'You do not have permission to delete this announcement.' }, { status: 403 })
    }

    // 3. Establish elevated client to bypass RLS restrictions
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const clientToUse = serviceKey
      ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : userClient

    // Attempt direct delete (announcement_deliveries rows cascade)
    let deleteSucceeded = false
    const { error: delError, count } = await clientToUse
      .from('announcements')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (!delError && count && count > 0) {
      deleteSucceeded = true
    }

    // If direct delete was blocked or didn't delete, mark as withdrawn (standard CampusCast withdrawal)
    if (!deleteSucceeded) {
      const { data: withdrawn, error: updateErr } = await clientToUse
        .from('announcements')
        .update({
          status: 'withdrawn',
          display_end: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id')

      if (updateErr) {
        throw updateErr
      }
      // RLS blocks report success with zero rows; don't tell the user it worked.
      if (!withdrawn?.length) {
        return NextResponse.json({ ok: false, error: 'You do not have permission to delete this announcement.' }, { status: 403 })
      }
    }

    // Audit log the deletion
    await logAudit(userClient, {
      actorId: user.id,
      action: 'deleted_announcement',
      targetType: 'announcement',
      targetId: id,
      targetLabel: announcement.title,
      metadata: { deletedDirectly: deleteSucceeded, role: profile?.role },
    })

    return NextResponse.json({ ok: true, deleted: true, mode: deleteSucceeded ? 'deleted' : 'withdrawn' })
  } catch (err: any) {
    console.error('Delete announcement API error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
