"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Shield,
  Monitor,
  AlertTriangle,
  Clock,
  Play,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { EventCreationUploadModal } from "@/components/EventCreationUploadModal";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      setCurrentUser(meData.user);

      const [eventsRes, clubsRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/clubs"),
      ]);
      const eventsData = await eventsRes.json();
      const clubsData = await clubsRes.json();

      if (Array.isArray(eventsData)) setEvents(eventsData);
      if (Array.isArray(clubsData)) setClubs(clubsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const role = currentUser?.role || "viewer";

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-geist-sans selection:bg-[#0070f3] selection:text-white">
      <Navbar currentUser={currentUser} onUserSwitched={fetchDashboardData} />

      {/* Hero Band with Multi-stop Mesh Gradient */}
      <section className="relative overflow-hidden border-b border-[var(--hairline)] mesh-gradient-bg py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas-elevated)]/80 whisper-shadow">
                <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
                <span className="font-geist-mono text-[11px] font-medium uppercase tracking-wider text-[var(--mute)]">
                  ACTIVE ROLE // {role.toUpperCase().replace("_", " ")}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-display-xl text-[var(--ink)] leading-tight">
                {role === "club_president" && `Welcome, ${currentUser?.name || "President"} — Poster Creation & Submission Hub`}
                {role === "club_hod" && `Welcome, ${currentUser?.name || "HOD"} — Stage 1 Department Review Portal`}
                {role === "admin" && `Welcome, ${currentUser?.name || "Admin"} — Executive Command Center`}
                {role === "viewer" && `Welcome to CampusCast — Public IoT Screen Broadcasts`}
              </h1>

              <p className="text-sm text-[var(--body)] font-normal leading-relaxed">
                {role === "club_president" && "Submit event posters, brand self-certify compliance, track HOD & Admin review stages, and manage poster revisions."}
                {role === "club_hod" && "Inspect submitted club posters in your department, verify technical specifications, and route to Stage 2 Admin approval."}
                {role === "admin" && "Complete final Stage 2 poster approvals, monitor IoT display heartbeats, manage BullMQ background tasks, and trigger emergency overrides."}
                {role === "viewer" && "View live IoT billboard displays, active poster schedules, and campus event timelines."}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {role === "club_president" && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 whisper-shadow transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Event & Upload Poster
                  </button>
                )}

                <Link
                  href="/review"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] hover:border-[var(--ink)] whisper-shadow transition-all flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-[#0070f3]" /> Open Review Queue
                </Link>
              </div>
            </div>

            {/* Spec Sheet Metrics Grid */}
            <div className="w-full md:w-auto grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="geist-card p-4">
                <span className="font-geist-mono text-[10px] uppercase tracking-wider text-[var(--mute)] block">
                  EVENTS IN SYSTEM
                </span>
                <span className="text-2xl font-semibold tracking-heading-md text-[var(--ink)] mt-1 block">
                  {events.length}
                </span>
              </div>

              <div className="geist-card p-4">
                <span className="font-geist-mono text-[10px] uppercase tracking-wider text-[var(--mute)] block">
                  APPROVAL STAGES
                </span>
                <span className="text-2xl font-semibold tracking-heading-md text-[#0070f3] mt-1 block">
                  2-STAGE
                </span>
              </div>

              <div className="geist-card p-4">
                <span className="font-geist-mono text-[10px] uppercase tracking-wider text-[var(--mute)] block">
                  ELIGIBILITY CUTOFF
                </span>
                <span className="text-2xl font-semibold tracking-heading-md text-amber-500 mt-1 block">
                  7 DAYS
                </span>
              </div>

              <div className="geist-card p-4">
                <span className="font-geist-mono text-[10px] uppercase tracking-wider text-[var(--mute)] block">
                  BROADCAST WINDOW
                </span>
                <span className="text-2xl font-semibold tracking-heading-md text-emerald-500 mt-1 block">
                  21 DAYS
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Flow Portal Links */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[var(--mute)]">
            DEDICATED ROLE FLOWS // SEPARATE MODULES
          </span>
          <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] mt-0.5">
            CampusCast Core Modules & Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Review Queue */}
          <Link
            href="/review"
            className="geist-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-all group whisper-shadow"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#0070f3]/10 border border-[#0070f3]/30 flex items-center justify-center text-[#0070f3]">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] group-hover:text-[#0070f3] transition-colors">
                Review Queue & Submissions
              </h3>
              <p className="text-xs text-[var(--body)] leading-relaxed">
                Stage 1 HOD verification, Stage 2 Admin final decisioning, and submission tracking with full audit trails.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-[#0070f3]">
              <span>Go to Review Queue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Events & Poster Management */}
          <Link
            href="/events"
            className="geist-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-all group whisper-shadow"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] group-hover:text-purple-400 transition-colors">
                Events & Poster Management
              </h3>
              <p className="text-xs text-[var(--body)] leading-relaxed">
                Create new campus events, upload poster graphics, brand compliance self-certification, and version history.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Go to Events Hub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Screen Fleet & Hardware IoT */}
          <Link
            href="/devices"
            className="geist-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-all group whisper-shadow"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] group-hover:text-emerald-400 transition-colors">
                Digital Display Fleet & IoT
              </h3>
              <p className="text-xs text-[var(--body)] leading-relaxed">
                Real-time ESP32 display heartbeats, location zone mappings, AWS IoT Shadow inspection, and screen registration.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Go to Screen Fleet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: 7-Day Cutoff & Deadlines */}
          <Link
            href="/deadlines"
            className="geist-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-all group whisper-shadow"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] group-hover:text-amber-500 transition-colors">
                7-Day Cutoff & Deadlines
              </h3>
              <p className="text-xs text-[var(--body)] leading-relaxed">
                Section 5.1 cutoff monitor, countdown timers, deadline breach alerts, and 48-hour automated reminders.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-amber-500">
              <span>Go to Cutoff Monitor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 5: Velocity Analytics */}
          <Link
            href="/analytics"
            className="geist-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-all group whisper-shadow"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] group-hover:text-cyan-400 transition-colors">
                Turnaround Velocity Analytics
              </h3>
              <p className="text-xs text-[var(--body)] leading-relaxed">
                Metrics on Stage 1 HOD vs Stage 2 Admin review speeds, average approval durations, and broadcast efficiency.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Go to Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 6: Background Automation Jobs */}
          <Link
            href="/jobs"
            className="geist-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-all group whisper-shadow"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[6px] bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Play className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] group-hover:text-rose-400 transition-colors">
                Automation & Worker Controls
              </h3>
              <p className="text-xs text-[var(--body)] leading-relaxed">
                Manually trigger BullMQ scheduled jobs (Broadcast, Eligibility, Reminders, Archiving) and inspect execution logs.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-rose-400">
              <span>Go to Jobs Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <EventCreationUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
        clubs={clubs}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
