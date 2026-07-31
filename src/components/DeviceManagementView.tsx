import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  HardDrive,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';

import type { ContentAsset, Device } from '../types';

interface DeviceManagementViewProps {
  devices: Device[];
  contentList: ContentAsset[];
  onOpenKioskSim: (deviceId: string) => void;
  onRestartDevice: (deviceId: string) => void;
  onAddDevice: (device: Device) => void;
  onDeleteDevice?: (deviceId: string) => void;
}

function lastSeen(value: string): string {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 0) return 'A few minutes ago';
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
}

export function DeviceManagementView({
  devices,
  contentList,
  onOpenKioskSim,
  onRestartDevice,
  onAddDevice,
  onDeleteDevice,
}: DeviceManagementViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | Device['status']>('ALL');
  const [selected, setSelected] = useState<Device | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // New screen form state
  const [displayName, setDisplayName] = useState('');
  const [building, setBuilding] = useState('Tech Block A');
  const [floor, setFloor] = useState('Floor 1');
  const [zone, setZone] = useState('Main Foyer');
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');
  const [ipAddress, setIpAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setSelected(
      devices.find((device) => device.id === selected.id) ?? null,
    );
  }, [devices, selected?.id]);

  const visible = useMemo(
    () =>
      devices.filter((device) => {
        const query = search.trim().toLowerCase();
        return (
          (status === 'ALL' || device.status === status) &&
          (!query ||
            device.displayName.toLowerCase().includes(query) ||
            device.location.building.toLowerCase().includes(query))
        );
      }),
    [devices, search, status],
  );

  const online = devices.filter((device) => device.status === 'ONLINE').length;
  const storageAverage = devices.length
    ? Math.round(
        devices.reduce((sum, device) => sum + device.storageUsagePct, 0) / devices.length,
      )
    : 0;

  const runRestart = (device: Device) => {
    onRestartDevice(device.id);
    setMessage(`Restart requested for ${device.displayName}.`);
    window.setTimeout(() => setMessage(null), 3_000);
  };

  const handleRegisterScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFormError('Screen display name is required.');
      return;
    }

    const cleanName = displayName.trim();
    const cleanBuilding = building.trim() || 'Tech Block A';
    const cleanFloor = floor.trim() || 'Floor 1';
    const cleanZone = zone.trim() || 'Main Foyer';

    const newDevice: Device = {
      id: `dev_${Date.now()}`,
      organizationId: 'org_mit_adt',
      thingName: `mit_adt_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      displayName: cleanName,
      location: {
        campus: 'MIT ADT University',
        building: cleanBuilding,
        floor: cleanFloor,
        zone: cleanZone,
        locationName: `${cleanName} Wall Mount`,
      },
      ipAddress:
        ipAddress.trim() ||
        `10.20.${Math.floor(Math.random() * 15 + 1)}.${Math.floor(
          Math.random() * 200 + 10,
        )}`,
      macAddress: `B8:27:EB:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(
        Math.random() * 89 + 10,
      )}:${Math.floor(Math.random() * 89 + 10)}`,
      certificateArn: `arn:aws:iot:ap-south-1:123456789012:cert/${Math.random()
        .toString(36)
        .substring(2, 10)}`,
      status: 'ONLINE',
      lastHeartbeatAt: new Date().toISOString(),
      currentManifestVersion: 'v1.0.0',
      appVersion: 'v2.1.0-kiosk',
      storageUsagePct: 12,
      temperatureC: 38,
      orientation,
      isKioskLocked: true,
    };

    onAddDevice(newDevice);
    setCreating(false);
    setDisplayName('');
    setIpAddress('');
    setFormError(null);
    setMessage(`Screen "${cleanName}" registered successfully!`);
    window.setTimeout(() => setMessage(null), 3_000);
  };

  return (
    <div className="cc-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="cc-eyebrow">Screens</p>
          <h1 className="cc-page-title">Campus screens</h1>
          <p className="cc-page-description">
            Register hardware screens, monitor connection health, and send updates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setCreating(true);
          }}
          className="cc-button-primary"
        >
          <Plus className="h-4 w-4" />
          Register screen
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="cc-metric">
          <Wifi className="h-4 w-4 text-[var(--success)]" />
          <strong>{online}/{devices.length}</strong>
          <span>Online now</span>
        </div>
        <div className="cc-metric">
          <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
          <strong>{devices.length - online}</strong>
          <span>Need attention</span>
        </div>
        <div className="cc-metric">
          <HardDrive className="h-4 w-4 text-[var(--accent)]" />
          <strong>{storageAverage}%</strong>
          <span>Average storage used</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="cc-search-field max-w-sm">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search screens</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search screens or buildings"
          />
        </label>
        <select
          aria-label="Filter by screen status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as 'ALL' | Device['status'])
          }
          className="cc-select sm:w-44"
        >
          <option value="ALL">All screens</option>
          <option value="ONLINE">Online</option>
          <option value="STALE">Needs attention</option>
          <option value="OFFLINE">Offline</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </section>

      <section className="cc-panel overflow-hidden">
        <div className="hidden grid-cols-[minmax(240px,1.4fr)_minmax(160px,1fr)_130px_120px_130px] gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] lg:grid">
          <span>Screen</span>
          <span>Currently playing</span>
          <span>Last check-in</span>
          <span>Storage</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {visible.map((device) => (
            <article
              key={device.id}
              className="grid gap-3 px-4 py-4 transition hover:bg-[var(--surface-raised)] lg:grid-cols-[minmax(240px,1.4fr)_minmax(160px,1fr)_130px_120px_130px] lg:items-center"
            >
              <button
                type="button"
                onClick={() => setSelected(device)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-raised)]">
                  <Monitor className="h-4 w-4 text-[var(--muted-foreground)]" />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-medium">
                    {device.displayName}
                  </strong>
                  <small className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                    {device.location.building} · {device.location.zone}
                  </small>
                </span>
              </button>
              <div className="text-sm">
                <p className="truncate font-medium">
                  {contentList.find(
                    (content) => content.id === device.activeContentId,
                  )?.title ?? 'Campus welcome screen'}
                </p>
                <span
                  className={`cc-status mt-1 ${
                    device.status === 'ONLINE'
                      ? 'cc-status-success'
                      : 'cc-status-warning'
                  }`}
                >
                  {device.status === 'ONLINE' ? 'Online' : 'Check connection'}
                </span>
              </div>
              <div className="text-xs">
                <p className="font-medium">{lastSeen(device.lastHeartbeatAt)}</p>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  App {device.appVersion.replace('-kiosk', '')}
                </p>
              </div>
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                  <span
                    className="block h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${device.storageUsagePct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  {device.storageUsagePct}% used
                </p>
              </div>
              <div className="flex justify-start gap-1 lg:justify-end">
                <button
                  type="button"
                  onClick={() => onOpenKioskSim(device.id)}
                  className="cc-icon-button"
                  aria-label={`Preview ${device.displayName}`}
                  title="Preview screen"
                >
                  <Play className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => runRestart(device)}
                  className="cc-icon-button"
                  aria-label={`Restart ${device.displayName}`}
                  title="Restart app"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {onDeleteDevice && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteDevice(device.id);
                      setMessage(`Removed ${device.displayName}`);
                      window.setTimeout(() => setMessage(null), 3_000);
                    }}
                    className="cc-icon-button text-[var(--danger)]"
                    aria-label={`Delete ${device.displayName}`}
                    title="Delete screen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="cc-empty-state m-4 min-h-48">
              <Monitor className="h-7 w-7" />
              <h2>{devices.length === 0 ? 'No screens registered' : 'No matching screens found'}</h2>
              <p>
                {devices.length === 0
                  ? 'Click "Register screen" above to pair your first digital signage screen.'
                  : 'Try adjusting your search query or status filter.'}
              </p>
              {devices.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setCreating(true);
                  }}
                  className="cc-button-primary mt-3"
                >
                  <Plus className="h-4 w-4" />
                  Register screen
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Register Screen Modal */}
      {creating && (
        <div
          className="cc-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Register new screen"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreating(false);
          }}
        >
          <form onSubmit={handleRegisterScreen} className="cc-dialog max-w-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="cc-eyebrow">New screen hardware</p>
                <h2 className="text-xl font-semibold">Register display screen</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Add an IoT smart screen device to receive scheduled broadcasts.
                </p>
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

            <div className="mt-5 space-y-4">
              <label className="cc-field">
                <span>Display Name</span>
                <input
                  required
                  placeholder="e.g. Main Lobby Display Screen"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setFormError(null);
                  }}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="cc-field">
                  <span>Building / Block</span>
                  <input
                    required
                    placeholder="e.g. Tech Block A"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                  />
                </label>
                <label className="cc-field">
                  <span>Floor & Zone</span>
                  <input
                    required
                    placeholder="e.g. Floor 1 · Central Foyer"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="cc-field">
                  <span>Screen Orientation</span>
                  <select
                    value={orientation}
                    onChange={(e) =>
                      setOrientation(e.target.value as 'LANDSCAPE' | 'PORTRAIT')
                    }
                  >
                    <option value="LANDSCAPE">Landscape (16:9)</option>
                    <option value="PORTRAIT">Portrait (9:16)</option>
                  </select>
                </label>

                <label className="cc-field">
                  <span>IP Address <small>(Optional)</small></span>
                  <input
                    placeholder="e.g. 10.20.4.101"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                  />
                </label>
              </div>

              {formError && <p className="cc-form-error">{formError}</p>}
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
                <Plus className="h-4 w-4" />
                Register screen
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="cc-overlay" role="dialog" aria-modal="true" aria-label="Screen details">
          <div className="cc-dialog max-w-lg">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`cc-status ${
                    selected.status === 'ONLINE'
                      ? 'cc-status-success'
                      : 'cc-status-warning'
                  }`}
                >
                  {selected.status === 'ONLINE' ? 'Online' : 'Needs attention'}
                </span>
                <h2 className="mt-3 text-xl font-semibold">{selected.displayName}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {selected.location.building} · {selected.location.locationName}
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
            <dl className="mt-6 grid grid-cols-2 gap-3">
              {[
                ['Last check-in', lastSeen(selected.lastHeartbeatAt)],
                [
                  'Current content',
                  contentList.find(
                    (content) => content.id === selected.activeContentId,
                  )?.title ?? 'Campus welcome screen',
                ],
                ['Storage used', `${selected.storageUsagePct}%`],
                ['App version', selected.appVersion.replace('-kiosk', '')],
                ['Orientation', selected.orientation.toLowerCase()],
                ['Screen mode', selected.isKioskLocked ? 'Locked' : 'Unlocked'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3"
                >
                  <dt className="text-xs text-[var(--muted-foreground)]">{label}</dt>
                  <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              {onDeleteDevice && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteDevice(selected.id);
                    setSelected(null);
                  }}
                  className="cc-button-secondary text-[var(--danger)] mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete screen
                </button>
              )}
              <button
                type="button"
                onClick={() => runRestart(selected)}
                className="cc-button-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                Restart app
              </button>
              <button
                type="button"
                onClick={() => onOpenKioskSim(selected.id)}
                className="cc-button-primary"
              >
                <Play className="h-4 w-4" />
                Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div role="status" className="cc-toast">
          <CheckIcon />
          {message}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
      <RefreshCw className="h-3 w-3" />
    </span>
  );
}
