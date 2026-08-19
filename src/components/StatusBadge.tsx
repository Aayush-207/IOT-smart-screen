import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let borderBgText = "border-neutral-300 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-400";
  let dotColor = "bg-neutral-500";
  let label = status.replace(/_/g, " ");

  switch (status) {
    case "awaiting_poster":
      borderBgText = "border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300";
      dotColor = "bg-amber-500";
      label = "Awaiting Poster";
      break;
    case "pending_hod_approval":
      borderBgText = "border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300";
      dotColor = "bg-purple-500 animate-ping";
      label = "Stage 1 // Pending HOD";
      break;
    case "pending_admin_approval":
      borderBgText = "border-blue-300 dark:border-[#0070f3]/40 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-[#3291ff]";
      dotColor = "bg-[#0070f3] animate-ping";
      label = "Stage 2 // Pending Admin";
      break;
    case "approved":
      borderBgText = "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300";
      dotColor = "bg-emerald-500";
      label = "Approved (Queued)";
      break;
    case "rejected":
      borderBgText = "border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300";
      dotColor = "bg-rose-500";
      label = "Rejected";
      break;
    case "ineligible":
      borderBgText = "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-400";
      dotColor = "bg-red-500";
      label = "Ineligible (Lapsed)";
      break;
    case "live":
      borderBgText = "border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300";
      dotColor = "bg-cyan-500 animate-pulse";
      label = "Live Broadcast";
      break;
    case "archived":
      borderBgText = "border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-500";
      dotColor = "bg-neutral-500";
      label = "Archived";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] font-geist-mono text-[11px] font-medium uppercase tracking-wider border whisper-shadow ${borderBgText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
