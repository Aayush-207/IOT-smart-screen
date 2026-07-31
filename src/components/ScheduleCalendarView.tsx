import { useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Pause,
  Play,
  Plus,
  Repeat2,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import type { ContentAsset, EventItem, ScheduleRule, UserRole } from '../types';
import { calculateProposedPosterDueDate, eventDisplayWindow } from '../workflow';

interface ScheduleCalendarViewProps {
  schedules: ScheduleRule[];
  contentList: ContentAsset[];
  events?: EventItem[];
  onAddSchedule: (schedule: ScheduleRule) => void;
  onUpdateSchedule: (id: string, status: ScheduleRule['status']) => void;
  currentRole: UserRole;
  currentUserName: string;
}

type Mode = 'now' | 'later' | 'repeat';

function toLocalDateTime(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function scheduleStatus(schedule: ScheduleRule): {
  label: string;
  className: string;
} {
  if (schedule.status === 'ACTIVE') {
    return { label: 'Live Now', className: 'cc-status-success' };
  }
  if (schedule.status === 'PAUSED') {
    return { label: 'Paused', className: 'cc-status-warning' };
  }
  if (schedule.status === 'CANCELLED' || schedule.status === 'EXPIRED') {
    return {
      label: schedule.status === 'CANCELLED' ? 'Cancelled' : 'Expired',
      className: 'cc-status-danger',
    };
  }
  return { label: 'Scheduled', className: 'cc-status-neutral' };
}

export function ScheduleCalendarView({
  schedules,
  contentList,
  events = [],
  onAddSchedule,
  onUpdateSchedule,
  currentRole,
  currentUserName,
}: ScheduleCalendarViewProps) {
  const approved = contentList.filter((content) => content.status === 'approved' || content.status === 'live');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ScheduleRule | null>(null);
  const [mode, setMode] = useState<Mode>('later');
  const [contentId, setContentId] = useState(approved[0]?.id ?? '');
  const [target, setTarget] = useState('All campus screens');
  const [startsAt, setStartsAt] = useState(() =>
    toLocalDateTime(new Date(Date.now() + 60 * 60_000)),
  );
  const [endsAt, setEndsAt] = useState(() =>
    toLocalDateTime(new Date(Date.now() + 5 * 60 * 60_000)),
  );
  const [calcEventDate, setCalcEventDate] = useState('2026-08-25');
  const [error, setError] = useState<string | null>(null);

  // Computed dates for deadline calculator
  const computedDueDate = calculateProposedPosterDueDate(calcEventDate);
  const computedWindow = eventDisplayWindow(calcEventDate);

  const openComposer = () => {
    const start = new Date(Date.now() + 60 * 60_000);
    setContentId(approved[0]?.id ?? '');
    setStartsAt(toLocalDateTime(start));
    setEndsAt(toLocalDateTime(new Date(start.getTime() + 4 * 60 * 60_000)));
    setMode('later');
    setError(null);
    setCreating(true);
  };

  const createSchedule = (event: React.FormEvent) => {
    event.preventDefault();
    const content = approved.find((item) => item.id === contentId);
    if (!content) {
      setError('Approve at least one content item before scheduling.');
      return;
    }

    const start = mode === 'now' ? new Date() : new Date(startsAt);
    const end =
      mode === 'now'
        ? new Date(Date.now() + 4 * 60 * 60_000)
        : new Date(endsAt);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setError('The end time must be after the start time.');
      return;
    }

    onAddSchedule({
      id: `sch_${Date.now()}`,
      organizationId: 'org_mit_adt',
      title: content.title,
      contentId,
      targetType: target === 'All campus screens' ? 'CAMPUS' : 'BUILDING',
      targetId:
        target === 'All campus screens'
          ? 'mit_adt_main'
          : target.toLowerCase().replace(/\s+/g, '_'),
      targetName: target,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      priority: 10,
      recurrenceRule: mode === 'repeat' ? 'FREQ=DAILY' : undefined,
      createdBy: currentUserName,
      status: mode === 'now' ? 'ACTIVE' : 'SCHEDULED',
    });
    setCreating(false);
  };

  return (
    <div className="cc-page space-y-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="cc-eyebrow">Synchronized Broadcast & Deadline Engine</p>
          <h1 className="cc-page-title">Display Schedules & Poster Cutoffs</h1>
          <p className="cc-page-description">
            Event-relative poster deadlines (28-day target), 21-day synchronized display windows, and 7-day hard cutoff rules.
          </p>
        </div>
        <button
          type="button"
          onClick={openComposer}
          disabled={approved.length === 0 || currentRole !== 'ADMIN'}
          className="cc-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Broadcast
        </button>
      </section>

      {/* Deadline Visibility Dashboard & Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Event Design Deadline Visibility List */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Event Design Deadline Tracking ({events.length})</span>
            <span className="text-xs text-indigo-400 font-normal">Section 3 Step 2a</span>
          </h2>

          <div className="space-y-3">
            {events.map((evt) => {
              const eventDateObj = new Date(evt.eventDate);
              const todayObj = new Date();
              const daysUntilEvent = Math.ceil((eventDateObj.getTime() - todayObj.getTime()) / 86400000);
              const daysUntilDue = Math.ceil((new Date(evt.posterDueAt).getTime() - todayObj.getTime()) / 86400000);

              let statusBadge = (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  On Track
                </span>
              );

              if (evt.status === 'poster_delayed') {
                statusBadge = (
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Delayed
                  </span>
                );
              } else if (daysUntilEvent <= 7 && evt.status !== 'approved') {
                statusBadge = (
                  <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-bold">
                    Ineligible (Cutoff Passed)
                  </span>
                );
              }

              return (
                <div key={evt.id} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">{evt.clubName}</span>
                        {statusBadge}
                      </div>
                      <h3 className="font-bold text-white text-base mt-0.5">{evt.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Venue: <span className="text-slate-200">{evt.venue}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-right shrink-0">
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Event Date</span>
                        <strong className="text-white font-mono">{evt.eventDate}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Poster Due Date</span>
                        <strong className="text-indigo-300 font-mono">{evt.posterDueAt}</strong>
                      </div>
                    </div>
                  </div>

                  {evt.dueDateReason && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      <strong>Delay Reason Logged:</strong> {evt.dueDateReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Event-Relative Deadline Calculator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Deadline Calculator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Compute event-relative dates dynamically based on section rules.
          </p>

          <label className="cc-field">
            <span>Select Event Date</span>
            <input
              type="date"
              value={calcEventDate}
              onChange={(e) => setCalcEventDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            />
          </label>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Poster Due Date (E - 28d)</span>
                <strong className="text-indigo-400 font-mono text-sm">{computedDueDate}</strong>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Recommended target for first submission</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Broadcast Start (E - 21d)</span>
                <strong className="text-emerald-400 font-mono text-sm">{computedWindow.plannedStart}</strong>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">21-day campus-wide synchronized rotation</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Hard Cutoff (E - 7d)</span>
                <strong className="text-rose-400 font-mono text-sm">{computedWindow.hardCutoffDate}</strong>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Submissions after this are marked INELIGIBLE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast List */}
      <section className="cc-panel">
        <div className="cc-panel-header">
          <div>
            <h2>Upcoming and Live Broadcasts</h2>
            <p>Synchronized playlist schedules across campus displays.</p>
          </div>
          <span className="cc-status cc-status-success">
            {schedules.filter((schedule) => schedule.status === 'ACTIVE').length} Live
          </span>
        </div>
        {schedules.length ? (
          <div className="divide-y divide-[var(--border)]">
            {schedules
              .slice()
              .sort(
                (left, right) =>
                  new Date(left.startTime).getTime() -
                  new Date(right.startTime).getTime(),
              )
              .map((schedule) => {
                const content = contentList.find(
                  (item) => item.id === schedule.contentId,
                );
                const starts = new Date(schedule.startTime);
                const ends = new Date(schedule.endTime);
                const presentation = scheduleStatus(schedule);
                return (
                  <button
                    type="button"
                    key={schedule.id}
                    onClick={() => setSelected(schedule)}
                    className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[var(--surface-raised)] sm:grid-cols-[64px_minmax(0,1fr)_170px_110px_20px] sm:items-center"
                  >
                    <img
                      src={content?.mediaUrl}
                      alt=""
                      className="h-11 w-16 rounded-lg bg-[var(--surface-raised)] object-cover"
                    />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-white">
                        {content?.title ?? schedule.title}
                      </strong>
                      <small className="mt-1 block truncate text-xs text-[var(--muted-foreground)]">
                        {schedule.targetName}
                        {schedule.recurrenceRule ? ' · Repeats daily' : ''}
                      </small>
                    </span>
                    <span className="text-xs">
                      <strong className="block font-medium text-white">
                        {starts.toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        ·{' '}
                        {starts.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                      <small className="mt-1 block text-[var(--muted-foreground)]">
                        Until{' '}
                        {ends.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </span>
                    <span className={`cc-status w-fit ${presentation.className}`}>
                      {presentation.label}
                    </span>
                    <ChevronRight className="hidden h-4 w-4 text-[var(--muted-foreground)] sm:block" />
                  </button>
                );
              })}
          </div>
        ) : (
          <div className="cc-empty-state m-4 min-h-48">
            <CalendarDays className="h-7 w-7" />
            <h2>No broadcasts scheduled</h2>
            <p>Approved posters automatically populate the 21-day manifest.</p>
          </div>
        )}
      </section>

      {creating && (
        <div
          className="cc-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Add broadcast"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreating(false);
          }}
        >
          <form onSubmit={createSchedule} className="cc-dialog max-w-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="cc-eyebrow">New Broadcast</p>
                <h2 className="text-xl font-semibold">Choose Play Window</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="cc-icon-button"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ['now', Send, 'Now'],
                ['later', Clock3, 'Later'],
                ['repeat', Repeat2, 'Repeat'],
              ].map(([id, Icon, label]) => (
                <button
                  key={id as string}
                  type="button"
                  onClick={() => {
                    setMode(id as Mode);
                    setError(null);
                  }}
                  className={`cc-choice flex-col py-3 ${mode === id ? 'active' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {label as string}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <label className="cc-field">
                <span>Content Poster</span>
                <select
                  required
                  value={contentId}
                  onChange={(event) => {
                    setContentId(event.target.value);
                    setError(null);
                  }}
                >
                  {approved.map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.title}
                    </option>
                  ))}
                </select>
              </label>

              {mode !== 'now' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="cc-field">
                    <span>{mode === 'repeat' ? 'First Run' : 'Starts'}</span>
                    <input
                      type="datetime-local"
                      required
                      min={toLocalDateTime(new Date())}
                      value={startsAt}
                      onChange={(event) => {
                        setStartsAt(event.target.value);
                        setError(null);
                      }}
                    />
                  </label>
                  <label className="cc-field">
                    <span>Ends</span>
                    <input
                      type="datetime-local"
                      required
                      min={startsAt}
                      value={endsAt}
                      onChange={(event) => {
                        setEndsAt(event.target.value);
                        setError(null);
                      }}
                    />
                  </label>
                </div>
              )}

              {error && (
                <p role="alert" className="cc-form-error">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="cc-button-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="cc-button-primary">
                {mode === 'now' ? 'Publish Now' : 'Save Broadcast'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
