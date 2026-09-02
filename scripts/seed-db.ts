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

const SAMPLE_SCREENS = [
  { name: 'Library Main Lobby (Node 01)', location: 'Central Library Floor 1', zone: 'Library' },
  { name: 'Engineering Hall Atrium (Node 02)', location: 'Engineering Complex B2', zone: 'Engineering' },
  { name: 'Student Cafeteria Display (Node 03)', location: 'Student Activity Center', zone: 'Cafeteria' },
  { name: 'Main Auditorium Kiosk (Node 04)', location: 'Grand Auditorium Foyer', zone: 'Auditorium' },
]

const DEMO_USERS = [
  { email: 'campus.admin@gmail.com', role: 'admin' },
  { email: 'campus.hod@gmail.com', role: 'hod' },
  { email: 'campus.submitter@gmail.com', role: 'submitter' },
  { email: 'campus.emergency@gmail.com', role: 'emergency' },
]

async function resetAndSeed() {
  console.log('🔄 Starting Database Reset & Seeding...')

  // 1. Ensure Auth Users exist
  const userMap: Record<string, string> = {}
  for (const user of DEMO_USERS) {
    const { data } = await supabase.auth.signUp({
      email: user.email,
      password: 'password123',
    })
    if (data?.user?.id) {
      userMap[user.email] = data.user.id
      console.log(`✓ User ready: ${user.email}`)
    }
  }

  // 2. Sign in as Admin
  await supabase.auth.signInWithPassword({
    email: 'campus.admin@gmail.com',
    password: 'password123',
  })

  // 3. Provision Departments
  const deptMap: Record<string, string> = {}
  for (const dept of SAMPLE_DEPARTMENTS) {
    const { data: existing } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', dept.name)
      .maybeSingle()

    if (!existing) {
      const { data: created, error } = await supabase
        .from('departments')
        .insert(dept)
        .select()
        .single()
      if (created) {
        deptMap[dept.name] = created.id
        console.log(`✓ Department created: ${dept.name}`)
      } else if (error) {
        console.log(`ℹ️  Dept insert note: ${error.message}`)
      }
    } else {
      deptMap[dept.name] = existing.id
      console.log(`✓ Department verified: ${dept.name}`)
    }
  }

  // 4. Update Profile Roles and Department Associations
  const cseDeptId = deptMap['Computer Science & Engineering'] || null
  for (const user of DEMO_USERS) {
    const updatePayload: Record<string, any> = { role: user.role }
    if (user.role === 'hod' || user.role === 'submitter') {
      updatePayload.department_id = cseDeptId
    }
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('email', user.email)

    if (error) {
      console.log(`ℹ️  Profile update for ${user.email}: ${error.message}`)
    } else {
      console.log(`✓ Configured profile ${user.email} -> Role: ${user.role}`)
    }
  }

  // 5. Provision Screens
  for (const screen of SAMPLE_SCREENS) {
    const { data: existing } = await supabase
      .from('screens')
      .select('id')
      .eq('name', screen.name)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('screens').insert(screen)
      if (error) {
        console.log(`ℹ️  Screen ${screen.name}: ${error.message}`)
      } else {
        console.log(`✓ Screen node created: ${screen.name}`)
      }
    } else {
      console.log(`✓ Screen node verified: ${screen.name}`)
    }
  }

  // 6. Insert initial seed announcements if none exist
  const { count } = await supabase.from('announcements').select('id', { count: 'exact', head: true })
  if (!count || count === 0) {
    const submitterId = userMap['campus.submitter@gmail.com'] || null
    const adminId = userMap['campus.admin@gmail.com'] || null

    const initialAnnouncements = [
      {
        title: 'Welcome to CampusCast Smart Display Network',
        body: 'Real-time campus communications, verified dispatch, and autonomous node telemetry live across all digital signage screens.',
        status: 'approved',
        priority: 'routine',
        target_all: true,
        target_zones: [],
        department_id: cseDeptId,
        submitted_by: submitterId,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      },
      {
        title: 'CSE Capstone Project Milestone Submission',
        body: 'All final year students must submit phase 2 documentation by Friday 5:00 PM to the department repository.',
        status: 'pending_approval',
        priority: 'routine',
        target_all: false,
        target_zones: ['Engineering', 'Library'],
        department_id: cseDeptId,
        submitted_by: submitterId,
      },
      {
        title: 'Annual University Convocation & Tech Gala 2026',
        body: 'Grand convocation ceremony schedule and guest registration open for all graduating batches.',
        status: 'pending_approval',
        priority: 'critical',
        target_all: true,
        target_zones: [],
        department_id: null,
        submitted_by: submitterId,
      },
    ]

    const { error: annError } = await supabase.from('announcements').insert(initialAnnouncements)
    if (!annError) {
      console.log('✓ Initial seed announcements generated (1 Live Approved, 1 HOD Queue, 1 Admin Queue)')
    }
  }

  console.log('✨ Database reset and seeding completed successfully!')
}

resetAndSeed().catch((err) => {
  console.error('Reset and seeding failed:', err)
})
