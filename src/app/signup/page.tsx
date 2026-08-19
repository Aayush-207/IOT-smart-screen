"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, UserPlus, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("club_president");
  const [clubId, setClubId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("dept_engineering");

  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clubs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setClubs(data);
          setClubId(data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          clubId: role === "club_president" ? clubId : null,
          departmentId: role === "club_hod" ? departmentId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-geist-sans selection:bg-[#0070f3] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--ink)] text-[var(--canvas)] whisper-shadow mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-semibold tracking-display-xl text-[var(--ink)]">
          Create CampusCast Account
        </h2>
        <p className="mt-2 text-xs font-geist-mono text-[var(--mute)] uppercase tracking-wider">
          Register New User & Assign Role Flow
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="geist-card p-8 whisper-shadow space-y-6">
          {error && (
            <div className="p-3 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-geist-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                FULL NAME *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-3 text-xs text-[var(--ink)] font-sans focus:border-[var(--ink)]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                CAMPUS EMAIL ADDRESS *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@campus.edu"
                className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-3 text-xs text-[var(--ink)] font-sans focus:border-[var(--ink)]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                ASSIGN ROLE *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-3 text-xs text-[var(--ink)] font-sans focus:border-[var(--ink)]"
                required
              >
                <option value="club_president">Club President (Submits Posters)</option>
                <option value="club_hod">Club HOD (Stage 1 Department Reviewer)</option>
                <option value="admin">Chief Administrator (Stage 2 Final Approver)</option>
                <option value="viewer">Public Viewer (Read-only)</option>
              </select>
            </div>

            {role === "club_president" && (
              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  AFFILIATED CLUB *
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-3 text-xs text-[var(--ink)] font-sans focus:border-[var(--ink)]"
                  required
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === "club_hod" && (
              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  DEPARTMENT SCOPE *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-3 text-xs text-[var(--ink)] font-sans focus:border-[var(--ink)]"
                  required
                >
                  <option value="dept_engineering">Engineering Department</option>
                  <option value="dept_humanities">Humanities & Arts Department</option>
                  <option value="dept_science">Science Department</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[var(--ink)] text-[var(--canvas)] font-semibold text-xs whisper-shadow hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Registering..." : "Create Account & Enter Platform"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[var(--hairline)]">
            <p className="text-xs text-[var(--body)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#0070f3] font-semibold hover:underline">
                Sign In instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
