"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, UserCheck, Key, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (targetEmail: string) => {
    setEmail(targetEmail);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    {
      title: "Club President",
      email: "alex@campus.edu",
      role: "club_president",
      desc: "Create events, upload posters, self-certify & track status",
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
    },
    {
      title: "Department HOD",
      email: "sarah.hod@campus.edu",
      role: "club_hod",
      desc: "Stage 1 Department approval queue & technical verification",
      color: "border-purple-500/30 text-purple-400 bg-purple-950/20",
    },
    {
      title: "Chief Administrator",
      email: "admin@campus.edu",
      role: "admin",
      desc: "Stage 2 Final approvals, IoT screen fleet & automation jobs",
      color: "border-[#0070f3]/30 text-[#3291ff] bg-blue-950/20",
    },
    {
      title: "Public Viewer",
      email: "viewer@campus.edu",
      role: "viewer",
      desc: "Read-only access to live broadcast schedules & display status",
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-geist-sans selection:bg-[#0070f3] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--ink)] text-[var(--canvas)] whisper-shadow mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-semibold tracking-display-xl text-[var(--ink)]">
          Sign In to CampusCast
        </h2>
        <p className="mt-2 text-xs font-geist-mono text-[var(--mute)] uppercase tracking-wider">
          Digital Billboard Approval & IoT Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="geist-card p-8 whisper-shadow space-y-6">
          {error && (
            <div className="p-3 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-geist-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                CAMPUS EMAIL ADDRESS *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-3 text-xs text-[var(--ink)] font-sans focus:border-[var(--ink)] pl-9"
                  required
                />
                <Key className="w-4 h-4 text-[var(--mute)] absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[var(--ink)] text-[var(--canvas)] font-semibold text-xs whisper-shadow hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Sign In with Email"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher Section */}
          <div className="pt-4 border-t border-[var(--hairline)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[var(--mute)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" /> Instant Role-Based Demo Login
              </span>
              <span className="font-geist-mono text-[10px] text-[var(--mute)]">1-Click Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickRoles.map((r) => (
                <button
                  key={r.email}
                  onClick={() => handleQuickRoleLogin(r.email)}
                  className={`p-3.5 rounded-[6px] border text-left transition-all hover:scale-[1.01] ${r.color} flex flex-col justify-between space-y-1.5`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold font-geist-sans tracking-heading-md">
                      {r.title}
                    </span>
                    <UserCheck className="w-3.5 h-3.5 opacity-75" />
                  </div>
                  <p className="text-[11px] opacity-80 font-geist-sans leading-snug">
                    {r.desc}
                  </p>
                  <span className="font-geist-mono text-[10px] opacity-60">
                    {r.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2 border-t border-[var(--hairline)]">
            <p className="text-xs text-[var(--body)]">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="text-[#0070f3] font-semibold hover:underline">
                Create a new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
