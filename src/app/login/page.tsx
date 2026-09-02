import { LoginFormClient } from './LoginFormClient'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#1f1633] text-white p-6 font-sans selection:bg-[#c2ef4e] selection:text-[#150f23]">
      <div className="w-full max-w-md p-8 md:p-10 rounded-2xl border border-[#362d59] bg-[#150f23] shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#c2ef4e] text-[#150f23] flex items-center justify-center mx-auto mb-3 font-black text-xl shadow-[0_0_15px_rgba(194,239,78,0.4)] group-hover:scale-105 transition-transform">
              ⚡
            </div>
          </Link>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="sentry-chip-green">Smart Screen Hub</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to CampusCast
          </h1>
          <p className="text-xs text-[#bdb8c0] mt-1 leading-relaxed">
            Select a demo account below or sign in with your email.
          </p>
        </div>

        <LoginFormClient message={resolvedSearchParams?.message} />
      </div>

      {/* Feature Capabilities Footer */}
      <div className="mt-8 text-center text-xs font-mono text-[#8b8496]">
        <span>5s Screen Refresh &bull; Real-time AI Review &bull; Instant Emergency Broadcast</span>
      </div>
    </div>
  )
}
