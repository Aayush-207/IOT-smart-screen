'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Sign-in timeout — fail fast instead of hanging 25s when Supabase is unreachable. */
const SIGN_IN_TIMEOUT_MS = 8_000

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  let error: { message: string } | null = null

  try {
    const signInPromise = supabase.auth.signInWithPassword(data)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Cannot reach the authentication server. Check your internet connection and try again.')),
        SIGN_IN_TIMEOUT_MS
      )
    )

    const result = await Promise.race([signInPromise, timeoutPromise])
    error = result.error
  } catch (err) {
    error = { message: err instanceof Error ? err.message : 'Authentication failed. Please try again.' }
  }

  if (error) {
    console.error('Supabase Auth Error:', error.message)

    // Map raw network / Supabase error strings to friendly messages
    const raw = error.message.toLowerCase()
    let friendly = error.message
    if (raw.includes('fetch failed') || raw.includes('network') || raw.includes('timeout') || raw.includes('cannot reach')) {
      friendly = 'Cannot reach the authentication server. Check your internet connection and try again.'
    } else if (raw.includes('invalid login credentials') || raw.includes('invalid email or password')) {
      friendly = 'Incorrect email or password. Please try again.'
    } else if (raw.includes('email not confirmed')) {
      friendly = 'Please verify your email address before signing in.'
    } else if (raw.includes('too many requests')) {
      friendly = 'Too many sign-in attempts. Please wait a moment and try again.'
    }

    return redirect(`/login?message=${encodeURIComponent(friendly)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/') // Middleware will intercept and redirect to correct dashboard
}
