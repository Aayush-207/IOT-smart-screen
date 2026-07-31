import {
  ArrowRight,
  CalendarClock,
  Check,
  AlertCircle,
  Clock3,
  Monitor,
  Play,
  Plus,
} from 'lucide-react';

import type { ContentAsset, Device, ScheduleRule, TelemetryEvent } from '../types';
import { roleLabels, statusLabels } from '../workflow';
import type { ViewTab } from './Sidebar';

interface OverviewViewProps {
  devices: Device[];
  contentList: ContentAsset[];
  schedules: ScheduleRule[];
  telemetry: TelemetryEvent[];
  onOpenKioskSim: (deviceId?: string) => void;
  onNavigateTab: (tab: ViewTab) => void;
  onCreateContent: () => void;
  currentUserName: string;
  canCreateContent: boolean;
}

function timeAgo(value: string): string {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1_000);
  if (seconds < 0) return 'a few minutes ago';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export function OverviewView({
  devices,
  contentList,
  schedules,
  telemetry,
  onOpenKioskSim,
  onNavigateTab,
  onCreateContent,
  currentUserName,
  canCreateContent,
}: OverviewViewProps) {
  const online = devices.filter((device) => device.status === 'ONLINE');
  const attention = devices.filter((device) => device.status !== 'ONLINE');
  const pending = contentList.filter(
    (content) => content.status.startsWith('pending_') || content.status === 'escalated_admin',
  );
  const activeSchedules = schedules.filter(
    (schedule) => schedule.status === 'ACTIVE',
  );
  const recentPlays = telemetry.filter((event) => event.result === 'PLAY_SUCCESS');
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening';
  const summary =
    attention.length === 0 && pending.length === 0
      ? 'Every screen is online and there are no pending approvals.'
      : `${attention.length} screen${attention.length === 1 ? '' : 's'} and ${pending.length} approval${pending.length === 1 ? '' : 's'} need attention.`;

  return (
    <div className="cc-page space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="cc-eyebrow">
            {now.toLocaleDateString([], {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="cc-page-title text-white">
            {greeting}, {currentUserName.split(' ')[0]}
          </h1>
          <p className="cc-page-description">
            {summary}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateContent}
          disabled={!canCreateContent}
          className="cc-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Submit Poster
        </button>
      </section>

      <section aria-label="Network summary" className="cc-summary-grid">
        <button
          type="button"
          onClick={() => onNavigateTab('devices')}
          className="cc-summary-item text-left"
        >
          <span className="cc-summary-icon bg-emerald-500/20 text-emerald-400">
            <Monitor className="h-5 w-5" />
          </span>
          <span>
            <strong className="text-white">{online.length} of {devices.length}</strong>
            <small>Screens Online</small>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('content')}
          className="cc-summary-item text-left"
        >
          <span className="cc-summary-icon bg-amber-500/20 text-amber-400">
            <Clock3 className="h-5 w-5" />
          </span>
          <span>
            <strong className="text-white">{pending.length}</strong>
            <small>Waiting for Approval</small>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('schedules')}
          className="cc-summary-item text-left"
        >
          <span className="cc-summary-icon bg-indigo-500/20 text-indigo-400">
            <CalendarClock className="h-5 w-5" />
          </span>
          <span>
            <strong className="text-white">{activeSchedules.length}</strong>
            <small>Broadcasts Running</small>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('insights')}
          className="cc-summary-item text-left"
        >
          <span className="cc-summary-icon bg-slate-800 text-slate-300">
            <Play className="h-5 w-5" />
          </span>
          <span>
            <strong className="text-white">{recentPlays.length}</strong>
            <small>Recent Successful Plays</small>
          </span>
        </button>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <section className="cc-panel">
          <div className="cc-panel-header">
            <div>
              <h2 className="text-white">Playing Now Across Campus</h2>
              <p>Active content rendering on smart screen kiosks.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('devices')}
              className="cc-text-button"
            >
              All Screens <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {devices.length ? (
              devices.map((device) => {
                const content = contentList.find(
                  (item) => item.id === device.activeContentId,
                );
                return (
                  <button
                    type="button"
                    key={device.id}
                    onClick={() => onOpenKioskSim(device.id)}
                    className="group grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-raised)] sm:grid-cols-[72px_minmax(0,1fr)_140px_auto]"
                  >
                    <img
                      src={
                        content?.mediaUrl ??
                        'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80'
                      }
                      alt=""
                      className="h-10 w-14 rounded-md bg-[var(--surface-raised)] object-cover sm:h-12 sm:w-[72px]"
                    />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-medium text-white">
                        {content?.title ?? 'HackMIT 2026 AI Innovation Sprint'}
                      </strong>
                      <small className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                        {device.displayName}
                      </small>
                    </span>
                    <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">
                      {device.location.building}
                    </span>
                    <span
                      className={`cc-status ${
                        device.status === 'ONLINE'
                          ? 'cc-status-success'
                          : 'cc-status-warning'
                      }`}
                    >
                      {device.status === 'ONLINE' ? 'Live' : 'Check'}
                    </span>
                  </button>
                );
              })
            ) : null}
          </div>
        </section>

        <section className="cc-panel">
          <div className="cc-panel-header">
            <div>
              <h2 className="text-white">Needs Attention</h2>
              <p>Actionable approvals and device alerts.</p>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {pending.map((content) => (
              <button
                type="button"
                key={content.id}
                onClick={() => onNavigateTab('content')}
                className="cc-attention-row"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Clock3 className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="text-white">Review "{content.title}"</strong>
                  <small className="text-slate-400 block">
                    {statusLabels[content.status] || content.status}
                  </small>
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
            ))}
            {attention.length === 0 && pending.length === 0 && (
              <div className="grid min-h-36 place-items-center text-center">
                <div>
                  <Check className="mx-auto h-6 w-6 text-emerald-400" />
                  <p className="mt-2 text-sm font-medium text-white">Everything is operating normally</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    No pending approvals or offline screens.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
