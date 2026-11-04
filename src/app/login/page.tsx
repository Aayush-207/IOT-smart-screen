import { LoginFormClient } from './LoginFormClient'
import { LoginBackgroundCarousel } from './LoginBackgroundCarousel'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-[#3b82f6] selection:text-white bg-[#E2E8F0]">
      {/* Left Panel - Branding & Vision */}
      <div className="relative hidden lg:flex lg:w-[45%] h-full bg-[#3D1165] p-12 xl:p-16 flex-col justify-between overflow-hidden text-white shadow-2xl z-10">
        {/* Carousel Background layer */}
        <LoginBackgroundCarousel />

        {/* Subtle MIT-brand gradient overlay incorporating dark purple and a hint of magenta */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D1165]/70 via-[#512a74]/70 to-[#9f2176]/65 pointer-events-none" />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#512a74] rounded-full blur-[100px] pointer-events-none opacity-40" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3b82f6] rounded-full blur-[120px] pointer-events-none opacity-30" />

        <div className="relative z-10 flex flex-row items-center gap-4">
          <Link href="/" className="inline-block group cursor-pointer relative z-20 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/MIT_circular.png"
              alt="MIT ADT University Logo"
              className="w-24 h-24 xl:w-28 xl:h-28 object-contain group-hover:scale-105 transition-all duration-300"
            />
          </Link>
          <div className="flex flex-col items-center text-center pt-1">
            <div className="text-[2.2rem] xl:text-[2.6rem] font-extrabold tracking-tight text-white font-sans leading-none pb-1">
              MIT-ADT
            </div>
            <div className="flex w-full h-[3px] mb-1">
              <div className="h-full flex-1 bg-[#a855f7]"></div>
              <div className="h-full flex-1 bg-[#f97316]"></div>
              <div className="h-full flex-1 bg-[#10b981]"></div>
            </div>
            <div className="text-[1.4rem] xl:text-[1.7rem] font-medium tracking-widest text-white font-sans leading-none pt-0.5">
              UNIVERSITY
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="text-5xl xl:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-6 font-sans">
            Intelligent <br />
            Broadcasts.
          </h1>
          <p className="text-lg xl:text-xl font-normal text-purple-200/90 max-w-md leading-relaxed font-sans">
            Centralized digital fleet management for real-time announcements, emergency alerts, and event scheduling.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 max-w-md mt-12 border-t border-white/10 pt-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-purple-300/80 mb-1 font-sans">Architecture</div>
            <div className="text-sm font-semibold text-white font-sans">Distributed Node Mesh</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-purple-300/80 mb-1 font-sans">Version Release</div>
            <div className="text-sm font-semibold text-white font-sans">v2.0.5 (Enterprise)</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form Container */}
      <div className="w-full lg:w-[55%] h-full flex items-center justify-center p-4 sm:p-8 lg:p-16 relative">

        {/* iPad Device Frame */}
        <div className="w-full max-w-[500px] bg-gradient-to-br from-[#F4F7FB] via-white to-[#FFF5F0] border-[16px] sm:border-[20px] border-black rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 ring-black/5 overflow-hidden relative">

          {/* Inner Content Padding */}
          <div className="px-6 py-10 sm:px-10 sm:py-14 w-full h-full flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="lg:hidden mb-10 flex flex-col items-center text-center gap-4">
              <div className="flex flex-row items-center justify-center gap-3">
                <Link href="/" className="group cursor-pointer relative z-20 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/MIT_circular.png"
                    alt="MIT ADT University Logo"
                    className="w-20 h-20 object-contain group-hover:scale-105 transition-all"
                  />
                </Link>
                <div className="flex flex-col items-center text-center pt-1">
                  <div className="text-[1.8rem] font-extrabold tracking-tight text-[#512a74] font-sans leading-none pb-1">
                    MIT-ADT
                  </div>
                  <div className="flex w-full h-[3px] mb-1">
                    <div className="h-full flex-1 bg-[#a855f7]"></div>
                    <div className="h-full flex-1 bg-[#f97316]"></div>
                    <div className="h-full flex-1 bg-[#10b981]"></div>
                  </div>
                  <div className="text-[1.15rem] font-medium tracking-widest text-[#512a74] font-sans leading-none pt-0.5">
                    UNIVERSITY
                  </div>
                </div>
              </div>
              <p className="text-sm font-normal text-slate-500 max-w-xs font-sans">
                Centralized digital fleet management.
              </p>
            </div>

            <div className="mb-12 lg:text-left text-center">
              <h2 className="text-4xl font-bold tracking-tight text-[#0F172A] mb-2 font-sans">Welcome Back</h2>
              <p className="text-slate-500 text-base font-normal font-sans">Please sign in to access your dashboard.</p>
            </div>

            <LoginFormClient message={resolvedSearchParams?.message} />

          </div>
        </div>
      </div>
    </div>
  )
}
