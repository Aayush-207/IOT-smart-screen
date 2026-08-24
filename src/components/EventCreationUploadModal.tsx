"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  X,
  ArrowRight,
} from "lucide-react";

interface EventCreationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetEventId?: string | null;
  clubs: any[];
  currentUserId?: string;
}

export const EventCreationUploadModal: React.FC<EventCreationUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetEventId,
  clubs,
  currentUserId,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [clubId, setClubId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  // Self Certification Checklist
  const [certRatio, setCertRatio] = useState(false);
  const [certMargins, setCertMargins] = useState(false);
  const [certBrand, setCertBrand] = useState(false);
  const [certLegible, setCertLegible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clubs && clubs.length > 0 && !clubId) {
      setClubId(clubs[0].id);
    }
  }, [clubs, clubId]);

  useEffect(() => {
    if (targetEventId) {
      setStep(2); // Direct poster upload for existing event
    } else {
      setStep(1);
    }
  }, [targetEventId, isOpen]);

  if (!isOpen) return null;

  const isSelfCertified = certRatio && certMargins && certBrand && certLegible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let activeEventId = targetEventId;

      // Step 1: Create Event if creating new
      if (!activeEventId) {
        if (!title || !eventDate || !venue || !clubId) {
          throw new Error("Please complete all required event fields.");
        }

        const eventRes = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            eventDate,
            venue,
            clubId,
          }),
        });

        const eventData = await eventRes.json();
        if (!eventRes.ok) throw new Error(eventData.error || "Failed to create event.");
        activeEventId = eventData.id;
      }

      // Step 2: Upload Poster Content Item
      if (mediaUrl.trim() !== "") {
        const contentRes = await fetch(`/api/events/${activeEventId}/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaUrl,
            selfCertified: isSelfCertified,
          }),
        });

        const contentData = await contentRes.json();
        if (!contentRes.ok) throw new Error(contentData.error || "Failed to upload poster asset.");
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setVenue("");
    setMediaUrl("");
    setCertRatio(false);
    setCertMargins(false);
    setCertBrand(false);
    setCertLegible(false);
    setStep(1);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--canvas-elevated)] max-w-xl w-full p-6 rounded-xl border border-[var(--hairline)] floating-shadow space-y-5 font-geist-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
          <div>
            <span className="font-geist-mono text-[10px] font-semibold uppercase tracking-wider text-[#0070f3]">
              {targetEventId ? "POSTER RE-UPLOAD" : `STEP ${step} OF 2 // EVENT CREATION`}
            </span>
            <h3 className="text-base font-semibold text-[var(--ink)]">
              {targetEventId ? "Upload New Poster Version" : "Create Campus Event & Submit Poster"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--mute)] hover:text-[var(--ink)] text-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-[6px] text-xs font-geist-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!targetEventId && step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  EVENT TITLE *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Autonomous Robotics Hackathon 2026"
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  HOST CLUB *
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                  required
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                    EVENT DATE *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                    VENUE LOCATION *
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Engineering Auditorium 3"
                    className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  EVENT DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key event highlights, speaker list, or target audience details..."
                  rows={2}
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none font-sans"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!title || !eventDate || !venue) {
                    setError("Please complete all required fields before proceeding.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="w-full py-2.5 rounded-full bg-[var(--ink)] text-[var(--canvas)] font-semibold text-xs whisper-shadow hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Next: Upload Poster & Self-Certify <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {(targetEventId || step === 2) && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-geist-mono uppercase text-[var(--mute)] mb-1">
                  POSTER IMAGE URL / ASSET PATH *
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1540575467063-178a50c2df87 or asset URL"
                  className="w-full bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-[6px] p-2.5 text-xs text-[var(--ink)] focus:border-[#0070f3] focus:outline-none"
                  required
                />
              </div>

              {/* Sample Preset Assets Quick Selector */}
              <div className="space-y-1">
                <span className="font-geist-mono text-[10px] uppercase text-[var(--mute)] block">
                  QUICK PRESET SAMPLE POSTERS
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Robotics Hackathon", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87" },
                    { label: "AI & IoT Expo", url: "https://images.unsplash.com/photo-1511578314322-379afb476865" },
                    { label: "Design Summit", url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2" },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => setMediaUrl(sample.url)}
                      className="px-2.5 py-1 rounded-[6px] text-[10px] font-geist-mono bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
                    >
                      + {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Poster Preview */}
              {mediaUrl && (
                <div className="relative h-44 rounded-[8px] border border-[var(--hairline)] bg-slate-950 overflow-hidden">
                  <img src={mediaUrl} alt="Poster Preview" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Brand Asset Kit Self-Certification Checklist */}
              <div className="p-4 bg-[var(--canvas-inset)] rounded-[8px] border border-[var(--hairline)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-geist-mono text-[11px] font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Brand Compliance Self-Certification
                  </span>
                  <span className="font-geist-mono text-[10px] text-[var(--mute)]">Section 4.2 Guidelines</span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--body)] hover:text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={certRatio}
                      onChange={(e) => setCertRatio(e.target.checked)}
                      className="rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span>1080x1920 Portrait Orientation (9:16 aspect ratio)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[var(--body)] hover:text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={certMargins}
                      onChange={(e) => setCertMargins(e.target.checked)}
                      className="rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span>50px Safe Margin observed around text elements</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[var(--body)] hover:text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={certBrand}
                      onChange={(e) => setCertBrand(e.target.checked)}
                      className="rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span>Official University Logo used per Brand Asset Kit</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[var(--body)] hover:text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={certLegible}
                      onChange={(e) => setCertLegible(e.target.checked)}
                      className="rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span>Legible high-contrast typography & QR registration link</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[var(--hairline)]">
                {!targetEventId && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 rounded-[6px] bg-[var(--canvas-inset)] text-[var(--body)] text-xs font-medium hover:text-[var(--ink)]"
                  >
                    Back to Step 1
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-full bg-[var(--ink)] text-[var(--canvas)] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 whisper-shadow"
                >
                  {loading ? "Submitting..." : "Submit Event & Poster for Review"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
