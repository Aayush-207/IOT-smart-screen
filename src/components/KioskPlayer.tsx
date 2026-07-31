import { useEffect, useState } from 'react';
import { Monitor, Wifi, WifiOff } from 'lucide-react';

import type { CompiledManifest, Device } from '../types';

interface KioskPlayerProps {
  deviceId: string;
}

interface CachedPlayerState {
  device: Device;
  manifest: CompiledManifest;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=85';

export function KioskPlayer({ deviceId }: KioskPlayerProps) {
  const cacheKey = `campuscast-player-${deviceId}`;
  const [state, setState] = useState<CachedPlayerState | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(cacheKey) ?? 'null') as CachedPlayerState | null;
    } catch {
      return null;
    }
  });
  const [online, setOnline] = useState(navigator.onLine);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    void navigator.serviceWorker?.register('/sw.js');
    const updateNetwork = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    const synchronize = async () => {
      try {
        const [bootstrapResponse, manifestResponse] = await Promise.all([
          fetch('/v1/bootstrap'),
          fetch(`/v1/manifests/${encodeURIComponent(deviceId)}`),
        ]);
        if (!bootstrapResponse.ok || !manifestResponse.ok) return;
        const bootstrap = (await bootstrapResponse.json()) as { devices: Device[] };
        const device = bootstrap.devices.find((item) => item.id === deviceId);
        if (!device || stopped) return;
        const manifest = (await manifestResponse.json()) as CompiledManifest;
        const next = { device, manifest };
        setState(next);
        localStorage.setItem(cacheKey, JSON.stringify(next));
        await fetch(`/v1/devices/${encodeURIComponent(deviceId)}/heartbeat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            appVersion: device.appVersion,
            storageUsagePct: device.storageUsagePct,
            temperatureC: device.temperatureC,
          }),
        });
      } catch {
        setOnline(false);
      }
    };
    void synchronize();
    const timer = window.setInterval(synchronize, 60_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [cacheKey, deviceId]);

  const playlist = state?.manifest.playlist ?? [];
  const item = playlist[index % Math.max(playlist.length, 1)];

  useEffect(() => {
    if (!item) return;
    const started = performance.now();
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % Math.max(playlist.length, 1));
      void fetch(`/v1/devices/${encodeURIComponent(deviceId)}/playback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contentId: item.contentId,
          result: navigator.onLine ? 'PLAY_SUCCESS' : 'CACHE_HIT',
          latencyMs: Math.round(performance.now() - started),
        }),
      }).catch(() => undefined);
    }, Math.max(item.durationSeconds, 5) * 1_000);
    return () => window.clearTimeout(timer);
  }, [deviceId, item, playlist.length]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07111f] text-white">
      <img
        src={item?.mediaUrl ?? state?.manifest.fallbackSlate.mediaUrl ?? fallbackImage}
        alt={item?.title ?? 'Campus welcome screen'}
        onError={(event) => {
          event.currentTarget.src = fallbackImage;
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      <header className="absolute inset-x-0 top-0 flex items-center justify-between p-5 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <Monitor className="h-5 w-5" />
          CampusCast
        </span>
        <span className={`flex items-center gap-2 ${online ? 'text-emerald-300' : 'text-amber-300'}`}>
          {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {online ? 'Connected' : 'Playing offline cache'}
        </span>
      </header>
      <footer className="absolute inset-x-0 bottom-0 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/70">
          {state?.device.displayName ?? deviceId}
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">
          {item?.title ?? 'Campus information'}
        </h1>
      </footer>
    </main>
  );
}
