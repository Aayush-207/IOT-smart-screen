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
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D1165] via-[#512a74]/95 to-[#9f2176]/85 pointer-events-none" />
        
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#512a74] rounded-full blur-[100px] pointer-events-none opacity-40" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3b82f6] rounded-full blur-[120px] pointer-events-none opacity-30" />
        
        <div className="relative z-10 flex flex-col items-start gap-0">
          <Link href="/" className="inline-block group cursor-pointer relative z-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Campus Cast Logo" 
              className="w-28 h-28 object-contain group-hover:scale-105 transition-all duration-300"
            />
          </Link>
          <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#00eaff] to-[#3b82f6] bg-clip-text text-transparent -mt-3 relative z-10">
            Campus Cast
          </div>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="text-5xl xl:text-7xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
            Intelligent <br/>
            Broadcasts.
          </h1>
          <p className="text-lg xl:text-xl font-medium text-purple-200/90 max-w-md leading-relaxed">
            Centralized digital fleet management for real-time announcements, emergency alerts, and event scheduling.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 max-w-md mt-12 border-t border-white/10 pt-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-300/80 mb-1">Architecture</div>
            <div className="text-sm font-semibold text-white">Distributed Node Mesh</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-300/80 mb-1">Version Release</div>
            <div className="text-sm font-semibold text-white">v2.0.5 (Enterprise)</div>
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
          <div className="lg:hidden mb-10 flex flex-col items-center text-center gap-0">
            <Link href="/" className="group cursor-pointer relative z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="Campus Cast Logo" 
                className="w-24 h-24 object-contain group-hover:scale-105 transition-all"
              />
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#512a74] to-[#3b82f6] bg-clip-text text-transparent -mt-3 mb-2 relative z-10 pb-1">
              Campus Cast.
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-xs">
              Centralized digital fleet management.
            </p>
          </div>

          <div className="mb-12 lg:text-left text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0F172A] mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-base font-medium">Please sign in to access your dashboard.</p>
          </div>

          <LoginFormClient message={resolvedSearchParams?.message} />

          </div>
        </div>
      </div>
    </div>
  )
}
