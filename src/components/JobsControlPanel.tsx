"use client";

import React, { useState } from "react";
import { Play, Terminal, CheckCircle2, Clock, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

export const JobsControlPanel: React.FC = () => {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  const triggerJob = async (jobName: string) => {
    setRunningJob(jobName);
    try {
      const res = await fetch("/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobName }),
      });

      const data = await res.json();
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          jobName,
          status: res.ok ? "SUCCESS" : "FAILED",
          details: data,
        },
        ...prev,
      ]);
    } catch (e: any) {
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          jobName,
          status: "FAILED",
          details: { error: e.message },
        },
        ...prev,
      ]);
    } finally {
      setRunningJob(null);
    }
  };

  const jobs = [
    {
      id: "broadcast_window",
      name: "21-Day Broadcast Reconciliation",
      desc: "Scans approved posters within 21 days of event date & dispatches to live IoT screen schedules.",
      color: "bg-emerald-500",
    },
    {
      id: "eligibility_check",
      name: "Section 5.1 Cutoff Scan",
      desc: "Identifies pending posters submitted less than 7 days before event date & marks as ineligible.",
      color: "bg-amber-500",
    },
    {
      id: "send_reminders",
      name: "48-Hour Escalation Alerts",
      desc: "Triggers automated notification reminders to HODs and Admins for aging review items.",
      color: "bg-[#0070f3]",
    },
    {
      id: "archive_past_events",
      name: "Automated Post-Event Archiving",
      desc: "Transitions completed live event posters to archived storage state.",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="geist-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-[4px]">
            AUTOMATION // BULLMQ & REDIS WORKERS
          </span>
          <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] mt-1 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-rose-500" /> Background Jobs & Automation Console
          </h2>
          <p className="text-xs text-[var(--body)] mt-1">
            Manually trigger BullMQ background task workers or inspect automated crons for broadcast windows, eligibility cutoffs, and reminders.
          </p>
        </div>
      </div>

      {/* Jobs Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((j) => (
          <div key={j.id} className="geist-card p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${j.color}`} />
                <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)]">
                  {j.name}
                </h3>
              </div>
              <p className="text-xs text-[var(--body)] leading-relaxed">{j.desc}</p>
            </div>

            <button
              onClick={() => triggerJob(j.id)}
              disabled={runningJob === j.id}
              className="w-full py-2.5 rounded-[6px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-semibold hover:border-[var(--ink)] transition-all flex items-center justify-center gap-2"
            >
              {runningJob === j.id ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0070f3]" /> Running Task Worker...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#0070f3]" /> Execute Job Now
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Live Terminal Console Log */}
      <div className="geist-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-500" /> Worker Console Output
          </h3>
          <span className="font-geist-mono text-[10px] text-[var(--mute)]">
            LOG COUNT: {logs.length}
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-[8px] border border-slate-800 text-xs font-geist-mono text-emerald-400 overflow-y-auto max-h-80 space-y-3">
          {logs.length === 0 ? (
            <p className="text-slate-500 text-center py-6">
              No manual jobs executed in this session yet. Click "Execute Job Now" above to run a worker.
            </p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="border-b border-slate-900 pb-2 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>[{log.timestamp}] TASK: {log.jobName.toUpperCase()}</span>
                  <span className={log.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400"}>
                    {log.status}
                  </span>
                </div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
