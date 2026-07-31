import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Play,
} from 'lucide-react';

import type { Device, TelemetryEvent } from '../types';

interface TelemetryAnalyticsViewProps {
  telemetry: TelemetryEvent[];
  devices: Device[];
}

export function TelemetryAnalyticsView({
  telemetry,
  devices,
}: TelemetryAnalyticsViewProps) {
  const successful = telemetry.filter(
    (event) => event.result === 'PLAY_SUCCESS' || event.result === 'CACHE_HIT',
  );
  const online = devices.filter((device) => device.status === 'ONLINE').length;
  const uptime = devices.length ? (online / devices.length) * 100 : 0;
  const incidents = devices.filter((device) => device.status !== 'ONLINE');

  return (
    <div className="cc-page">
      <section>
        <p className="cc-eyebrow">Screen health</p>
        <h1 className="cc-page-title">Are the screens working?</h1>
        <p className="cc-page-description">
          See successful playback, uptime, and anything that needs attention.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="cc-insight-card">
          <Play className="h-4 w-4 text-[var(--accent)]" />
          <strong>{successful.length}</strong>
          <span>Verified content plays</span>
          <small>Latest activity window</small>
        </div>
        <div className="cc-insight-card">
          <Activity className="h-4 w-4 text-[var(--success)]" />
          <strong>{uptime.toFixed(1)}%</strong>
          <span>Screen uptime</span>
          <small>Target is 95% or better</small>
        </div>
        <div className="cc-insight-card">
          <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
          <strong>{incidents.length}</strong>
          <span>Open incidents</span>
          <small>{incidents.length ? 'Requires attention' : 'All resolved'}</small>
        </div>
        <div className="cc-insight-card">
          <Monitor className="h-4 w-4 text-[var(--foreground)]" />
          <strong>{online}</strong>
          <span>Active screens</span>
          <small>Of {devices.length} enrolled screens</small>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
        <section className="cc-panel">
          <div className="cc-panel-header">
            <div>
              <h2>Recent playback</h2>
              <p>Proof that scheduled content reached a screen.</p>
            </div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {telemetry.map((event) => (
              <article
                key={event.id}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_90px] sm:items-center"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium">{event.contentTitle}</h3>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                    {event.deviceName}
                  </p>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(event.timestamp).toLocaleString([], {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <span
                  className={`cc-status w-fit ${
                    event.result === 'PLAY_SUCCESS' || event.result === 'CACHE_HIT'
                      ? 'cc-status-success'
                      : 'cc-status-danger'
                  }`}
                >
                  {event.result === 'CACHE_HIT'
                    ? 'Played offline'
                    : event.result === 'PLAY_SUCCESS'
                      ? 'Played'
                      : 'Failed'}
                </span>
                <p className="text-xs text-[var(--muted-foreground)] sm:text-right">
                  {event.latencyMs} ms
                </p>
              </article>
            ))}
            {telemetry.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <Activity className="h-8 w-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
                <p className="text-sm font-semibold text-[var(--foreground)]">No Playback Telemetry Recorded</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Telemetry events will populate automatically as registered screens report playback status.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="cc-panel">
          <div className="cc-panel-header">
            <div>
              <h2>Incidents</h2>
              <p>Connectivity issues that may affect playback.</p>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {incidents.length ? (
              incidents.map((device) => (
                <article key={device.id} className="cc-attention-row">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--warning-soft)] text-[var(--warning)]">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <strong>{device.displayName}</strong>
                    <small>Screen check-in is delayed</small>
                  </span>
                </article>
              ))
            ) : (
              <div className="grid min-h-36 place-items-center text-center">
                <div>
                  <CheckCircle2 className="mx-auto h-6 w-6 text-[var(--success)]" />
                  <p className="mt-2 text-sm font-medium">No open incidents</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
