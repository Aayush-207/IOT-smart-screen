"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Plus, Calendar, MapPin, ShieldCheck, History, ExternalLink, Image as ImageIcon } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { EventCreationUploadModal } from "@/components/EventCreationUploadModal";

export default function EventsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [targetUploadEventId, setTargetUploadEventId] = useState<string | null>(null);

  // History Drawer State
  const [historyContentItem, setHistoryContentItem] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchEventsData = async () => {
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
    fetchEventsData();
  }, []);

  const handleOpenHistory = async (contentItem: any) => {
    setHistoryContentItem(contentItem);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/content/${contentItem.id}/history`);
      const data = await res.json();
      setHistoryLogs(data.history || data.approvalSteps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-geist-sans selection:bg-[#0070f3] selection:text-white">
      <Navbar currentUser={currentUser} onUserSwitched={fetchEventsData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="geist-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[var(--mute)]">
              MANAGEMENT // EVENTS & POSTER REPOSITORY
            </span>
            <h2 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)] mt-0.5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0070f3]" /> Campus Events & Poster Revisions
            </h2>
            <p className="text-xs text-[var(--body)] mt-1">
              Create club events, submit high-resolution poster assets, self-certify brand guidelines, and review revision history.
            </p>
          </div>

          <button
            onClick={() => {
              setTargetUploadEventId(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 whisper-shadow transition-all shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Event
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 geist-card">
            <p className="font-geist-mono text-xs text-[var(--mute)]">Loading Events Repository...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const activePoster = evt.contentItems?.[0];

              return (
                <div key={evt.id} className="geist-card p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-geist-mono text-[11px] font-medium text-[#0070f3] uppercase tracking-wider block">
                          {evt.club?.name || "Campus Club"}
                        </span>
                        <h3 className="text-base font-semibold tracking-heading-md text-[var(--ink)] mt-0.5 leading-snug">
                          {evt.title}
                        </h3>
                      </div>
                      {activePoster && <StatusBadge status={activePoster.status} />}
                    </div>

                    <div className="space-y-1.5 font-geist-mono text-xs text-[var(--body)] bg-[var(--canvas-inset)] p-3 rounded-[6px] border border-[var(--hairline)]">
                      <div className="flex items-center gap-2 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--mute)]" />
                        <span>
                          DATE: {new Date(evt.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[var(--mute)]" />
                        <span>VENUE: {evt.venue}</span>
                      </div>
                    </div>

                    {activePoster?.mediaUrl ? (
                      <div className="space-y-2">
                        <div className="relative group overflow-hidden rounded-[6px] border border-[var(--hairline)] bg-black/40 h-40">
                          <img
                            src={activePoster.mediaUrl}
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <a
                            href={activePoster.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Open full poster"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {activePoster.selfCertified && (
                          <div className="flex items-center gap-1.5 text-[10px] font-geist-mono text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> Brand Compliance Self-Certified
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 rounded-[6px] border border-dashed border-[var(--hairline)] bg-[var(--canvas-inset)] flex flex-col items-center justify-center gap-1.5 text-[var(--mute)]">
                        <ImageIcon className="w-6 h-6 opacity-50" />
                        <span className="font-geist-mono text-[11px]">No Poster Uploaded Yet</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[var(--hairline)] flex gap-2">
                    {!activePoster ? (
                      <button
                        onClick={() => {
                          setTargetUploadEventId(evt.id);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 py-1.5 rounded-[6px] bg-[#0070f3] text-white text-xs font-semibold hover:bg-[#0060df] transition-all"
                      >
                        + Upload Poster
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setTargetUploadEventId(evt.id);
                            setIsModalOpen(true);
                          }}
                          className="flex-1 py-1.5 rounded-[6px] bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-medium hover:border-[var(--ink)] transition-all"
                        >
                          Re-upload Poster
                        </button>
                        <button
                          onClick={() => handleOpenHistory(activePoster)}
                          className="px-3 py-1.5 rounded-[6px] bg-[var(--canvas-elevated)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-medium hover:border-[var(--ink)] transition-all flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5 text-[#0070f3]" /> Logs
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* History Modal */}
      {historyContentItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--canvas-elevated)] max-w-md w-full p-6 rounded-xl border border-[var(--hairline)] floating-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <h3 className="text-sm font-semibold tracking-heading-md text-[var(--ink)] flex items-center gap-2">
                <History className="w-4 h-4 text-[#0070f3]" /> Audit Logs & Approval Steps
              </h3>
              <button
                onClick={() => setHistoryContentItem(null)}
                className="text-[var(--mute)] hover:text-[var(--ink)] text-xs"
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <p className="font-geist-mono text-xs text-[var(--mute)] text-center py-4">Loading step history...</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {historyLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-[var(--canvas-inset)] rounded-[6px] border border-[var(--hairline)] space-y-1 text-xs font-geist-mono">
                    <div className="flex justify-between text-[11px] text-[#0070f3]">
                      <span>DECISION: {log.decision.toUpperCase()}</span>
                      <span className="text-[var(--mute)]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[var(--ink)] text-xs font-sans">{log.comment || "No comments provided."}</p>
                    <span className="text-[10px] text-[var(--mute)] uppercase block">
                      ROLE: {log.approverRole}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryContentItem(null)}
              className="w-full py-2 rounded-[6px] bg-[var(--ink)] text-[var(--canvas)] text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <EventCreationUploadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTargetUploadEventId(null);
        }}
        onSuccess={fetchEventsData}
        targetEventId={targetUploadEventId}
        clubs={clubs}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
