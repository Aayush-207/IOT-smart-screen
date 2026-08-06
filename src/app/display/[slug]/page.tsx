'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface ManifestItem {
  posterId: string;
  title: string;
  url: string;
  sha256: string;
  durationSeconds: number;
  activeFrom?: string | null;
  activeUntil?: string | null;
}

interface CommandItem {
  commandId: string;
  command: string;
  params?: any;
  expiresAt: string;
}

interface PlaybackEvent {
  eventId: string;
  posterId: string;
  playlistVersion: number;
  startedAt: string;
  completedAt: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  failureReason?: string | null;
}

export default function DisplayScreenPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [playlistVersion, setPlaylistVersion] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fade, setFade] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Queue of local playback events waiting to be reported to server
  const pendingEventsRef = useRef<PlaybackEvent[]>([]);
  const pendingResultsRef = useRef<{ commandId: string; status: string; errorMessage?: string }[]>([]);

  const manifestRef = useRef<ManifestItem[]>([]);
  manifestRef.current = manifest;

  const playlistVersionRef = useRef<number>(playlistVersion);
  playlistVersionRef.current = playlistVersion;

  const currentPosterRef = useRef<{ posterId: string; startedAt: Date } | null>(null);

  // Synchronize telemetry, manifest, playback events, & commands with server
  useEffect(() => {
    if (!slug) return;

    const syncScreen = async () => {
      try {
        const eventsToSend = [...pendingEventsRef.current];
        const resultsToSend = [...pendingResultsRef.current];

        const res = await fetch(`/api/v1/screens/${slug}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistVersion: playlistVersionRef.current,
            kioskVersion: 'v1.0-iot',
            freeStorageMb: 4096,
            playbackEvents: eventsToSend,
            commandResults: resultsToSend,
          }),
        });

        if (!res.ok) {
          if (res.status === 404) {
            setErrorMsg(`Unknown screen slug: "${slug}"`);
            setIsConnected(false);
            return;
          }
          throw new Error(`Sync failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setIsConnected(true);
          setErrorMsg(null);

          // Clear sent telemetry logs
          pendingEventsRef.current = pendingEventsRef.current.filter(
            (e) => !eventsToSend.some((sent) => sent.eventId === e.eventId)
          );
          pendingResultsRef.current = pendingResultsRef.current.filter(
            (r) => !resultsToSend.some((sent) => sent.commandId === r.commandId)
          );

          if (data.manifest && Array.isArray(data.manifest.items)) {
            setManifest(data.manifest.items);
          }
          if (data.playlistVersion) {
            setPlaylistVersion(data.playlistVersion);
          }

          // Step 18: Execute Received Remote Commands
          if (Array.isArray(data.commands) && data.commands.length > 0) {
            data.commands.forEach((cmd: CommandItem) => {
              const expires = new Date(cmd.expiresAt).getTime();
              if (Date.now() > expires) {
                pendingResultsRef.current.push({
                  commandId: cmd.commandId,
                  status: 'FAILED',
                  errorMessage: 'Command validity period expired',
                });
                return;
              }

              console.log(`Executing remote command: ${cmd.command}`, cmd);
              if (cmd.command === 'RELOAD_APP' || cmd.command === 'REFRESH_PLAYLIST') {
                window.location.reload();
              }
              pendingResultsRef.current.push({
                commandId: cmd.commandId,
                status: 'COMPLETED',
              });
            });
          }
        }
      } catch (err) {
        console.warn('Screen sync error:', err);
        setIsConnected(false);
      }
    };

    syncScreen();
    const interval = setInterval(syncScreen, 5000);
    return () => clearInterval(interval);
  }, [slug]);

  // Bound currentIndex when manifest changes
  useEffect(() => {
    if (manifest.length === 0 || currentIndex >= manifest.length) {
      setCurrentIndex(0);
    }
  }, [manifest, currentIndex]);

  // Step 15: 15-Second Poster Playback Rotation & Active Boundary Validation
  useEffect(() => {
    if (manifest.length === 0) return;

    const currentItem = manifest[currentIndex % manifest.length];
    const startedAt = new Date();

    if (currentItem) {
      currentPosterRef.current = {
        posterId: currentItem.posterId,
        startedAt,
      };
    }

    const slideTimer = setInterval(() => {
      const now = new Date();
      const completedAt = now;

      // Log Step 16 Playback Event upon completion of 15s display window
      if (currentPosterRef.current) {
        const eventId = `play_${currentPosterRef.current.posterId}_${startedAt.getTime()}_${Math.floor(
          Math.random() * 1000
        )}`;
        pendingEventsRef.current.push({
          eventId,
          posterId: currentPosterRef.current.posterId,
          playlistVersion: playlistVersionRef.current,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          status: 'SUCCESS',
        });
      }

      setFade(false); // Trigger fade-out

      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const items = manifestRef.current;
          if (items.length <= 1) return 0;

          // Step 15: Pre-Playback Validation (active schedule check & error skip)
          let nextIdx = (prevIndex + 1) % items.length;
          let candidate = items[nextIdx];
          const currentTime = new Date().getTime();

          // Skip items outside active schedule window
          if (candidate?.activeFrom && new Date(candidate.activeFrom).getTime() > currentTime) {
            nextIdx = (nextIdx + 1) % items.length;
          }
          if (candidate?.activeUntil && new Date(candidate.activeUntil).getTime() < currentTime) {
            nextIdx = (nextIdx + 1) % items.length;
          }

          return nextIdx;
        });

        setFade(true); // Trigger fade-in
      }, 500);
    }, 15000); // 15-second rotation

    return () => clearInterval(slideTimer);
  }, [manifest.length, currentIndex]);

  // Image load error fallback handler (Step 15: Skip failed images)
  const handleImageError = (posterId: string) => {
    console.warn(`Poster image load error for posterId: ${posterId}. Skipping...`);

    const startedAt = new Date();
    pendingEventsRef.current.push({
      eventId: `err_${posterId}_${startedAt.getTime()}`,
      posterId,
      playlistVersion: playlistVersionRef.current,
      startedAt: startedAt.toISOString(),
      completedAt: startedAt.toISOString(),
      status: 'SKIPPED',
      failureReason: 'Image asset load failed / missing checksum cache',
    });

    // Advance to next poster immediately
    setCurrentIndex((prev) => (manifest.length > 0 ? (prev + 1) % manifest.length : 0));
  };

  if (errorMsg) {
    return (
      <main className="w-screen h-screen bg-[#26251e] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-[#ffffff] text-[#26251e] border border-[#e6e5e0] p-8 rounded-xl shadow-lg space-y-4">
          <div className="w-12 h-12 bg-[#fafaf7] text-[#cf2d56] rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-[#e6e5e0]">
            !
          </div>
          <h1 className="text-xl font-semibold">Screen Kiosk Not Found</h1>
          <p className="text-xs text-[#5a5852]">{errorMsg}</p>
          <p className="text-[11px] text-[#807d72] font-mono">
            Verify device slug in database (e.g., <code className="text-[#f54e00]">/display/screen-1</code>).
          </p>
        </div>
      </main>
    );
  }

  const currentPoster = manifest.length > 0 ? manifest[currentIndex % manifest.length] : null;

  return (
    <main className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center select-none font-sans">
      {/* Active 15-Second Poster Display */}
      {currentPoster ? (
        <div className={`w-full h-full flex items-center justify-center transition-opacity duration-700 ${fade ? 'opacity-100' : 'opacity-0'}`}>
          <img
            src={currentPoster.url}
            alt={currentPoster.title}
            onError={() => handleImageError(currentPoster.posterId)}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        /* Fallback Screen when no poster assigned */
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-xl text-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#26251e] border border-[#5a5852] flex items-center justify-center mb-2 shadow-xl">
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f54e00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-[#f54e00]"></span>
            </span>
          </div>
          <h2 className="text-3xl font-normal tracking-tight">Smart Display Kiosk ({slug.toUpperCase()})</h2>
          <p className="text-slate-400 text-sm">Screen Active • Waiting for Approved Content Manifest</p>
          <div className="px-4 py-2 bg-[#26251e] border border-[#5a5852] rounded-full text-xs text-[#f7f7f4] tracking-wider uppercase font-mono">
            Status: Online & Telemetry Polling • 15s Rotation Ready
          </div>
        </div>
      )}

      {/* Disconnection Warning Overlay */}
      {!isConnected && (
        <div className="absolute bottom-6 right-6 bg-[#cf2d56] text-white text-xs px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
          <div>
            <span className="font-semibold block">Connection Retrying</span>
            <span className="text-white/80">Retrying server telemetry sync...</span>
          </div>
        </div>
      )}

      {/* Subtle Screen ID & Version Badge */}
      <div className="absolute bottom-3 left-3 text-[11px] text-white/40 font-mono tracking-widest pointer-events-none">
        {slug.toUpperCase()} • MANIFEST v{playlistVersion}
      </div>
    </main>
  );
}
