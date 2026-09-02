import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function wipe() {
  console.log('🔍 Connecting to Supabase...')
  
  // Sign in as admin
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'campus.admin@gmail.com',
    password: 'password123',
  })

  if (authErr) {
    console.error('Auth error:', authErr.message)
    return
  }

  console.log('✓ Signed in as Admin:', auth.user.id)

  // 1. Fetch all announcements
  const { data: allAnnouncements } = await supabase.from('announcements').select('id, title, status, submitted_by')
  console.log(`Found ${allAnnouncements?.length || 0} announcements in database:`, allAnnouncements)

  // 2. Mark all as withdrawn
  if (allAnnouncements && allAnnouncements.length > 0) {
    const ids = allAnnouncements.map((a) => a.id)
    const { data: updated, error: updateErr } = await supabase
      .from('announcements')
      .update({ status: 'withdrawn' })
      .in('id', ids)
      .select()

    if (updateErr) console.error('Update error:', updateErr.message)
    else console.log(`✓ Marked ${updated?.length || ids.length} announcements as withdrawn!`)
  }

  // 3. Clear all screens
  const { data: allScreens } = await supabase.from('screens').select('id, name')
  console.log(`Found ${allScreens?.length || 0} screens:`, allScreens)
  if (allScreens && allScreens.length > 0) {
    const sIds = allScreens.map((s) => s.id)
    const { error: sDelErr } = await supabase.from('screens').delete().in('id', sIds)
    if (sDelErr) console.error('Screen delete error:', sDelErr.message)
    else console.log('✓ Successfully deleted all screens!')
  }

  // 4. Clear all deliveries
  const { error: delErr } = await supabase.from('announcement_deliveries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (!delErr) console.log('✓ Successfully cleared deliveries!')

  // 5. Clear all audit logs
  const { error: auditErr } = await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (!auditErr) console.log('✓ Successfully cleared audit logs!')

  console.log('✨ Wipe operation finished!')
}

wipe().catch(console.error)
