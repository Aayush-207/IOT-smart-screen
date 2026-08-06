'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Building2, UserCheck, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [selectedUserId, setSelectedUserId] = useState<string>('usr_101');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      userId: 'usr_101',
      name: 'Gaurav',
      email: 'gaurav@college.edu',
      role: 'DESIGN_LEAD',
      clubId: 'technology-club',
      clubName: 'Technology Club',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    },
    {
      userId: 'usr_102',
      name: 'Alex Rivera',
      email: 'alex@college.edu',
      role: 'PRESIDENT',
      clubId: 'robotics-club',
      clubName: 'Robotics Club',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      userId: 'usr_100',
      name: 'Campus Admin',
      email: 'admin@college.edu',
      role: 'SYSTEM_ADMIN',
      clubId: 'campus-wide',
      clubName: 'Campus Operations',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  ];

  const handleLogin = async (userIdToLogin: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdToLogin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(redirectPath);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network connection error during SSO login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/50 py-3 px-6 text-center text-xs text-slate-400">
        🔒 Campus Cast Secure Identity Provider • Caddy Reverse Proxy Protected
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Campus SSO Login</h1>
            <p className="text-xs text-slate-400">
              Single Sign-On Authentication for <code className="text-cyan-400">campuscast.college.edu</code>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Select Campus Identity:
            </label>
            {demoAccounts.map((acc) => (
              <div
                key={acc.userId}
                onClick={() => setSelectedUserId(acc.userId)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  selectedUserId === acc.userId
                    ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20'
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{acc.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${acc.badgeColor}`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{acc.email}</p>
                  <p className="text-[11px] text-cyan-400 font-medium">
                    Scoped Permission: {acc.clubName} ({acc.clubId})
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedUserId === acc.userId ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-700'
                }`}>
                  {selectedUserId === acc.userId && <UserCheck className="w-3 h-3" />}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleLogin(selectedUserId)}
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying Identity...' : 'Authenticate & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Scoped Authorization: President of Technology Club ≠ President of every club
            </p>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
        CampusCast IoT Signage Network • Central Authentication Service
      </footer>
    </div>
  );
}

export default function CampusLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
        Loading Campus SSO Login System...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
