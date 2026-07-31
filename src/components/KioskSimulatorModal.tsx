import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  HardDrive,
  Lock,
  Radio,
  RotateCcw,
  ShieldCheck,
  Thermometer,
  Tv,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';

import type { ContentAsset, Device } from '../types';

interface KioskSimulatorModalProps {
  device: Device;
  contentList: ContentAsset[];
  onClose: () => void;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=85';

export function KioskSimulatorModal({
  device,
  contentList,
  onClose,
}: KioskSimulatorModalProps) {
  const normalContent = useMemo(
    () =>
      contentList.find((content) => content.id === device.activeContentId) ??
      contentList.find(
        (content) =>
          (content.status === 'approved' || content.status === 'live') && content.category !== 'EMERGENCY',
      ),
    [contentList, device.activeContentId],
  );
  const emergencyContent = contentList.find(
    (content) =>
      (content.status === 'approved' || content.status === 'live') && content.category === 'EMERGENCY',
  );
  const [isOnline, setIsOnline] = useState(device.status === 'ONLINE');
  const [isEmergencyActive, setIsEmergencyActive] = useState(
    normalContent?.category === 'EMERGENCY',
  );
  const [heartbeatSeconds, setHeartbeatSeconds] = useState(60);
  const [telemetryMessage, setTelemetryMessage] = useState<string | null>(null);
  const currentContent =
    isEmergencyActive && emergencyContent ? emergencyContent : normalContent;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeartbeatSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        if (isOnline) {
          setTelemetryMessage('Simulated heartbeat delivered');
          window.setTimeout(() => setTelemetryMessage(null), 2_500);
        }
        return 60;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [isOnline]);

  const sendHeartbeat = () => {
    setHeartbeatSeconds(60);
    setTelemetryMessage(
      isOnline
        ? 'Manual heartbeat delivered'
        : 'Heartbeat queued until the network returns',
    );
    window.setTimeout(() => setTelemetryMessage(null), 2_500);
  };

  return (
    <div
      className="cc-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${device.displayName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cc-dialog w-full max-w-5xl p-0">
        <header className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
              <Tv className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-semibold text-white">
                {device.displayName}
              </strong>
              <small className="block truncate text-xs text-[var(--muted-foreground)]">
                {device.thingName} · {device.location.locationName}
              </small>
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOnline((online) => !online)}
              className="cc-button-secondary"
            >
              {isOnline ? (
                <>
                  <WifiOff className="h-4 w-4" />
                  Go Offline
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  Restore Network
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cc-icon-button"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-black">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black px-3 py-2 text-[11px] text-white">
              <span
                className={`flex items-center gap-2 font-semibold ${
                  isOnline ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {isOnline ? 'Connected (Synchronized)' : 'Offline Cache Active'}
              </span>
              <span className="flex flex-wrap items-center gap-3 text-white/70">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {device.storageUsagePct}% used
                </span>
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  {device.temperatureC}°C
                </span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <Lock className="h-3 w-3" />
                  Kiosk locked
                </span>
              </span>
            </div>

            <div className="relative aspect-video min-h-56 bg-black">
              <img
                key={currentContent?.id}
                src={currentContent?.mediaUrl ?? fallbackImage}
                alt={currentContent?.title ?? 'Campus welcome screen'}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
                className="h-full w-full object-cover"
              />
              {isEmergencyActive && (
                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-red-600 px-4 py-2 text-xs font-bold text-white">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Emergency campus override
                  </span>
                  <span className="hidden text-[10px] sm:block">
                    Priority 100
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 bg-black px-3 py-2 text-xs text-white sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 truncate">
                <span className="text-white/60">Playing: </span>
                <strong>{currentContent?.title ?? 'Campus welcome screen'}</strong>
              </span>
              <span className="text-[11px] text-white/65">
                {telemetryMessage ??
                  (isOnline
                    ? `Next heartbeat in ${heartbeatSeconds}s`
                    : 'Playback continues from local cache')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
