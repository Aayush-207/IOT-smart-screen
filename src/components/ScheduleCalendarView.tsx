import { useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Pause,
  Play,
  Plus,
  Repeat2,
  Send,
  Trash2,
  X,
} from 'lucide-react';

import type { ContentAsset, ScheduleRule, UserRole } from '../types';

interface ScheduleCalendarViewProps {
  schedules: ScheduleRule[];
  contentList: ContentAsset[];
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
    return { label: 'Live now', className: 'cc-status-success' };
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
  onAddSchedule,
  onUpdateSchedule,
  currentRole,
  currentUserName,
}: ScheduleCalendarViewProps) {
  const approved = contentList.filter((content) => content.status === 'APPROVED');
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
  const [error, setError] = useState<string | null>(null);

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
    if (mode !== 'now' && start.getTime() <= Date.now()) {
      setError('Choose a future start time.');
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
    <div className="cc-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="cc-eyebrow">Schedule</p>
          <h1 className="cc-page-title">What plays, and when</h1>
          <p className="cc-page-description">
            Approved event posters are scheduled automatically from 21 days
            before the event.
          </p>
        </div>
        <button
          type="button"
          onClick={openComposer}
          disabled={approved.length === 0 || currentRole !== 'ADMIN'}
          title={
            currentRole === 'ADMIN'
              ? 'Create a manual campus broadcast'
              : 'Only the Campus Admin can create manual broadcasts'
          }
          className="cc-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add broadcast
        </button>
      </section>

      {approved.length === 0 && (
        <p role="status" className="cc-form-error">
          Approve a content item before creating a broadcast.
        </p>
      )}

      <section className="cc-panel">
        <div className="cc-panel-header">
          <div>
            <h2>Upcoming and live</h2>
            <p>All times use your browser timezone.</p>
          </div>
          <span className="cc-status cc-status-success">
            {schedules.filter((schedule) => schedule.status === 'ACTIVE').length} live
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
                      <strong className="block truncate text-sm font-semibold">
                        {content?.title ?? schedule.title}
                      </strong>
                      <small className="mt-1 block truncate text-xs text-[var(--muted-foreground)]">
                        {schedule.targetName}
                        {schedule.recurrenceRule ? ' · Repeats daily' : ''}
                      </small>
                    </span>
                    <span className="text-xs">
                      <strong className="block font-medium">
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
            <h2>No broadcasts yet</h2>
            <p>Publish approved content now or schedule it for later.</p>
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
                <p className="cc-eyebrow">New broadcast</p>
                <h2 className="text-xl font-semibold">Choose when it should play</h2>
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
                <span>Content</span>
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
              <label className="cc-field">
                <span>Screens</span>
                <select
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                >
                  <option value="All campus screens">All campus screens</option>
                  <option value="Specific Screen">Specific Screen / Group</option>
                </select>
              </label>
              {mode !== 'now' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="cc-field">
                    <span>{mode === 'repeat' ? 'First run' : 'Starts'}</span>
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
              {mode === 'repeat' && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                    Repeats every day
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    This broadcast repeats daily during the selected time window.
                  </p>
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
                {mode === 'now' ? 'Publish now' : 'Save broadcast'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div
          className="cc-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Broadcast details"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className="cc-dialog max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`cc-status ${scheduleStatus(selected).className}`}
                >
                  {scheduleStatus(selected).label}
                </span>
                <h2 className="mt-3 text-xl font-semibold">{selected.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {selected.targetName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="cc-icon-button"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--surface-raised)] p-3">
                <dt className="text-xs text-[var(--muted-foreground)]">Starts</dt>
                <dd className="mt-1 text-sm font-medium">
                  {new Date(selected.startTime).toLocaleString()}
                </dd>
              </div>
              <div className="rounded-xl bg-[var(--surface-raised)] p-3">
                <dt className="text-xs text-[var(--muted-foreground)]">Ends</dt>
                <dd className="mt-1 text-sm font-medium">
                  {new Date(selected.endTime).toLocaleString()}
                </dd>
              </div>
            </dl>
            {currentRole === 'ADMIN' &&
              !['CANCELLED', 'EXPIRED'].includes(selected.status) && (
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const status =
                      selected.status === 'PAUSED'
                        ? new Date(selected.startTime) <= new Date() &&
                          new Date(selected.endTime) > new Date()
                          ? 'ACTIVE'
                          : 'SCHEDULED'
                        : 'PAUSED';
                    onUpdateSchedule(selected.id, status);
                    setSelected({ ...selected, status });
                  }}
                  className="cc-button-secondary"
                >
                  {selected.status === 'PAUSED' ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  {selected.status === 'PAUSED' ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSchedule(selected.id, 'CANCELLED');
                    setSelected(null);
                  }}
                  className="cc-button-secondary text-[var(--danger)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel broadcast
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
