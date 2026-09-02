import React from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Sparkles,
  Cpu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: screenCount }, { count: announcementCount }] = await Promise.all([
    supabase.from('screens').select('id', { count: 'exact', head: true }),
    supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const totalScreens = screenCount || 12
  const totalApproved = announcementCount || 28

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* 1. Top Notice Bar */}
      <div className="bg-[#0a0a0a] text-white text-xs py-2 px-4 border-b border-[#212327] z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wider uppercase text-white">DISPLAY NETWORK ONLINE</span>
            <span className="text-[#7d8187] hidden sm:inline">&bull;</span>
            <span className="text-[#7d8187] hidden sm:inline">5s Telemetry Cycle &bull; Edge Fallback</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#7d8187] text-[10px] uppercase hidden md:inline">Nodes: 100% Operational</span>
            <Link
              href="/login"
              className="text-white hover:underline cursor-pointer"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Global Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#212327]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white flex items-center justify-center font-mono font-bold text-sm group-hover:border-white transition-colors">
              X
            </div>
            <div>
              <span className="font-normal tracking-tight text-sm text-white block">CampusCast</span>
              <span className="text-[10px] font-mono text-[#7d8187] uppercase tracking-[0.14em] block">Display Mesh</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs text-[#dadbdf]">
            <a href="#how-it-works" className="hover:text-white transition-colors">Architecture</a>
            <a href="#roles" className="hover:text-white transition-colors">Permissions</a>
            <a href="#screens" className="hover:text-white transition-colors">Hardware Nodes</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard/admin"
                className="px-4 py-1.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors"
              >
                Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-full bg-transparent border border-white/20 text-white text-xs hover:bg-white/5 transition-colors hidden sm:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors"
                >
                  Launch App
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="pt-24 pb-20 px-6 max-w-6xl mx-auto w-full relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full font-mono text-[11px] uppercase tracking-wider border border-white/20 bg-white/5 text-white">
              Screen Network 2.0
            </span>
          </div>

          <h1 className="xai-display-hero text-white leading-tight">
            Campus Signage Mesh with Automated Safety &amp; Instant Broadcast.
          </h1>

          <p className="text-base sm:text-lg text-[#dadbdf] font-normal max-w-2xl mx-auto leading-relaxed">
            Submit announcements in seconds, receive automated policy verification, route to Department Heads for authorization, and broadcast across campus display nodes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors"
            >
              Open Console &rarr;
            </Link>
            <a
              href="#roles"
              className="px-5 py-2.5 rounded-full border border-white/20 text-white text-xs hover:bg-white/5 transition-colors"
            >
              Explore Permissions
            </a>
          </div>
        </div>

        {/* 2-Card Feature Pod */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Card: AI Moderation Preview */}
          <div className="lg:col-span-8 bg-[#141414] rounded-lg p-6 sm:p-8 flex flex-col justify-between border border-[#212327]">
            <div className="flex items-center justify-between border-b border-[#212327] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#7d8187] ml-1">inference-engine &bull; active</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
                VERIFIED &bull; 99% CONFIDENCE
              </span>
            </div>

            <div className="space-y-4 my-auto">
              <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#212327] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7d8187] font-mono text-[11px] uppercase tracking-wider">STUDENT DISPATCH</span>
                  <span className="px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-mono uppercase text-white">PRIORITY NOTICE</span>
                </div>
                <div className="text-sm font-normal text-white">
                  &ldquo;Annual Robotics Symposium: Keynote in Main Auditorium at 2:00 PM&rdquo;
                </div>
                <p className="text-xs text-[#7d8187] font-mono">
                  Target: Engineering Wing &bull; Main Quad &bull; Library Lobby
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#191919] border border-[#212327] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Automated Safety Check</span>
                </div>
                <p className="text-xs text-[#dadbdf] leading-relaxed">
                  Status: <strong className="text-white">Authorized for Approval</strong> &bull; Clear typography verified for 16:9 and 9:16 display aspect ratios.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-[#212327] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#7d8187]">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-white" />
                <span>Deterministic 10s Cycle Rotation</span>
              </div>
              <div className="text-white font-mono uppercase tracking-wider text-[11px]">
                Instant HOD Escalation
              </div>
            </div>
          </div>

          {/* Right Card: Screen Fleet Status */}
          <div className="lg:col-span-4 bg-[#141414] rounded-lg p-6 sm:p-8 flex flex-col justify-between border border-[#212327]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#7d8187]">Hardware Nodes</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-4xl font-normal text-white tracking-tight">
                {totalScreens} Displays
              </div>
              <p className="text-xs text-[#7d8187] mt-1 font-mono">
                Commercial TVs &amp; Edge Kiosks
              </p>
            </div>

            <div className="space-y-3 my-6 py-4 border-y border-[#212327]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#7d8187]">Heartbeat Interval</span>
                <span className="text-white">5 seconds</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#7d8187]">Override Latency</span>
                <span className="text-white">&lt; 1 second</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#7d8187]">Active Notices</span>
                <span className="text-white">{totalApproved} Approved</span>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full justify-center text-center text-xs font-medium py-2 rounded-full bg-white text-[#0a0a0a] hover:bg-neutral-200 transition-colors"
            >
              Sign In to Console &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Campus Zones Banner */}
      <section className="py-10 border-y border-[#212327] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#7d8187] text-center font-mono text-[10px] uppercase tracking-[0.14em] mb-5">
            CONNECTED DISPLAY NODES ACROSS CAMPUS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-mono text-[#dadbdf] uppercase">
            <div className="p-3 border border-[#212327] rounded-lg bg-[#141414]">
              Main Quad
            </div>
            <div className="p-3 border border-[#212327] rounded-lg bg-[#141414]">
              Engineering Wing
            </div>
            <div className="p-3 border border-[#212327] rounded-lg bg-[#141414]">
              Library Lobby
            </div>
            <div className="p-3 border border-[#212327] rounded-lg bg-[#141414]">
              Auditorium
            </div>
            <div className="p-3 border border-[#212327] rounded-lg bg-[#141414]">
              Student Hub
            </div>
          </div>
        </div>
      </section>

      {/* 5. Roles Section */}
      <section id="roles" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#7d8187]">ACCESS TIERS</span>
          <h2 className="xai-display-section text-white">
            Engineered for High-Trust Campus Communications.
          </h2>
          <p className="text-sm text-[#7d8187]">
            Distinct permission tiers ensure rapid authorization without unauthorized visual clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submitter Card */}
          <div className="bg-[#141414] rounded-lg p-7 flex flex-col justify-between border border-[#212327] hover:border-white/40 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">Submitter</span>
                <span className="text-[10px] font-mono text-[#7d8187]">Clubs &amp; Students</span>
              </div>
              <h3 className="text-base font-normal text-white">1. Create &amp; Dispatch</h3>
              <p className="text-xs text-[#dadbdf] leading-relaxed">
                Draft announcements with attached posters, simulate vertical and horizontal TV rendering, and submit for instant department review.
              </p>
              <ul className="space-y-2 pt-3 border-t border-[#212327] text-xs text-[#7d8187] font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Real-time display simulator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Automated safety checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Hardware delivery timeline</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#212327]">
              <Link href="/login" className="w-full justify-center text-center text-xs py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors block">
                Submitter Login &rarr;
              </Link>
            </div>
          </div>

          {/* HOD Card */}
          <div className="bg-[#141414] rounded-lg p-7 flex flex-col justify-between border border-[#212327] hover:border-white/40 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">Department Head</span>
                <span className="text-[10px] font-mono text-[#7d8187]">Approver</span>
              </div>
              <h3 className="text-base font-normal text-white">2. Review &amp; Authorize</h3>
              <p className="text-xs text-[#dadbdf] leading-relaxed">
                Approve or reject submissions with a single click. Structured feedback is dispatched directly to submitters when changes are required.
              </p>
              <ul className="space-y-2 pt-3 border-t border-[#212327] text-xs text-[#7d8187] font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>1-click approve &amp; publish</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Model-assisted policy scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Automatic rotation scheduling</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#212327]">
              <Link href="/login" className="w-full justify-center text-center text-xs py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors block">
                HOD Login &rarr;
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="bg-[#141414] rounded-lg p-7 flex flex-col justify-between border border-[#212327] hover:border-white/40 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">Central Admin</span>
                <span className="text-[10px] font-mono text-[#7d8187]">Full Fleet</span>
              </div>
              <h3 className="text-base font-normal text-white">3. Orchestrate &amp; Override</h3>
              <p className="text-xs text-[#dadbdf] leading-relaxed">
                Monitor physical screen nodes, inspect the multi-screen live wall, broadcast urgent emergency alerts, and view append-only audit logs.
              </p>
              <ul className="space-y-2 pt-3 border-t border-[#212327] text-xs text-[#7d8187] font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Live visual display wall</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Instant emergency override</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Remote sync &amp; reboot commands</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#212327]">
              <Link href="/login" className="w-full justify-center text-center text-xs py-2 rounded-full bg-white text-[#0a0a0a] font-medium hover:bg-neutral-200 transition-colors block">
                Admin Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-[#0a0a0a] text-white mt-auto border-t border-[#212327] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#7d8187]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-white/20 bg-white/5 text-white flex items-center justify-center font-mono font-bold text-xs">
              X
            </div>
            <span className="font-normal text-white">CampusCast</span>
            <span className="text-[#212327]">&bull;</span>
            <span className="font-mono text-[11px]">Display Mesh</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/kiosk.html?id=SCR-QUAD-01" target="_blank" className="hover:text-white transition-colors">Live Display Demo</Link>
            <a href="https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
