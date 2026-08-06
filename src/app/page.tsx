import Link from 'next/link';
import {
  Monitor,
  ShieldCheck,
  Building2,
  Tv,
  ArrowRight,
  Radio,
  Zap,
  Activity,
  Layers,
  ExternalLink,
} from 'lucide-react';

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Monitor className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                CampusCast
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  v1.0 IoT
                </span>
              </span>
              <p className="text-xs text-slate-400">Smart Digital Signage Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Campus SSO Login</span>
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <span>Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Portal Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-400 text-xs font-medium shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Real-Time IoT Remote Content Distribution Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Centralized Smart Signage for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Campus & Enterprise</span>
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Remotely publish event announcements, emergency alerts, and club media across physical display screens with zero-latency heartbeat synchronization and offline resilience.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/admin"
              className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-2xl shadow-xl shadow-cyan-500/20 transition flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Open Central Admin Dashboard</span>
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-2xl border border-slate-800 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Simulate Campus SSO Identity</span>
            </Link>
          </div>
        </div>

        {/* Live Kiosk Screen Displays */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                Live Display Kiosks
              </h2>
              <p className="text-xs text-slate-400">
                Active Smart Billboard Nodes receiving 5s heartbeat telemetry & scheduled playlist rotation
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">3 Active Kiosk Nodes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Screen 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">
                  01
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Node
                </span>
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition">
                Screen 1 — Main Entrance
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">Main Entrance Hall Kiosk</p>
              <Link
                href="/display/screen-1"
                target="_blank"
                className="w-full py-2.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-2"
              >
                <span>Launch Kiosk Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Screen 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-xs font-bold">
                  02
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Node
                </span>
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition">
                Screen 2 — Library
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">Central Library Foyer Kiosk</p>
              <Link
                href="/display/screen-2"
                target="_blank"
                className="w-full py-2.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-2"
              >
                <span>Launch Kiosk Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Screen 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs font-bold">
                  03
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Node
                </span>
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition">
                Screen 3 — Cafeteria
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">Student Cafeteria Kiosk</p>
              <Link
                href="/display/screen-3"
                target="_blank"
                className="w-full py-2.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-2"
              >
                <span>Launch Kiosk Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature & Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1">
              <Radio className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-white">5s Heartbeat Polling</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic offline detection marks screens offline after 15 seconds of inactivity.
            </p>
          </div>

          <div className="p-5 bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-white">Atomic Transactions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Playlist reordering and remote assignments execute inside Prisma transactions for data integrity.
            </p>
          </div>

          <div className="p-5 bg-slate-900/30 border border-slate-800/60 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-white">Scoped SSO Authorization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Role-based access permissions scoped to individual campus clubs and administration.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 bg-slate-950">
        CampusCast IoT Digital Billboard Platform • Next.js App Router Architecture
      </footer>
    </div>
  );
}
