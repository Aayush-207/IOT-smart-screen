"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { DeviceFleetView } from "@/components/DeviceFleetView";

export default function DevicesPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-geist-sans selection:bg-[#0070f3] selection:text-white">
      <Navbar currentUser={currentUser} onUserSwitched={fetchUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DeviceFleetView />
      </main>
    </div>
  );
}
