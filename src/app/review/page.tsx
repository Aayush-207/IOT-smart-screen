"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ReviewQueueView } from "@/components/ReviewQueueView";
import { EventCreationUploadModal } from "@/components/EventCreationUploadModal";

export default function ReviewPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [targetUploadEventId, setTargetUploadEventId] = useState<string | null>(null);

  const fetchData = async () => {
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
    fetchData();
  }, []);

  const handleOpenUpload = (eventId: string) => {
    setTargetUploadEventId(eventId);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-geist-sans selection:bg-[#0070f3] selection:text-white">
      <Navbar currentUser={currentUser} onUserSwitched={fetchData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 geist-card">
            <p className="font-geist-mono text-xs text-[var(--mute)]">Loading Review Queue...</p>
          </div>
        ) : (
          <ReviewQueueView
            events={events}
            currentUser={currentUser}
            onRefresh={fetchData}
            onOpenUpload={handleOpenUpload}
          />
        )}
      </main>

      <EventCreationUploadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTargetUploadEventId(null);
        }}
        onSuccess={fetchData}
        targetEventId={targetUploadEventId}
        clubs={clubs}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
