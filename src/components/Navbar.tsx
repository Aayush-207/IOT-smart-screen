"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Monitor, Shield, Download, Users, Clock, AlertTriangle, Play, Calendar, LogOut, Sun, Moon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "club_president" | "club_hod" | "admin" | "viewer";
  clubId?: string;
  departmentId?: string;
}

interface NavbarProps {
  currentUser?: User | null;
  onUserSwitched?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onUserSwitched }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const text = await res.text();
      if (!res.ok || !text) {
        console.error("Failed to fetch users", res.status, text);
        return;
      }
      const data = JSON.parse(text);
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Check initial theme state
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  const handleRoleChange = async (userId: string) => {
    setIsSwitching(true);
    try {
      await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (onUserSwitched) onUserSwitched();
      router.refresh();
    } catch (e) {
      console.error("Failed to switch role", e);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Failed to log out", e);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Shield },
    { href: "/review", label: "Review Queue", icon: Shield },
    { href: "/events", label: "Events & Posters", icon: Calendar },
    { href: "/devices", label: "Screen Fleet & IoT", icon: Monitor },
    { href: "/deadlines", label: "7-Day Deadlines", icon: AlertTriangle },
    { href: "/analytics", label: "Velocity Analytics", icon: Clock },
    { href: "/jobs", label: "Background Jobs", icon: Play },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--canvas)]/90 border-b border-[var(--hairline)] backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Geist Wordmark */}
          <Link href="/" className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[var(--ink)] text-[var(--canvas)] flex items-center justify-center font-bold whisper-shadow">
              <VercelTriangle className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-heading-lg text-[var(--ink)] font-geist-sans">
                  CampusCast
                </h1>
                <span className="text-[10px] font-geist-mono uppercase tracking-wider px-2 py-0.5 rounded-[6px] border border-[var(--hairline)] text-[var(--mute)] bg-[var(--canvas-elevated)]">
                  SPEC // BILLBOARD
                </span>
              </div>
              <p className="text-[11px] font-geist-mono text-[var(--mute)]">
                Digital Poster Approval & IoT Broadcast Platform
              </p>
            </div>
          </Link>

          {/* Right Controls: Theme Toggle + Brand Asset Kit + Role Switcher + Logout */}
          <div className="flex items-center space-x-3">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-[6px] bg-[var(--canvas-elevated)] border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)] transition-all whisper-shadow"
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <a
              href="#brand-asset-kit"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "Downloading Campus Brand Asset Kit (ZIP package with logo guidelines, safe margins, and poster templates)..."
                );
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] hover:border-[var(--ink)] whisper-shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Brand Asset Kit
            </a>

            {/* Quick Switch Role Selector */}
            <div className="flex items-center gap-2 bg-[var(--canvas-elevated)] px-2.5 py-1 rounded-[6px] border border-[var(--hairline)] whisper-shadow">
              <Users className="w-3.5 h-3.5 text-[#0070f3]" />
              <select
                value={currentUser?.id || ""}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={isSwitching}
                className="bg-transparent text-[var(--ink)] font-geist-mono text-xs font-medium focus:outline-none cursor-pointer"
              >
                {users.length === 0 && currentUser ? (
                  <option value={currentUser.id} className="bg-[var(--canvas-elevated)] text-[var(--ink)]">
                    [{currentUser.role.toUpperCase()}] {currentUser.name}
                  </option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[var(--canvas-elevated)] text-[var(--ink)]">
                      [{u.role.toUpperCase()}] {u.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-[6px] bg-[var(--canvas-inset)] hover:bg-rose-500/10 hover:text-rose-400 border border-[var(--hairline)] text-[var(--mute)] transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links Bar */}
        <div className="flex space-x-1.5 overflow-x-auto py-2.5 scrollbar-none border-t border-[var(--hairline-soft)]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-all relative ${
                  isActive
                    ? "bg-[var(--canvas-elevated)] text-[var(--ink)] border border-[var(--hairline)] font-semibold whisper-shadow"
                    : "text-[var(--body)] hover:text-[var(--ink)] hover:bg-[var(--canvas-elevated)]/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#0070f3]" : "text-[var(--mute)]"}`} />
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#0070f3] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

function VercelTriangle(props: any) {
  return (
    <svg viewBox="0 0 76 65" className={props.className}>
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}
