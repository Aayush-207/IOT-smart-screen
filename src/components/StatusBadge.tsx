import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let chipClass = "border border-[var(--hairline)] bg-[var(--canvas-stone)] text-[var(--ink)]";
  let dotColor = "bg-[var(--mute)]";
  let label = status.replace(/_/g, " ");

  switch (status) {
    case "draft":
      chipClass = "border border-[var(--hairline)] bg-[var(--canvas-stone)] text-[var(--slate)]";
      dotColor = "bg-[var(--slate)]";
      label = "Draft";
      break;
    case "pending_approval":
      chipClass = "cohere-chip-coral";
      dotColor = "bg-[#ff7759]";
      label = "Under Review";
      break;
    case "scheduled":
      chipClass = "cohere-chip-blue";
      dotColor = "bg-[#1863dc]";
      label = "Scheduled";
      break;
    case "rejected":
    case "failed":
    case "withdrawn":
      chipClass = "border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400";
      dotColor = "bg-rose-600";
      label = status === "withdrawn" ? "Withdrawn" : status === "failed" ? "Failed" : "Rejected";
      break;
    case "live":
    case "online":
    case "delivered":
    case "displaying":
      chipClass = "cohere-chip-green";
      dotColor = "bg-[#003c33] dark:bg-emerald-400";
      label = status === "online" ? "Online" : status === "displaying" ? "Displaying" : status === "delivered" ? "Delivered" : "Live";
      break;
    case "stale":
    case "pending":
    case "dispatched":
      chipClass = "border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400";
      dotColor = "bg-amber-600";
      label = status === "stale" ? "Stale" : status === "dispatched" ? "Dispatched" : "Pending Sync";
      break;
    case "offline":
    case "archived":
    case "expired":
      chipClass = "border border-[var(--hairline)] bg-[var(--canvas-stone)] text-[var(--mute)]";
      dotColor = "bg-[var(--mute)]";
      label = status.charAt(0).toUpperCase() + status.slice(1);
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-semibold uppercase tracking-wider select-none ${chipClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      {label}
    </span>
  );
};
