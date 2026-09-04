import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Public unauthenticated Supabase client.
 * Used for public broadcast surfaces (e.g. digital billboard screens,
 * live screen monitoring feeds) where RLS allows public/anon access
 * to all approved announcements across the campus network.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
