import { LoginFormClient } from './LoginFormClient'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[var(--canvas)] p-6 font-sans">
      <div className="w-full max-w-md p-8 md:p-10 rounded-2xl border border-[var(--border-light)] bg-[var(--canvas)] space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--cohere-near-black)] text-white flex items-center justify-center mx-auto mb-4 font-bold shadow-xs">
            <svg viewBox="0 0 76 65" className="w-5 h-5 fill-current">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="cohere-chip-green">Enterprise Mesh</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Signage Command Access
          </h1>
          <p className="text-xs text-[var(--slate)] mt-1 leading-relaxed">
            Institutional display orchestration, verified dispatch, and autonomous node telemetry.
          </p>
        </div>

        <LoginFormClient message={resolvedSearchParams?.message} />
      </div>

      {/* Feature Capabilities Footer Pills */}
      <div className="mt-8 flex flex-wrap justify-center items-center gap-2 max-w-md text-center">
        <span className="cohere-mono-label text-[var(--mute)]">
          5s Fleet Sync &bull; Automated Policy Engine &bull; Emergency Override
        </span>
      </div>
    </div>
  )
}
