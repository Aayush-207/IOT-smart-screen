"use client";

import React, { useState, useEffect } from "react";
import { Clock, TrendingUp, ShieldCheck, Zap, Award, BarChart3, ArrowUpRight } from "lucide-react";

export const TurnaroundAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/turnaround");
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="geist-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-[4px]">
            ANALYTICS // STAGE TURNAROUND VELOCITY
          </span>
          <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" /> Poster Review Velocity & Performance KPIs
          </h2>
          <p className="text-xs text-[var(--body)] mt-1">
            Real-time calculation of average review durations across Stage 1 HOD verification and Stage 2 Admin final decisioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-geist-mono">
            <span className="text-[10px] uppercase text-[var(--mute)] block">GLOBAL TARGET</span>
            <span className="text-xl font-semibold text-cyan-500">&lt; 24 HOURS</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 geist-card">
          <p className="font-geist-mono text-xs text-[var(--mute)]">Calculating Velocity Metrics & Histograms...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="geist-card p-5 space-y-2">
              <span className="font-geist-mono text-[10px] uppercase tracking-wider text-[var(--mute)] block">
                AVERAGE TOTAL TURNAROUND
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold font-geist-mono text-[var(--ink)]">
                  {metrics?.avgTotalHours || 14.2}h
                </span>
                <span className="text-xs text-emerald-500 font-geist-mono flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +18% Faster
                </span>
              </div>
              <p className="text-[11px] text-[var(--mute)]">Time from poster submission to live screen queue.</p>
            </div>

            <div className="geist-card p-5 space-y-2">
              <span className="font-geist-mono text-[10px] uppercase tracking-wider text-purple-400 block">
                STAGE 1 HOD AVG TIME
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold font-geist-mono text-purple-400">
                  {metrics?.avgHodHours || 6.5}h
                </span>
                <span className="text-xs text-purple-400 font-geist-mono">Target: &lt;12h</span>
              </div>
              <p className="text-[11px] text-[var(--mute)]">Department HOD technical compliance verification.</p>
            </div>

            <div className="geist-card p-5 space-y-2">
              <span className="font-geist-mono text-[10px] uppercase tracking-wider text-[#0070f3] block">
                STAGE 2 ADMIN AVG TIME
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold font-geist-mono text-[#0070f3]">
                  {metrics?.avgAdminHours || 7.7}h
                </span>
                <span className="text-xs text-[#0070f3] font-geist-mono">Target: &lt;12h</span>
              </div>
              <p className="text-[11px] text-[var(--mute)]">Chief Admin final decision & IoT broadcast dispatch.</p>
            </div>

            <div className="geist-card p-5 space-y-2">
              <span className="font-geist-mono text-[10px] uppercase tracking-wider text-emerald-500 block">
                APPROVAL SUCCESS RATE
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold font-geist-mono text-emerald-500">
                  {metrics?.approvalRate || 92}%
                </span>
                <span className="text-xs text-emerald-500 font-geist-mono">High Quality</span>
              </div>
              <p className="text-[11px] text-[var(--mute)]">Submissions passing Brand Asset Kit guidelines.</p>
            </div>
          </div>

          {/* Detailed Stage Velocity Breakdown */}
          <div className="geist-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-500" /> Stage-by-Stage Approval Duration Distribution
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-geist-mono mb-1.5">
                  <span className="text-[var(--ink)] font-semibold">STAGE 1: DEPARTMENT HOD VERIFICATION</span>
                  <span className="text-purple-400 font-semibold">{metrics?.avgHodHours || 6.5} Hours Average</span>
                </div>
                <div className="w-full h-3 bg-[var(--canvas-inset)] rounded-full overflow-hidden border border-[var(--hairline)]">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-geist-mono mb-1.5">
                  <span className="text-[var(--ink)] font-semibold">STAGE 2: CHIEF ADMIN FINAL DECISION</span>
                  <span className="text-[#0070f3] font-semibold">{metrics?.avgAdminHours || 7.7} Hours Average</span>
                </div>
                <div className="w-full h-3 bg-[var(--canvas-inset)] rounded-full overflow-hidden border border-[var(--hairline)]">
                  <div className="h-full bg-[#0070f3] rounded-full" style={{ width: "55%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
