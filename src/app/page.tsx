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
  Code2,
  Terminal,
  Cpu,
} from 'lucide-react';

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#26251e] font-sans selection:bg-[#f54e00] selection:text-white flex flex-col justify-between">
      {/* Top Nav (64px, #f7f7f4 canvas background, 1px #e6e5e0 hairline) */}
      <header className="border-b border-[#e6e5e0] bg-[#f7f7f4]/90 backdrop-blur-md sticky top-0 z-50 h-16 flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#26251e] flex items-center justify-center text-[#f7f7f4] font-bold">
              <Monitor className="w-4 h-4 text-[#f54e00]" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#26251e] flex items-center gap-2">
              CampusCast
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#e6e5e0] text-[#5a5852]">
                v1.0 IoT
              </span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5a5852]">
            <Link href="#architecture" className="hover:text-[#26251e] transition">Architecture</Link>
            <Link href="#kiosks" className="hover:text-[#26251e] transition">Kiosk Nodes</Link>
            <Link href="#timeline" className="hover:text-[#26251e] transition">AI Agent Pipeline</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 bg-[#ffffff] hover:bg-[#fafaf7] text-[#26251e] text-sm font-medium rounded-md border border-[#cfcdc4] transition"
            >
              Sign In
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-[#f54e00] hover:bg-[#d04200] text-white text-sm font-medium rounded-md transition shadow-sm"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (80px section rhythm) */}
      <main className="max-w-[1200px] mx-auto px-6 py-20 flex-1 w-full space-y-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6e5e0] text-[#26251e] text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#f54e00]"></span>
            Autonomous Signage Network
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-normal tracking-tight text-[#26251e] leading-[1.1] text-balance">
            The AI-driven billboard network built for campus intelligence.
          </h1>

          <p className="text-lg text-[#5a5852] max-w-2xl mx-auto leading-relaxed">
            Publish event announcements, emergency alerts, and club media across physical display kiosks with zero-latency heartbeat synchronization and transactional multi-stage approvals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/admin"
              className="px-6 py-3 bg-[#f54e00] hover:bg-[#d04200] text-white font-medium text-sm rounded-md transition flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Launch Admin Dashboard</span>
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-[#26251e] hover:bg-[#1a1914] text-[#f7f7f4] font-medium text-sm rounded-md transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#f54e00]" />
              <span>Simulate Campus SSO</span>
            </Link>
          </div>
        </div>

        {/* IDE Mockup Card with In-Product AI Action Signature Timeline */}
        <div className="bg-[#ffffff] rounded-xl border border-[#e6e5e0] overflow-hidden shadow-sm">
          {/* Editor Header Bar */}
          <div className="bg-[#fafaf7] border-b border-[#e6e5e0] px-4 py-3 flex items-center justify-between text-xs text-[#5a5852]">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-3 h-3 rounded-full bg-[#cfcdc4]"></span>
              <span className="w-3 h-3 rounded-full bg-[#cfcdc4]"></span>
              <span className="w-3 h-3 rounded-full bg-[#cfcdc4]"></span>
              <span className="ml-2 text-[#26251e] font-semibold">campuscast-agent.ts — Active Execution</span>
            </div>
            <span className="font-mono text-[11px] text-[#807d72]">5s Telemetry Engine</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#e6e5e0]">
            {/* Main IDE Code Pane */}
            <div className="lg:col-span-2 bg-[#fafaf7] p-6 font-mono text-xs text-[#26251e] space-y-4 overflow-x-auto">
              <div className="text-[#807d72]">// Step 13: Jitter Synchronization Protocol & Manifest Generator</div>
              <div>
                <span className="text-[#f54e00]">async function</span> <span className="font-bold">syncKioskNode</span>(deviceId: <span className="text-[#1f8a65]">string</span>) {'{'}
              </div>
              <div className="pl-4 text-[#5a5852]">
                const screen = <span className="text-[#f54e00]">await</span> db.screen.findUnique({'{'} where: {'{'} slug: deviceId {'}'} {'}'});
              </div>
              <div className="pl-4 text-[#5a5852]">
                if (!screen) <span className="text-[#cf2d56]">throw new Error</span>('Node offline');
              </div>
              <div className="pl-4 border-l-2 border-[#f54e00] pl-3 py-1 bg-[#ffffff]">
                <span className="text-[#807d72]">// Fetch active approved media for 21-day window</span>
                <br />
                const playlist = <span className="text-[#f54e00]">await</span> generateApprovedManifest(screen.id);
              </div>
              <div className="pl-4">
                return {'{'} status: <span className="text-[#1f8a65]">'ACTIVE'</span>, version: screen.playlistVersion, playlist {'}'};
              </div>
              <div>{'}'}</div>
            </div>

            {/* AI Agent Timeline Signature Visualization (5 Pastel Action Pills) */}
            <div className="bg-[#ffffff] p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#807d72] border-b border-[#e6e5e0] pb-2">
                Agent Action Timeline
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {/* 1. Thinking */}
                <div className="flex items-center gap-2">
                  <span className="timeline-pill-thinking">Thinking</span>
                  <span className="text-[#5a5852] text-[11px]">Evaluating event date window</span>
                </div>

                {/* 2. Grepping */}
                <div className="flex items-center gap-2">
                  <span className="timeline-pill-grep">Grepping</span>
                  <span className="text-[#5a5852] text-[11px]">Verifying SHA-256 media checksum</span>
                </div>

                {/* 3. Reading */}
                <div className="flex items-center gap-2">
                  <span className="timeline-pill-read">Reading</span>
                  <span className="text-[#5a5852] text-[11px]">Loading President & HOD approvals</span>
                </div>

                {/* 4. Editing */}
                <div className="flex items-center gap-2">
                  <span className="timeline-pill-edit">Editing</span>
                  <span className="text-[#5a5852] text-[11px]">Generating screen manifest v43</span>
                </div>

                {/* 5. Done */}
                <div className="flex items-center gap-2">
                  <span className="timeline-pill-done">Done</span>
                  <span className="text-[#26251e] text-[11px] font-semibold">Broadcasting to Kiosks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Kiosk Displays Section */}
        <div id="kiosks" className="space-y-6 pt-8">
          <div className="flex items-center justify-between border-b border-[#e6e5e0] pb-4">
            <div>
              <h2 className="text-2xl font-normal tracking-tight text-[#26251e]">
                Active Kiosk Display Nodes
              </h2>
              <p className="text-sm text-[#5a5852] mt-1">
                Physical screens receiving scheduled media manifests with 50-70s sync intervals
              </p>
            </div>
            <span className="text-xs font-mono text-[#807d72]">3 Active Nodes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Screen 1 */}
            <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-6 hover:border-[#cfcdc4] transition space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#f54e00] bg-[#fafaf7] border border-[#e6e5e0] px-2 py-1 rounded">
                  NODE-01
                </span>
                <span className="text-[11px] font-mono text-[#1f8a65] bg-[#fafaf7] border border-[#e6e5e0] px-2 py-0.5 rounded-full">
                  ● Active
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#26251e]">Screen 1 — Main Entrance</h3>
                <p className="text-xs text-[#5a5852] mt-1">Main Entrance Hall Kiosk</p>
              </div>
              <Link
                href="/display/screen-1"
                target="_blank"
                className="w-full py-2 bg-[#fafaf7] hover:bg-[#26251e] hover:text-[#f7f7f4] text-[#26251e] text-xs font-medium rounded-md border border-[#e6e5e0] transition flex items-center justify-center gap-2"
              >
                <span>Open Kiosk Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Screen 2 */}
            <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-6 hover:border-[#cfcdc4] transition space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#f54e00] bg-[#fafaf7] border border-[#e6e5e0] px-2 py-1 rounded">
                  NODE-02
                </span>
                <span className="text-[11px] font-mono text-[#1f8a65] bg-[#fafaf7] border border-[#e6e5e0] px-2 py-0.5 rounded-full">
                  ● Active
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#26251e]">Screen 2 — Library</h3>
                <p className="text-xs text-[#5a5852] mt-1">Central Library Foyer Kiosk</p>
              </div>
              <Link
                href="/display/screen-2"
                target="_blank"
                className="w-full py-2 bg-[#fafaf7] hover:bg-[#26251e] hover:text-[#f7f7f4] text-[#26251e] text-xs font-medium rounded-md border border-[#e6e5e0] transition flex items-center justify-center gap-2"
              >
                <span>Open Kiosk Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Screen 3 */}
            <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-6 hover:border-[#cfcdc4] transition space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#f54e00] bg-[#fafaf7] border border-[#e6e5e0] px-2 py-1 rounded">
                  NODE-03
                </span>
                <span className="text-[11px] font-mono text-[#1f8a65] bg-[#fafaf7] border border-[#e6e5e0] px-2 py-0.5 rounded-full">
                  ● Active
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#26251e]">Screen 3 — Cafeteria</h3>
                <p className="text-xs text-[#5a5852] mt-1">Student Cafeteria Kiosk</p>
              </div>
              <Link
                href="/display/screen-3"
                target="_blank"
                className="w-full py-2 bg-[#fafaf7] hover:bg-[#26251e] hover:text-[#f7f7f4] text-[#26251e] text-xs font-medium rounded-md border border-[#e6e5e0] transition flex items-center justify-center gap-2"
              >
                <span>Open Kiosk Display</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* System Architecture Features */}
        <div id="architecture" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 bg-[#ffffff] border border-[#e6e5e0] rounded-xl space-y-2">
            <h4 className="font-semibold text-sm text-[#26251e]">Transactional Approvals</h4>
            <p className="text-xs text-[#5a5852] leading-relaxed">
              Every stage (President → HOD → Admin) executes inside atomic database transactions with immutable audit trails.
            </p>
          </div>

          <div className="p-6 bg-[#ffffff] border border-[#e6e5e0] rounded-xl space-y-2">
            <h4 className="font-semibold text-sm text-[#26251e]">Automatic 21-Day Scheduling</h4>
            <p className="text-xs text-[#5a5852] leading-relaxed">
              Active display windows calculated automatically from event dates with SHA-256 media checksum verification.
            </p>
          </div>

          <div className="p-6 bg-[#ffffff] border border-[#e6e5e0] rounded-xl space-y-2">
            <h4 className="font-semibold text-sm text-[#26251e]">Hashed Device Secrets</h4>
            <p className="text-xs text-[#5a5852] leading-relaxed">
              Physical kiosks authenticate using salted device secrets. Only SHA-256 hashes are persisted.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e6e5e0] py-12 bg-[#f7f7f4] text-xs text-[#5a5852]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#26251e]">CampusCast Network Engine</p>
            <p className="text-[#807d72] mt-0.5">Designed with editorial clarity and developer-first aesthetics.</p>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/admin" className="hover:text-[#26251e] transition">Admin Portal</Link>
            <Link href="/login" className="hover:text-[#26251e] transition">SSO Login</Link>
            <Link href="/display/screen-1" className="hover:text-[#26251e] transition">Kiosk Screen 1</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
