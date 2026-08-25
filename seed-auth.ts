import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seed() {
  const users = ['campus.admin@gmail.com', 'campus.hod@gmail.com', 'campus.club@gmail.com']
  
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
