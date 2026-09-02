import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SAMPLE_DEPARTMENTS = [
  { name: 'Computer Science & Engineering' },
  { name: 'Mechanical Engineering' },
  { name: 'Electrical & Electronics' },
  { name: 'Student Affairs & Campus Life' },
  { name: 'Health & Safety Office' },
]

const DEMO_USERS = [
  { email: 'campus.admin@gmail.com', role: 'admin' },
  { email: 'campus.hod@gmail.com', role: 'hod' },
  { email: 'campus.submitter@gmail.com', role: 'submitter' },
  { email: 'campus.emergency@gmail.com', role: 'emergency' },
]

async function cleanSlateWipe() {
  console.log('🧹 Performing Complete Clean-Slate Reset...')

  // 1. Ensure Auth Users exist so you can log in
  for (const user of DEMO_USERS) {
    await supabase.auth.signUp({
      email: user.email,
      password: 'password123',
    })
  }

  // 2. Sign in as Admin to authorize RLS wipes
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'campus.admin@gmail.com',
    password: 'password123',
  })

  if (authErr) {
    console.error('❌ Admin authentication failed:', authErr.message)
    return
  }

  console.log('✓ Authenticated as Campus Admin:', auth.user.id)

  // 3. Delete ALL announcement deliveries
  const { error: delErr } = await supabase.from('announcement_deliveries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) console.log('ℹ️  Deliveries wipe note:', delErr.message)
  else console.log('✓ Deleted all announcement deliveries (0 remaining)')

  // 4. Delete ALL announcements
  const { error: annErr } = await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (annErr) console.log('ℹ️  Announcements wipe note:', annErr.message)
  else console.log('✓ Deleted all announcements (0 remaining)')

  // 5. Delete ALL screens
  const { error: screenErr } = await supabase.from('screens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (screenErr) console.log('ℹ️  Screens wipe note:', screenErr.message)
  else console.log('✓ Deleted all physical screens (0 remaining - register your own)')

  // 6. Delete ALL audit logs
  const { error: auditErr } = await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (auditErr) console.log('ℹ️  Audit log wipe note:', auditErr.message)
  else console.log('✓ Cleared all audit log history (0 remaining)')

  // 7. Ensure clean campus departments exist
  const deptMap: Record<string, string> = {}
  for (const dept of SAMPLE_DEPARTMENTS) {
    const { data: existing } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', dept.name)
      .maybeSingle()

    if (!existing) {
      const { data: created } = await supabase
        .from('departments')
        .insert(dept)
        .select()
        .single()
      if (created) deptMap[dept.name] = created.id
    } else {
      deptMap[dept.name] = existing.id
    }
  }
  console.log('✓ Verified clean campus departments')

  // 8. Assign roles to demo user profiles so you can log in as Admin, HOD, Submitter, or Emergency
  const cseDeptId = deptMap['Computer Science & Engineering'] || null
  for (const user of DEMO_USERS) {
    const updatePayload: Record<string, any> = { role: user.role }
    if (user.role === 'hod' || user.role === 'submitter') {
      updatePayload.department_id = cseDeptId
    }
    await supabase.from('profiles').update(updatePayload).eq('email', user.email)
  }
  console.log('✓ Configured demo login accounts (Admin, HOD, Submitter, Emergency)')

  console.log('\n✨ COMPLETE CLEAN SLATE: 0 screens, 0 announcements, 0 audit logs.')
  console.log('👉 You can now register screens, submit notices, and test workflows from scratch!')
}

cleanSlateWipe().catch((err) => {
  console.error('Clean slate reset failed:', err)
})
