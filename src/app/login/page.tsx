import { login } from './actions'
import { SubmitButton } from './SubmitButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] p-4 font-geist-sans">
      <div className="w-full max-w-md geist-card p-8 floating-shadow">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--ink)] text-[var(--canvas)] flex items-center justify-center mx-auto mb-4 font-bold whisper-shadow">
            <svg viewBox="0 0 76 65" className="w-6 h-6 fill-current">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-heading-lg text-[var(--ink)]">
            Welcome to CampusCast
          </h1>
          <p className="text-sm text-[var(--mute)] mt-2">
            Sign in to access your digital dashboard.
          </p>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] text-[var(--ink)] text-sm transition-all"
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] text-[var(--ink)] text-sm transition-all"
              placeholder="••••••••"
            />
          </div>

          <SubmitButton />
          
          {resolvedSearchParams?.message && (
            <p className="mt-4 p-3 bg-rose-500/10 text-rose-500 text-sm rounded-lg text-center font-medium border border-rose-500/20">
              {resolvedSearchParams.message}
            </p>
          )}
        </form>
        
        <div className="mt-8 pt-6 border-t border-[var(--hairline)]">
           <p className="text-xs text-[var(--faint)] text-center font-geist-mono">
              SECURE CMS LOGIN // V1.0
           </p>
        </div>
      </div>
    </div>
  )
}
