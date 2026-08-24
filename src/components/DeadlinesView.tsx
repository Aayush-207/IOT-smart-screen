"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const DeadlinesView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/deadlines");
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const filteredEvents = events.filter((e) => {
    const days = Math.ceil((new Date(e.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (filter === "cutoff_breached" && days < 7) return true;
    if (filter === "safe" && days >= 7) return true;
    return filter === "all";
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="geist-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-[4px]">
            POLICY ENFORCEMENT // SECTION 5.1 CUTOFF
          </span>
          <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] mt-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> 7-Day Eligibility & Cutoff Monitor
          </h2>
          <p className="text-xs text-[var(--body)] mt-1">
            Posters submitted less than 7 days prior to event date are automatically flagged as ineligible to ensure adequate review windows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-geist-mono">
            <span className="text-[10px] uppercase text-[var(--mute)] block">7-DAY CUTOFF ENFORCED</span>
            <span className="text-xl font-semibold text-amber-500">STRICT</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto p-1 bg-[var(--canvas-inset)] rounded-[8px] border border-[var(--hairline)]">
        {[
          { id: "all", label: "All Upcoming Events" },
          { id: "cutoff_breached", label: "Within 7 Days (< 7 Days Cutoff)" },
          { id: "safe", label: "Safe Review Window (≥ 7 Days)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-all ${
              filter === tab.id
                ? "bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-sm font-semibold"
                : "text-[var(--mute)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Deadline Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 geist-card">
          <p className="font-geist-mono text-xs text-[var(--mute)]">Calculating Event Date Boundaries...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const now = new Date().getTime();
            const target = new Date(evt.eventDate).getTime();
            const daysRemaining = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
            const isBreached = daysRemaining < 7;
            const activePoster = evt.contentItems?.[0];

            return (
              <div
                key={evt.id}
                className={`geist-card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink)] transition-all ${
                  isBreached ? "border-amber-500/30" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-geist-mono text-[10px] font-semibold text-[#0070f3] uppercase tracking-wider block">
                        {evt.club?.name || "Campus Club"}
                      </span>
                      <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] mt-0.5">
                        {evt.title}
                      </h3>
                    </div>
                    {activePoster && <StatusBadge status={activePoster.status} />}
                  </div>

                  {/* Countdown Badge Meter */}
                  <div className="p-3 bg-[var(--canvas-inset)] rounded-[8px] border border-[var(--hairline)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-geist-mono">
                      <span className="text-[var(--mute)]">COUNTDOWN:</span>
                      <span
                        className={`font-semibold ${
                          daysRemaining <= 0
                            ? "text-rose-500"
                            : daysRemaining < 7
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {daysRemaining <= 0 ? "EVENT TODAY / PASSED" : `${daysRemaining} DAYS REMAINING`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[var(--canvas-elevated)] rounded-full overflow-hidden border border-[var(--hairline)]">
                      <div
                        className={`h-full transition-all ${
                          daysRemaining < 7 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, (daysRemaining / 21) * 100))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-geist-mono text-[var(--mute)]">
                      <span>EVENT DATE: {new Date(evt.eventDate).toLocaleDateString()}</span>
                      <span>{isBreached ? "CUTOFF BREACHED" : "ELIGIBLE"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-geist-mono text-[var(--mute)]">
                  <span>VENUE: {evt.venue}</span>
                  <span className={isBreached ? "text-amber-500 font-semibold" : "text-emerald-500"}>
                    {isBreached ? "⚠️ Section 5.1 Alert" : "✅ Compliant"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
