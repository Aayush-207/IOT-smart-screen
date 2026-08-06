'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Building2, UserCheck, ArrowRight, Monitor } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [selectedUserId, setSelectedUserId] = useState<string>('usr_101');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          router.push(redirectPath);
        }
      })
      .catch(() => {});
  }, [router, redirectPath]);

  const demoAccounts = [
    {
      userId: 'usr_101',
      name: 'Gaurav (Design Lead)',
      email: 'gaurav@college.edu',
      role: 'DESIGN_LEAD',
      clubId: 'technology-club',
      clubName: 'Technology Club',
    },
    {
      userId: 'usr_102',
      name: 'Alex Rivera (President)',
      email: 'alex@college.edu',
      role: 'PRESIDENT',
      clubId: 'technology-club',
      clubName: 'Technology Club',
    },
    {
      userId: 'usr_103',
      name: 'Dr. Smith (HOD)',
      email: 'hod@college.edu',
      role: 'HOD',
      clubId: 'technology-club',
      clubName: 'Technology Club',
    },
    {
      userId: 'usr_100',
      name: 'Campus Admin',
      email: 'admin@college.edu',
      role: 'SYSTEM_ADMIN',
      clubId: 'campus-wide',
      clubName: 'Campus Operations',
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
    } catch {
      setError('Network error during SSO login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#26251e] flex flex-col justify-between font-sans selection:bg-[#f54e00] selection:text-white">
      {/* Top Bar */}
      <div className="border-b border-[#e6e5e0] bg-[#fafaf7] py-3 px-6 text-center text-xs text-[#5a5852] font-mono">
        🔒 CampusCast Central Authentication Service (SSO)
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#26251e] text-[#f54e00] rounded-md flex items-center justify-center mx-auto mb-2">
              <Monitor className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-normal tracking-tight text-[#26251e]">Campus SSO Authentication</h1>
            <p className="text-xs text-[#5a5852]">
              Select identity to authenticate for <code className="text-[#26251e] font-bold font-mono">campuscast.college.edu</code>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#fafaf7] border border-[#cf2d56] text-[#cf2d56] text-xs rounded-md text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#807d72] uppercase tracking-wider block">
              Select Campus Identity:
            </label>
            {demoAccounts.map((acc) => (
              <div
                key={acc.userId}
                onClick={() => setSelectedUserId(acc.userId)}
                className={`p-4 rounded-md border cursor-pointer transition flex items-center justify-between ${
                  selectedUserId === acc.userId
                    ? 'bg-[#fafaf7] border-[#f54e00] ring-1 ring-[#f54e00]'
                    : 'bg-[#ffffff] border-[#e6e5e0] hover:bg-[#fafaf7]'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#26251e]">{acc.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e6e5e0] text-[#26251e]">
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-[#5a5852]">{acc.email}</p>
                  <p className="text-[11px] text-[#807d72] font-mono">
                    Scope: {acc.clubName} ({acc.clubId})
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedUserId === acc.userId ? 'border-[#f54e00] bg-[#f54e00] text-white' : 'border-[#cfcdc4]'
                }`}>
                  {selectedUserId === acc.userId && <UserCheck className="w-2.5 h-2.5" />}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleLogin(selectedUserId)}
            disabled={isLoading}
            className="w-full py-2.5 px-6 bg-[#f54e00] hover:bg-[#d04200] text-white font-medium text-sm rounded-md transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying Identity...' : 'Authenticate & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <p className="text-[11px] text-[#807d72] flex items-center justify-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1f8a65]" />
              Scoped Authorization: President of Tech Club ≠ President of all clubs
            </p>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-[11px] text-[#807d72] border-t border-[#e6e5e0] font-mono">
        CampusCast IoT Signage Network • Central Authentication Service
      </footer>
    </div>
  );
}

export default function CampusLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f7f4] text-[#5a5852] flex items-center justify-center text-xs font-mono">
        Loading Campus SSO Authentication Service...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
