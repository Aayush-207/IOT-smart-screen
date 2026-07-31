import {
  Bell,
  ChevronDown,
  RotateCcw,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Club, UserRole } from '../types';
import { roleLabels } from '../workflow';

export type ThemeOption = 'light' | 'dark';

interface NavbarProps {
  activeNotificationCount: number;
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onCreate: () => void;
  onSearch: () => void;
  onAttention: () => void;
  onResetWorkspace: () => void;
  clubs: Club[];
  currentRole: UserRole;
  currentClubId: string;
  currentUserName: string;
  onRoleChange: (role: UserRole) => void;
  onClubChange: (clubId: string) => void;
}

export function Navbar({
  activeNotificationCount,
  currentTheme,
  onThemeChange,
  onCreate,
  onSearch,
  onAttention,
  onResetWorkspace,
  clubs,
  currentRole,
  currentClubId,
  currentUserName,
  onRoleChange,
  onClubChange,
}: NavbarProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const initials = currentUserName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const closeAccount = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    window.addEventListener('pointerdown', closeAccount);
    return () => window.removeEventListener('pointerdown', closeAccount);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/88 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 md:w-[216px]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
            <span className="text-sm font-black tracking-tight">CC</span>
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold tracking-tight">CampusCast</p>
            <p className="truncate text-[11px] text-[var(--muted-foreground)]">
              MIT ADT University
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="mx-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--muted-foreground)] transition hover:border-[var(--border-strong)] sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search content or screens</span>
          <kbd className="ml-auto rounded border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 text-[10px]">
            ⌘ K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Search"
            className="cc-icon-button sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              onThemeChange(currentTheme === 'dark' ? 'light' : 'dark')
            }
            aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
            className="cc-icon-button"
          >
            {currentTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onAttention}
            aria-label={`${activeNotificationCount} item${
              activeNotificationCount === 1 ? '' : 's'
            } ${activeNotificationCount === 1 ? 'needs' : 'need'} attention`}
            title="Open items needing attention"
            className="cc-icon-button relative"
          >
            <Bell className="h-4 w-4" />
            {activeNotificationCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
            )}
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={currentRole !== 'DESIGN_LEAD'}
            title={
              currentRole === 'DESIGN_LEAD'
                ? 'Submit an event poster'
                : 'Switch to Design Lead to submit a poster'
            }
            className="cc-button-primary ml-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Submit poster</span>
          </button>
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--surface)]"
              aria-label="Open account menu"
              aria-expanded={accountOpen}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                {initials}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-11 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                <div className="border-b border-[var(--border)] px-2 py-2">
                  <p className="text-sm font-semibold">{currentUserName}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {roleLabels[currentRole]}
                  </p>
                </div>
                <div className="space-y-3 border-b border-[var(--border)] px-2 py-3">
                  <label className="cc-field">
                    <span>Demo role</span>
                    <select
                      aria-label="Demo role"
                      value={currentRole}
                      onChange={(event) =>
                        onRoleChange(event.target.value as UserRole)
                      }
                    >
                      <option value="DESIGN_LEAD">Design Lead</option>
                      <option value="PRESIDENT">Club President</option>
                      <option value="CLUB_HOD">Club HOD</option>
                      <option value="ADMIN">Campus Admin</option>
                    </select>
                  </label>
                  <label className="cc-field">
                    <span>Club</span>
                    <select
                      aria-label="Demo club"
                      value={currentClubId}
                      onChange={(event) => onClubChange(event.target.value)}
                    >
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-[11px] leading-4 text-[var(--muted-foreground)]">
                    Switch roles to verify each approval stage in the prototype.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetWorkspace();
                    setAccountOpen(false);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset demo workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
