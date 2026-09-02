import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seed() {
  // The `handle_new_user` trigger (0001_campuscast_init.sql) creates a
  // `profiles` row for each signup with role='submitter'. Afterwards:
  //   1. promote ONE row to role='admin' in the Supabase Table Editor,
  //   2. assign every other account's role + department from the Admin
  //      dashboard's Users tab.
  // Blueprint Part 9 wants an institutional domain (@mituniversity.edu.in)
  // enforced via a Supabase "Before user created" Auth Hook — left off here
  // so these sample accounts work out of the box.
  const users = ['campus.admin@gmail.com', 'campus.hod@gmail.com', 'campus.submitter@gmail.com', 'campus.emergency@gmail.com']
  
  for (const email of users) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'password123',
    })
    if (error) {
      console.error('Error signing up', email, error.message)
    } else {
      console.log('Signed up', email, data.user?.id)
    }
  }
}

seed()
