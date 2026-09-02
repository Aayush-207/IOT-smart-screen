import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Zap,
  Radio,
  CheckCircle2,
  Sparkles,
  Cpu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch light telemetry stats to power live counters on landing page
  const [{ count: screenCount }, { count: announcementCount }] = await Promise.all([
    supabase.from('screens').select('id', { count: 'exact', head: true }),
    supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const totalScreens = screenCount || 12
  const totalApproved = announcementCount || 28

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-sans selection:bg-[var(--cohere-action-blue)] selection:text-white">
      {/* 1. Black Top Announcement Bar */}
      <div className="bg-[var(--cohere-black)] text-white text-xs py-2 px-4 flex items-center justify-between border-b border-white/10 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between text-[11px] font-mono tracking-wide">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">MESH NETWORK ONLINE</span>
            <span className="text-white/40 hidden sm:inline">&bull;</span>
            <span className="text-white/80 hidden sm:inline">5-Second Edge Heartbeat &bull; Zero-Latency Fallback</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[10px] uppercase hidden md:inline">Node Sync: 100% SLA</span>
            <Link
              href="/login"
              className="text-white underline underline-offset-2 hover:text-white/80 font-medium cursor-pointer"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Global Header Nav */}
      <header className="sticky top-0 z-40 bg-[var(--canvas)]/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-[var(--cohere-near-black)] text-white flex items-center justify-center font-bold shadow-xs group-hover:opacity-90 transition-opacity">
              <svg viewBox="0 0 76 65" className="w-4 h-4 fill-current">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="font-bold tracking-tight text-sm text-[var(--ink)] block">CampusCast</span>
              <span className="text-[10px] font-mono text-[var(--mute)] uppercase tracking-wider block">Enterprise AI Signage</span>
            </div>
          </Link>

          {/* Center Architecture Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--slate)]">
            <a href="#features" className="hover:text-[var(--ink)] transition-colors">Mesh Architecture</a>
            <a href="#governance" className="hover:text-[var(--ink)] transition-colors">AI Policy Engine</a>
            <a href="#telemetry" className="hover:text-[var(--ink)] transition-colors">Edge Telemetry</a>
            <a href="#matrix" className="hover:text-[var(--ink)] transition-colors">Role Matrix</a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard/admin"
                className="cohere-btn-primary text-xs"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="cohere-btn-secondary text-xs hidden sm:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="cohere-btn-primary text-xs"
                >
                  Launch Console
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Monumental Typography & 2-Card Composition) */}
      <section className="pt-16 pb-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="cohere-chip-green">Autonomous Display Infrastructure</span>
            <span className="cohere-mono-label text-[var(--mute)]">Production Mesh v2.4</span>
          </div>

          <h1 className="cohere-display-hero text-[var(--ink)] tracking-tight">
            Institutional Digital Signage with AI Moderation &amp; Zero-Latency Fallback.
          </h1>

          <p className="text-base sm:text-lg text-[var(--body)] font-normal max-w-2xl mx-auto leading-relaxed">
            CampusCast orchestrates physical display hardware, departmental approval tiers, real-time AI compliance verification, and instant campus-wide emergency broadcast overrides.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="cohere-btn-primary px-6 py-3 text-sm font-medium shadow-md"
            >
              Access Signage Console &rarr;
            </Link>
            <a
              href="#governance"
              className="cohere-btn-pill-outline px-5 py-2.5 text-xs font-semibold"
            >
              Explore Moderation Engine
            </a>
          </div>
        </div>

        {/* Two-Card Media Composition (Wide Agent Console + Telemetry Card) */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Wide Left Card: Dark Agent Console Mockup */}
          <div className="lg:col-span-8 agent-console-card p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-white/50 ml-2">node://cc-ai-moderator-dispatch</span>
              </div>
              <span className="cohere-mono-label text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px]">
                POLICY VERIFIED &bull; 99.4% CONFIDENCE
              </span>
            </div>

            <div className="space-y-4 my-auto">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60 font-mono text-[11px]">SUBMISSION PAYLOAD</span>
                  <span className="text-amber-400 font-mono text-[11px]">PRIORITY: URGENT</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  &ldquo;Annual Robotics Symposium: Keynote in Main Auditorium at 14:00&rdquo;
                </div>
                <p className="text-xs text-white/70 font-mono">
                  Target: Engineering Lobby &bull; Main Quad &bull; Library Wall
                </p>
              </div>

              {/* AI Advisory Reasoning */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Automated AI Policy Verification</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
                  Recommendation: <strong className="text-emerald-300">APPROVE</strong> &bull; Category: Event Notice &bull; No brand violations or inappropriate content detected. Clean high-contrast typography recommended for 10-second slide rotation.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-white/60">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Slot Rotation: Active</span>
              </div>
              <div className="text-emerald-400">
                Avg. Review Latency: 1.2s
              </div>
            </div>
          </div>

          {/* Narrow Right Card: Live Fleet Telemetry Pod */}
          <div className="lg:col-span-4 cohere-card-stone p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="cohere-mono-label text-[var(--mute)]">Mesh Health</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <div className="text-4xl font-normal text-[var(--ink)] tracking-tight">
                {totalScreens} Nodes
              </div>
              <p className="text-xs text-[var(--slate)] mt-1 font-mono">
                Active Raspberry Pi &amp; Kiosk Displays
              </p>
            </div>

            <div className="space-y-3 my-6 py-4 border-y border-[var(--hairline)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--body)] font-medium">Heartbeat Interval</span>
                <span className="font-mono text-[var(--ink)] font-semibold">5,000 ms</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--body)] font-medium">Emergency Preemption</span>
                <span className="font-mono text-rose-600 font-bold">&lt; 100 ms</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--body)] font-medium">Active Airtime Notices</span>
                <span className="font-mono text-[var(--ink)] font-semibold">{totalApproved} Approved</span>
              </div>
            </div>

            <Link
              href="/login"
              className="cohere-btn-pill-outline w-full justify-center text-center text-xs font-semibold py-2.5"
            >
              Open Live Fleet Wall &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Monochrome Trust & Zone Strip */}
      <section className="py-12 border-y border-[var(--hairline)] bg-[var(--canvas-stone)]/30">
        <div className="max-w-6xl mx-auto px-6">
          <p className="cohere-mono-label text-[var(--mute)] text-center text-[10px] mb-6">
            CONNECTED HARDWARE COVERAGE ACROSS CAMPUS ZONES
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center text-xs font-mono font-semibold text-[var(--slate)] uppercase tracking-wider">
            <div className="p-3 border border-[var(--hairline)] rounded-xl bg-[var(--canvas)] shadow-2xs">
              🏛️ Main Quad
            </div>
            <div className="p-3 border border-[var(--hairline)] rounded-xl bg-[var(--canvas)] shadow-2xs">
              🔬 Engineering Wing
            </div>
            <div className="p-3 border border-[var(--hairline)] rounded-xl bg-[var(--canvas)] shadow-2xs">
              📚 Library Atrium
            </div>
            <div className="p-3 border border-[var(--hairline)] rounded-xl bg-[var(--canvas)] shadow-2xs">
              🎭 Central Auditorium
            </div>
            <div className="p-3 border border-[var(--hairline)] rounded-xl bg-[var(--canvas)] shadow-2xs">
              ☕ Student Cafeteria
            </div>
          </div>
        </div>
      </section>

      {/* 5. Deep Enterprise Green Capability Band */}
      <section id="features" className="cohere-band-green py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-4">
            <span className="cohere-mono-label text-emerald-300">MISSION-CRITICAL ARCHITECTURE</span>
            <h2 className="cohere-display-product text-white">
              Engineered for absolute reliability, governance, and rapid deployment.
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              When campus safety or institutional notices demand communication, CampusCast delivers guaranteed screen delivery without cloud latency or single points of failure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Automated Policy &amp; Advisory</h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Claude 3.5 AI scans all submissions for institutional tone, contrast, and policy compliance before escalation to Department HODs.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">5-Second Mesh Polling</h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                IoT screen nodes report telemetry and health every 5 seconds. Stale nodes trigger immediate operator alarms and fallback rotation.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Instant Emergency Override</h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Campus security and administrative teams can broadcast high-visibility amber or red alerts that immediately preempt all active schedules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Product Cards (Soft Stone 3-Column) */}
      <section id="matrix" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="cohere-mono-label text-[var(--mute)]">ROLE-BASED GOVERNANCE</span>
          <h2 className="cohere-heading-section text-[var(--ink)]">
            Tailored consoles for every campus stakeholder.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--slate)]">
            Streamlined workflows with strict cryptographic access control and audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submitter */}
          <div className="cohere-card-stone p-8 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="cohere-chip-blue">Submitter</span>
                <span className="text-[10px] font-mono text-[var(--mute)]">Clubs &amp; Faculty</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Dispatch Studio</h3>
              <p className="text-xs text-[var(--slate)] leading-relaxed">
                Rich announcement editor with live billboard aspect ratio previews and real-time AI compliance feedback.
              </p>
              <ul className="space-y-2 pt-4 border-t border-[var(--hairline)] text-xs text-[var(--body)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Interactive 16:9 &amp; 9:16 preview</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant AI policy scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Track review status live</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[var(--hairline)]">
              <Link href="/login" className="cohere-btn-pill-outline w-full justify-center text-xs font-semibold py-2">
                Submitter Login &rarr;
              </Link>
            </div>
          </div>

          {/* HOD Approver */}
          <div className="cohere-card-stone p-8 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="cohere-chip-coral">HOD Approver</span>
                <span className="text-[10px] font-mono text-[var(--mute)]">Department Heads</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Approval Queue</h3>
              <p className="text-xs text-[var(--slate)] leading-relaxed">
                Dedicated review deck with AI advisories, one-click approvals, and structured rejection reason dispatch.
              </p>
              <ul className="space-y-2 pt-4 border-t border-[var(--hairline)] text-xs text-[var(--body)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Department queue segregation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>AI Advisory summary badges</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Audit logging on decisions</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[var(--hairline)]">
              <Link href="/login" className="cohere-btn-pill-outline w-full justify-center text-xs font-semibold py-2">
                HOD Login &rarr;
              </Link>
            </div>
          </div>

          {/* Central Admin */}
          <div className="cohere-card-stone p-8 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="cohere-chip-green">Central Admin</span>
                <span className="text-[10px] font-mono text-[var(--mute)]">Operations &amp; Fleet</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Command Center</h3>
              <p className="text-xs text-[var(--slate)] leading-relaxed">
                Full hardware fleet management, live interactive video wall, telemetry analytics, and emergency overrides.
              </p>
              <ul className="space-y-2 pt-4 border-t border-[var(--hairline)] text-xs text-[var(--body)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hardware ping &amp; remote reboot</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Live visual video wall matrix</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant broadcast withdrawals</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[var(--hairline)]">
              <Link href="/login" className="cohere-btn-primary w-full justify-center text-xs font-semibold py-2">
                Admin Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[var(--cohere-near-black)] text-white mt-auto border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/60">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs">
              ▲
            </div>
            <span className="font-semibold text-white">CampusCast Enterprise Mesh</span>
            <span className="text-white/30">&bull;</span>
            <span className="font-mono text-[11px]">AI-IoT Powered Campus Signage</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <Link href="/login" className="hover:text-white transition-colors">Sign In Portal</Link>
            <Link href="/kiosk.html?id=SCR-QUAD-01" target="_blank" className="hover:text-white transition-colors">Launch Kiosk Node</Link>
            <a href="https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
