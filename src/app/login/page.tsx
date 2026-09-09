import { LoginFormClient } from './LoginFormClient'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Left Panel: Editorial / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#E1D7D1] p-12 flex-col justify-between border-r-2 border-neutral-900 overflow-hidden">
        {/* Architectural grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <Link href="/">
            <div className="w-16 h-16 bg-neutral-900 text-white flex items-center justify-center font-bold text-3xl mb-12 hover:bg-neutral-800 transition-colors border-2 border-neutral-900 shadow-[4px_4px_0_0_#171717]">
              CC
            </div>
          </Link>
          <h1 className="text-7xl xl:text-8xl font-black tracking-tighter leading-[0.85] uppercase text-neutral-900 max-w-[500px]">
            Campus Cast.
          </h1>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 text-neutral-900 max-w-md">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-neutral-900 pb-2 mb-2">System</div>
            <div className="text-sm font-medium">Digital Display & Fleet Management</div>
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-neutral-900 pb-2 mb-2">Version</div>
            <div className="text-sm font-medium">v2.0.4.8 (Stable)</div>
          </div>
        </div>
      </div>

      {/* Right Panel: The Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-[#FAFAFA] relative">
        {/* Subtle grid on the form side too */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden mb-12">
            <Link href="/">
              <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center font-bold text-xl mb-6 shadow-[4px_4px_0_0_#171717]">
                CC
              </div>
            </Link>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-neutral-900 leading-none">
              Campus<br/>Cast.
            </h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black tracking-tight uppercase mb-2">Authorized Access</h2>
            <p className="text-neutral-500 text-sm font-medium">Please identify yourself to continue to the control panel.</p>
          </div>

          <LoginFormClient message={resolvedSearchParams?.message} />
        </div>
      </div>
    </div>
  )
}
