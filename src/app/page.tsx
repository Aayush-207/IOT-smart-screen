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
    <div className="min-h-screen bg-[#1f1633] text-white flex flex-col font-sans selection:bg-[#c2ef4e] selection:text-[#150f23]">
      {/* 1. Sentry Midnight Announcement Bar */}
      <div className="bg-[#150f23] text-white text-xs py-2.5 px-4 border-b border-[#362d59] z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c2ef4e] animate-pulse shadow-[0_0_8px_rgba(194,239,78,0.8)]" />
            <span className="font-bold text-[#c2ef4e]">CAMPUS SCREEN NETWORK LIVE</span>
            <span className="text-[#8b8496] hidden sm:inline">&bull;</span>
            <span className="text-[#bdb8c0] hidden sm:inline">5-Second Heartbeat &bull; Automatic Fallback</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#8b8496] text-[10px] uppercase hidden md:inline">Status: All Nodes Healthy</span>
            <Link
              href="/login"
              className="text-[#c2ef4e] hover:underline font-bold cursor-pointer"
            >
              Sign In Portal &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Global Header */}
      <header className="sticky top-0 z-40 bg-[#1f1633]/90 backdrop-blur-md border-b border-[#362d59]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#c2ef4e] text-[#150f23] flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(194,239,78,0.4)]">
              ⚡
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-white block">CampusCast</span>
              <span className="text-[10px] font-mono text-[#a39cb0] uppercase tracking-wider block">Smart Digital Screen Hub</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#bdb8c0]">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-white transition-colors">User Roles</a>
            <a href="#screens" className="hover:text-white transition-colors">Live Screens</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard/admin"
                className="sentry-btn-lime text-xs"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="sentry-btn-secondary text-xs hidden sm:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="sentry-btn-lime text-xs"
                >
                  Launch App
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="pt-20 pb-20 px-6 max-w-6xl mx-auto w-full relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="sentry-chip-green">Smart Campus Signage</span>
            <span className="sentry-mono-label text-[#a39cb0]">Production Ready</span>
          </div>

          <h1 className="sentry-display-hero text-white tracking-tight leading-tight">
            Campus Screens Made Simple with{' '}
            <span className="sentry-chip-lime">AI Review</span> and{' '}
            <span className="sentry-chip-lime">Instant Alerts</span>.
          </h1>

          <p className="text-base sm:text-lg text-[#bdb8c0] font-normal max-w-2xl mx-auto leading-relaxed">
            Submit announcements in seconds, get instant AI policy suggestions, send notices for Department Head approval, and broadcast live across all campus TVs and kiosks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="sentry-btn-lime px-6 py-3 text-sm font-bold shadow-lg"
            >
              Open Signage Console &rarr;
            </Link>
            <a
              href="#roles"
              className="sentry-btn-secondary px-5 py-3 text-xs font-semibold"
            >
              Explore Roles &amp; Permissions
            </a>
          </div>
        </div>

        {/* 2-Card Sentry Feature Pod */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Card: AI Moderation Preview */}
          <div className="lg:col-span-8 sentry-card p-6 sm:p-8 flex flex-col justify-between shadow-2xl border border-[#362d59]">
            <div className="flex items-center justify-between border-b border-[#362d59] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fa7faa]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#c2ef4e]" />
                <span className="text-xs font-mono text-[#a39cb0] ml-2">ai-policy-assistant</span>
              </div>
              <span className="sentry-chip-green">
                PASSED &bull; 99% CONFIDENCE
              </span>
            </div>

            <div className="space-y-4 my-auto">
              <div className="p-4 rounded-xl bg-[#1f1633] border border-[#362d59] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a39cb0] font-mono text-[11px]">STUDENT SUBMISSION</span>
                  <span className="sentry-chip-pink text-[10px]">URGENT NOTICE</span>
                </div>
                <div className="text-sm font-bold text-white">
                  &ldquo;Annual Robotics Symposium: Keynote in Main Auditorium at 2:00 PM&rdquo;
                </div>
                <p className="text-xs text-[#8b8496] font-mono">
                  Display Target: Engineering Lobby &bull; Main Quad &bull; Library
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#422082]/40 border border-[#6a5fc1]/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c2ef4e]">
                  <Sparkles className="w-4 h-4 text-[#c2ef4e]" />
                  <span>AI Policy Check Summary</span>
                </div>
                <p className="text-xs text-[#bdb8c0] leading-relaxed">
                  Recommendation: <strong className="text-white">Ready for Approval</strong> &bull; Clear event notice &bull; High-contrast readable typography for TV billboard rotation.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-[#362d59] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#8b8496]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#c2ef4e]" />
                <span>Deterministic 10s Slide Rotation Active</span>
              </div>
              <div className="text-[#c2ef4e] font-semibold">
                Instant HOD Escalation
              </div>
            </div>
          </div>

          {/* Right Card: Screen Fleet Status */}
          <div className="lg:col-span-4 sentry-card p-6 sm:p-8 flex flex-col justify-between border border-[#362d59]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="sentry-mono-label text-[#a39cb0]">Connected Hardware</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#c2ef4e] shadow-[0_0_8px_rgba(194,239,78,0.8)]" />
              </div>
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {totalScreens} Displays
              </div>
              <p className="text-xs text-[#bdb8c0] mt-1 font-mono">
                Smart TVs, Raspberry Pi, &amp; Kiosks
              </p>
            </div>

            <div className="space-y-3 my-6 py-4 border-y border-[#362d59]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#bdb8c0]">Heartbeat Check</span>
                <span className="font-mono text-[#c2ef4e] font-bold">Every 5 seconds</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#bdb8c0]">Emergency Alert Latency</span>
                <span className="font-mono text-[#fa7faa] font-bold">&lt; 1 second</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#bdb8c0]">Active Announcements</span>
                <span className="font-mono text-white font-bold">{totalApproved} Approved</span>
              </div>
            </div>

            <Link
              href="/login"
              className="sentry-btn-primary w-full justify-center text-center text-xs font-bold py-2.5"
            >
              Sign In to Control &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Campus Zones Banner */}
      <section className="py-10 border-y border-[#362d59] bg-[#150f23]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="sentry-mono-label text-[#8b8496] text-center text-[10px] mb-5">
            CONNECTED SCREEN LOCATIONS ACROSS CAMPUS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-xs font-mono font-bold text-[#bdb8c0] uppercase">
            <div className="p-3 border border-[#362d59] rounded-xl bg-[#1f1633]">
              🏛️ Main Quad
            </div>
            <div className="p-3 border border-[#362d59] rounded-xl bg-[#1f1633]">
              🔬 Engineering Wing
            </div>
            <div className="p-3 border border-[#362d59] rounded-xl bg-[#1f1633]">
              📚 Library Lobby
            </div>
            <div className="p-3 border border-[#362d59] rounded-xl bg-[#1f1633]">
              🎭 Main Auditorium
            </div>
            <div className="p-3 border border-[#362d59] rounded-xl bg-[#1f1633]">
              ☕ Cafeteria &amp; Student Hub
            </div>
          </div>
        </div>
      </section>

      {/* 5. Simplified Roles Section */}
      <section id="roles" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="sentry-mono-label text-[#a39cb0]">WHO USES CAMPUSCAST?</span>
          <h2 className="sentry-display-section text-white">
            Built for Students, Faculty, and Administrators.
          </h2>
          <p className="text-sm text-[#bdb8c0]">
            Simple roles ensure fast approvals without chaos or unauthorized screen posts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submitter Card */}
          <div className="sentry-card p-7 flex flex-col justify-between border border-[#362d59] hover:border-[#6a5fc1] transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="sentry-chip-violet">Submitter</span>
                <span className="text-[10px] font-mono text-[#8b8496]">Clubs &amp; Students</span>
              </div>
              <h3 className="text-lg font-bold text-white">1. Create &amp; Submit</h3>
              <p className="text-xs text-[#bdb8c0] leading-relaxed">
                Draft announcements with images or flyers, preview how they look on vertical and horizontal screens, and submit for instant department review.
              </p>
              <ul className="space-y-2 pt-3 border-t border-[#362d59] text-xs text-[#bdb8c0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>Real-time screen preview</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>AI compliance feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>Track approval progress</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#362d59]">
              <Link href="/login" className="sentry-btn-secondary w-full justify-center text-xs font-bold py-2.5">
                Submitter Login &rarr;
              </Link>
            </div>
          </div>

          {/* HOD Card */}
          <div className="sentry-card p-7 flex flex-col justify-between border border-[#362d59] hover:border-[#fa7faa] transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="sentry-chip-pink">Department Head</span>
                <span className="text-[10px] font-mono text-[#8b8496]">HOD Approver</span>
              </div>
              <h3 className="text-lg font-bold text-white">2. Review &amp; Approve</h3>
              <p className="text-xs text-[#bdb8c0] leading-relaxed">
                Approve or reject submissions from your department with one click. Clear feedback is sent to submitters if changes are needed.
              </p>
              <ul className="space-y-2 pt-3 border-t border-[#362d59] text-xs text-[#bdb8c0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>One-click approve or reject</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>AI Advisory risk scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>Automatic screen scheduling</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#362d59]">
              <Link href="/login" className="sentry-btn-secondary w-full justify-center text-xs font-bold py-2.5">
                HOD Login &rarr;
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="sentry-card p-7 flex flex-col justify-between border border-[#362d59] hover:border-[#c2ef4e] transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="sentry-chip-green">Central Admin</span>
                <span className="text-[10px] font-mono text-[#8b8496]">Hardware &amp; Safety</span>
              </div>
              <h3 className="text-lg font-bold text-white">3. Manage &amp; Override</h3>
              <p className="text-xs text-[#bdb8c0] leading-relaxed">
                Manage hardware screens, monitor the live visual video wall, broadcast emergency safety alerts, and inspect full activity audit logs.
              </p>
              <ul className="space-y-2 pt-3 border-t border-[#362d59] text-xs text-[#bdb8c0]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>Live visual screen wall</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>Instant emergency broadcast</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c2ef4e] shrink-0" />
                  <span>Remote screen reboot &amp; sync</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#362d59]">
              <Link href="/login" className="sentry-btn-lime w-full justify-center text-xs font-bold py-2.5">
                Admin Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-[#150f23] text-white mt-auto border-t border-[#362d59] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#8b8496]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#c2ef4e] text-[#150f23] flex items-center justify-center font-black text-xs">
              ⚡
            </div>
            <span className="font-bold text-white">CampusCast</span>
            <span className="text-[#362d59]">&bull;</span>
            <span className="font-mono text-[11px]">Smart Digital Screen Hub</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/kiosk.html?id=SCR-QUAD-01" target="_blank" className="hover:text-white transition-colors">Open Live Kiosk Demo</Link>
            <a href="https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
