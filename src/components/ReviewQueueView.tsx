"use client";

import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface ReviewQueueViewProps {
  events: any[];
  currentUser: any;
  onRefresh: () => void;
  onOpenUpload: (eventId: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  events,
  currentUser,
  onRefresh,
  onOpenUpload,
}) => {
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [reviewingItem, setReviewingItem] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const role = currentUser?.role || "viewer";

  // Filter content items across events
  const allContentItems: any[] = [];
  events.forEach((evt) => {
    if (evt.contentItems && evt.contentItems.length > 0) {
      evt.contentItems.forEach((ci: any) => {
        allContentItems.push({
          ...ci,
          event: evt,
        });
      });
    }
  });

  const filteredItems = allContentItems.filter((ci) => {
    // Tab filter
    if (filterTab === "pending_hod" && ci.status !== "pending_hod_approval") return false;
    if (filterTab === "pending_admin" && ci.status !== "pending_admin_approval") return false;
    if (filterTab === "live_approved" && ci.status !== "approved" && ci.status !== "live") return false;
    if (filterTab === "rejected" && ci.status !== "rejected" && ci.status !== "ineligible") return false;

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const titleMatch = ci.event?.title?.toLowerCase().includes(q);
      const clubMatch = ci.event?.club?.name?.toLowerCase().includes(q);
      if (!titleMatch && !clubMatch) return false;
    }

    return true;
  });

  const handleReviewSubmit = async () => {
    if (!reviewingItem || !reviewDecision) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/content/${reviewingItem.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: reviewDecision,
          comment: comment || (reviewDecision === "approve" ? "Approved for broadcast." : "Poster requires revisions."),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review decision.");

      setReviewingItem(null);
      setReviewDecision(null);
      setComment("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetRejectReasons = [
    "Text clipped outside safe margins (50px padding)",
    "Non-compliant logo usage (Brand Asset Kit)",
    "Low resolution graphic (<1080x1920 ratio)",
    "Missing required venue or QR registration link",
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="geist-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-[#0070f3] bg-[#0070f3]/10 px-2 py-0.5 rounded-[4px]">
              ROLE: {role.toUpperCase().replace("_", " ")}
            </span>
            <span className="font-geist-mono text-[10px] text-[var(--mute)]">
              {currentUser?.departmentId ? `[${currentUser.departmentId.toUpperCase()}]` : ""}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0070f3]" /> Two-Stage Poster Approval Queue
          </h2>
          <p className="text-xs text-[var(--body)] mt-1">
            Stage 1: HOD Technical & Scoped Review ➔ Stage 2: Chief Admin Final Verification ➔ IoT Screen Broadcast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-geist-mono text-[10px] uppercase text-[var(--mute)] block">
              ITEMS PENDING REVIEW
            </span>
            <span className="text-xl font-semibold text-[var(--ink)] font-geist-mono">
              {allContentItems.filter((i) => i.status.startsWith("pending")).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex space-x-1 overflow-x-auto p-1 bg-[var(--canvas-inset)] rounded-[8px] border border-[var(--hairline)]">
          {[
            { id: "all", label: "All Submissions" },
            { id: "pending_hod", label: "Stage 1 (Pending HOD)" },
            { id: "pending_admin", label: "Stage 2 (Pending Admin)" },
            { id: "live_approved", label: "Live & Approved" },
            { id: "rejected", label: "Rejected / Ineligible" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-all ${
                filterTab === tab.id
                  ? "bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-sm font-semibold"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[var(--mute)] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or club..."
            className="w-full bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid */}
      {filteredItems.length === 0 ? (
        <div className="geist-card p-12 text-center space-y-3">
          <FileCheck className="w-10 h-10 text-[var(--mute)] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">No Content Submissions Found</h3>
          <p className="text-xs text-[var(--mute)] max-w-sm mx-auto">
            There are currently no poster submissions matching your active filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isHodEligible = role === "club_hod" && item.status === "pending_hod_approval";
            const isAdminEligible = role === "admin" && item.status === "pending_admin_approval";
            const canReview = isHodEligible || isAdminEligible;

            return (
              <div
                key={item.id}
                className="geist-card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ink)] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-geist-mono text-[10px] font-semibold text-[#0070f3] uppercase tracking-wider block">
                        {item.event?.club?.name || "Campus Club"}
                      </span>
                      <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] mt-0.5">
                        {item.event?.title}
                      </h3>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Poster Thumbnail */}
                  <div className="relative group overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-slate-950 h-52 flex items-center justify-center">
                    {item.mediaUrl ? (
                      <>
                        <img
                          src={item.mediaUrl}
                          alt={item.event?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <a
                          href={item.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Open Full Poster"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    ) : (
                      <div className="text-center text-[var(--mute)] space-y-1">
                        <FileCheck className="w-8 h-8 mx-auto opacity-40" />
                        <span className="font-geist-mono text-[11px] block">No Poster Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Specs */}
                  <div className="p-3 bg-[var(--canvas-inset)] rounded-[6px] border border-[var(--hairline)] space-y-1 font-geist-mono text-[11px] text-[var(--body)]">
                    <div className="flex justify-between">
                      <span className="text-[var(--mute)]">EVENT DATE:</span>
                      <span className="text-[var(--ink)]">
                        {new Date(item.event?.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--mute)]">DEPARTMENT:</span>
                      <span className="text-[var(--ink)] uppercase">
                        {item.event?.club?.departmentId || "General"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--mute)]">SELF-CERTIFIED:</span>
                      <span className={item.selfCertified ? "text-emerald-500 font-semibold" : "text-amber-500"}>
                        {item.selfCertified ? "PASSED ✅" : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Action Controls */}
                <div className="pt-3 border-t border-[var(--hairline)] flex gap-2">
                  {canReview ? (
                    <button
                      onClick={() => {
                        setReviewingItem(item);
                        setReviewDecision("approve");
                      }}
                      className="w-full py-2 rounded-[6px] bg-[#0070f3] text-white text-xs font-semibold hover:bg-[#0060df] transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evaluate & Decide
                    </button>
                  ) : (item.status === "awaiting_poster" || item.status === "rejected") && (role === "club_president" || role === "admin") ? (
                    <>
                      <button
                        onClick={() => onOpenUpload(item.eventId || item.event?.id)}
                        className="flex-1 py-2 rounded-[6px] bg-[#0070f3] text-white text-xs font-semibold hover:bg-[#0060df] transition-all flex items-center justify-center gap-1.5"
                      >
                        Upload Poster
                      </button>
                      <button
                        onClick={() => {
                          setReviewingItem(item);
                          setReviewDecision(null);
                        }}
                        className="px-3 py-2 rounded-[6px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-medium hover:border-[var(--ink)] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--mute)]" /> Details
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setReviewingItem(item);
                        setReviewDecision(null);
                      }}
                      className="w-full py-2 rounded-[6px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-medium hover:border-[var(--ink)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--mute)]" /> View Details & History
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Review Decision Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--canvas-elevated)] max-w-lg w-full p-6 rounded-xl border border-[var(--hairline)] floating-shadow space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div>
                <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-[#0070f3]">
                  POSTER EVALUATION // STAGE {reviewingItem.status.includes("hod") ? "1 HOD" : "2 ADMIN"}
                </span>
                <h3 className="text-base font-semibold text-[var(--ink)]">
                  {reviewingItem.event?.title}
                </h3>
              </div>
              <button
                onClick={() => setReviewingItem(null)}
                className="text-[var(--mute)] hover:text-[var(--ink)] text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-[6px] text-xs font-geist-mono">
                {errorMsg}
              </div>
            )}

            {/* Poster Preview */}
            {reviewingItem.mediaUrl && (
              <div className="relative h-48 rounded-[8px] border border-[var(--hairline)] bg-slate-950 overflow-hidden">
                <img
                  src={reviewingItem.mediaUrl}
                  alt="Poster preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Decision Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-geist-mono uppercase text-[var(--mute)]">
                SELECT REVIEW DECISION *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision("approve")}
                  className={`p-3 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    reviewDecision === "approve"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "border-[var(--hairline)] bg-[var(--canvas-inset)] text-[var(--body)]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approve & Advance Stage
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision("reject")}
                  className={`p-3 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    reviewDecision === "reject"
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                      : "border-[var(--hairline)] bg-[var(--canvas-inset)] text-[var(--body)]"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-500" /> Reject & Request Revision
                </button>
              </div>
            </div>

            {/* Preset Feedback Chips (if rejecting) */}
            {reviewDecision === "reject" && (
              <div className="space-y-2">
                <label className="block text-[11px] font-geist-mono uppercase text-[var(--mute)]">
                  PRESET REJECTION REASONS
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetRejectReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setComment(reason)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-geist-mono bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
                    >
                      + {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Field */}
            <div className="space-y-1">
              <label className="block text-xs font-geist-mono uppercase text-[var(--mute)]">
                REVIEW COMMENTS & INSTRUCTIONS
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter feedback or approval notes..."
                rows={3}
                className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[var(--hairline)]">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="flex-1 py-2 rounded-[6px] bg-[var(--canvas-inset)] text-[var(--body)] text-xs font-medium hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={isSubmitting || !reviewDecision}
                className="flex-1 py-2 rounded-[6px] bg-[#0070f3] text-white text-xs font-semibold hover:bg-[#0060df] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
