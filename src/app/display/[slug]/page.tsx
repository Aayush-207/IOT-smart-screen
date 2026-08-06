'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Poster {
  id: string;
  title: string;
  imagePath: string;
  displayOrder: number;
}

interface ScreenInfo {
  id: string;
  slug: string;
  name: string;
  location: string;
}

export default function DisplayScreenPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [screen, setScreen] = useState<ScreenInfo | null>(null);
  const [playlist, setPlaylist] = useState<Poster[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fade, setFade] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const playlistRef = useRef<Poster[]>([]);
  playlistRef.current = playlist;

  // Poll server for heartbeat & playlist update every 5 seconds
  useEffect(() => {
    if (!slug) return;

    const syncScreen = async () => {
      try {
        // Send heartbeat
        const heartbeatRes = await fetch(`/api/screens/${slug}/heartbeat`, {
          method: 'POST',
        });
        if (!heartbeatRes.ok) {
          if (heartbeatRes.status === 404) {
            setErrorMsg(`Unknown screen slug: "${slug}"`);
            setIsConnected(false);
            return;
          }
        }

        // Fetch playlist
        const playlistRes = await fetch(`/api/screens/${slug}/playlist`);
        if (!playlistRes.ok) {
          throw new Error(`Server returned status ${playlistRes.status}`);
        }

        const data = await playlistRes.json();
        if (data.success) {
          setScreen(data.screen);
          setIsConnected(true);
          setErrorMsg(null);

          const newPlaylist: Poster[] = data.playlist || [];
          setPlaylist((prev) => {
            const prevIds = prev.map((p) => p.id).join(',');
            const newIds = newPlaylist.map((p) => p.id).join(',');
            if (prevIds !== newIds) {
              setFade(true);
            }
            return newPlaylist;
          });
        }
      } catch (err) {
        console.warn('Polling error:', err);
        setIsConnected(false);
      }
    };

    // Initial sync
    syncScreen();

    // 5-second interval poll
    const pollInterval = setInterval(syncScreen, 5000);
    return () => clearInterval(pollInterval);
  }, [slug]);

  // Keep currentIndex bounded when playlist changes
  useEffect(() => {
    if (playlist.length === 0 || currentIndex >= playlist.length) {
      setCurrentIndex(0);
    }
  }, [playlist, currentIndex]);

  // Slideshow rotation every 8 seconds if multiple posters
  useEffect(() => {
    if (playlist.length <= 1) return;

    const slideTimer = setInterval(() => {
      setFade(false); // trigger fade-out
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const len = playlistRef.current.length;
          return len > 0 ? (prevIndex + 1) % len : 0;
        });
        setFade(true); // trigger fade-in
      }, 400); // 400ms fade duration
    }, 8000);

    return () => clearInterval(slideTimer);
  }, [playlist.length]);

  if (errorMsg) {
    return (
      <main className="w-screen h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Screen Not Found</h1>
          <p className="text-slate-400 text-sm mb-4">{errorMsg}</p>
          <p className="text-slate-500 text-xs">
            Please verify URL path (e.g., <code className="text-cyan-400">/display/screen-1</code>).
          </p>
        </div>
      </main>
    );
  }

  const currentPoster = playlist.length > 0 ? playlist[currentIndex % playlist.length] : null;

  return (
    <main className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center select-none">
      {/* Active Poster Display */}
      {currentPoster ? (
        <div className={`w-full h-full flex items-center justify-center transition-opacity duration-700 ${fade ? 'opacity-100' : 'opacity-0'}`}>
          <img
            src={currentPoster.imagePath}
            alt={currentPoster.title}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        /* Fallback Screen when no poster assigned */
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-xl">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-xl">
            <span className="relative flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-cyan-500"></span>
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            {screen ? screen.name : 'Smart Display Kiosk'}
          </h2>
          <p className="text-slate-400 text-lg mb-6">
            {screen?.location ? `Location: ${screen.location}` : 'Screen Ready • Waiting for Content'}
          </p>
          <div className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-xs text-slate-400 tracking-wider uppercase font-medium">
            Status: Online & Connected • Polling Active
          </div>
        </div>
      )}

      {/* Disconnection Warning Toast (preserves current poster) */}
      {!isConnected && (
        <div className="absolute bottom-6 right-6 bg-red-950/90 border border-red-800 text-red-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md z-50 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
          <div>
            <span className="font-semibold block">Connection Interrupted</span>
            <span className="text-red-300/80">Retrying server connection...</span>
          </div>
        </div>
      )}

      {/* Subtle screen ID badge overlay at bottom left */}
      <div className="absolute bottom-3 left-3 text-[10px] text-white/30 font-mono tracking-widest pointer-events-none">
        {slug.toUpperCase()}
      </div>
    </main>
  );
}
