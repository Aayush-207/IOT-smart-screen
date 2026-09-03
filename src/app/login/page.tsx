import { LoginFormClient } from './LoginFormClient'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 font-sans selection:bg-white selection:text-black">
      <div className="w-full max-w-md p-8 md:p-10 rounded-xl border border-[#212327] bg-[#141414] shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block group cursor-pointer">
            <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 text-white flex items-center justify-center mx-auto mb-3 font-mono font-bold text-lg group-hover:border-white transition-colors">
              X
            </div>
          </Link>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
              Access Gateway
            </span>
          </div>
          <h1 className="text-xl font-normal tracking-tight text-white">
            CampusCast Network
          </h1>
          <p className="text-xs text-[#7d8187] mt-1 leading-relaxed">
            Select a demo role or enter your institutional credentials.
          </p>
        </div>

        <LoginFormClient message={resolvedSearchParams?.message} />
      </div>

      {/* Feature Capabilities Footer */}
      <div className="mt-8 text-center text-xs font-mono text-[#7d8187]">
        <span>5s Telemetry &bull; Safety Inference Engine &bull; Instant Broadcast</span>
      </div>
    </div>
  )
}
