import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let chipClass = "border border-[#362d59] bg-[#261c3d] text-[#bdb8c0]";
  let dotColor = "bg-[#8b8496]";
  let label = status.replace(/_/g, " ");

  switch (status) {
    case "draft":
      chipClass = "border border-[#362d59] bg-[#150f23] text-[#a39cb0]";
      dotColor = "bg-[#8b8496]";
      label = "Draft";
      break;
    case "pending_approval":
      chipClass = "border border-[#fa7faa]/40 bg-[#fa7faa]/10 text-[#fa7faa]";
      dotColor = "bg-[#fa7faa] animate-pulse";
      label = "Under Review";
      break;
    case "scheduled":
      chipClass = "border border-[#6a5fc1]/40 bg-[#6a5fc1]/15 text-[#a79df5]";
      dotColor = "bg-[#6a5fc1]";
      label = "Scheduled";
      break;
    case "rejected":
    case "failed":
    case "withdrawn":
      chipClass = "border border-[#fa5252]/40 bg-[#fa5252]/10 text-[#fa5252]";
      dotColor = "bg-[#fa5252]";
      label = status === "withdrawn" ? "Withdrawn" : status === "failed" ? "Failed" : "Rejected";
      break;
    case "live":
    case "online":
    case "delivered":
    case "displaying":
      chipClass = "border border-[#c2ef4e]/40 bg-[#c2ef4e]/10 text-[#c2ef4e]";
      dotColor = "bg-[#c2ef4e] shadow-[0_0_6px_rgba(194,239,78,0.8)]";
      label = status === "online" ? "Online" : status === "displaying" ? "Displaying" : status === "delivered" ? "Delivered" : "Live";
      break;
    case "stale":
    case "pending":
    case "dispatched":
      chipClass = "border border-amber-500/40 bg-amber-500/10 text-amber-400";
      dotColor = "bg-amber-400";
      label = status === "stale" ? "Stale" : status === "dispatched" ? "Dispatched" : "Pending Sync";
      break;
    case "offline":
    case "archived":
    case "expired":
      chipClass = "border border-[#362d59] bg-[#150f23] text-[#8b8496]";
      dotColor = "bg-[#4c445c]";
      label = status.charAt(0).toUpperCase() + status.slice(1);
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider select-none ${chipClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      {label}
    </span>
  );
};
