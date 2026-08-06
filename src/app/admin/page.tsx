'use client';

import { useEffect, useState, useRef, ChangeEvent, FormEvent } from 'react';
import {
  Monitor,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface Poster {
  id: string;
  title: string;
  imagePath: string;
  originalFileName: string;
  mimeType: string;
  createdAt: string;
  assignedScreens?: { id: string; slug: string; name: string }[];
}

interface ScreenPoster extends Poster {
  assignmentId: string;
  displayOrder: number;
}

interface ScreenData {
  id: string;
  slug: string;
  name: string;
  location: string;
  lastSeenAt: string | null;
  isOnline: boolean;
  posters: ScreenPoster[];
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
  clubId: string | null;
}

export default function AdminDashboardPage() {
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetScreenIds, setTargetScreenIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Quick Assign Modal
  const [assigningPoster, setAssigningPoster] = useState<Poster | null>(null);
  const [assignTargetScreenIds, setAssignTargetScreenIds] = useState<string[]>([]);

  // Screen Content Management Modal
  const [managingScreen, setManagingScreen] = useState<ScreenData | null>(null);

  // Notifications
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss alert messages after 5 seconds
  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Fetch user profile, screens, and posters data
  const fetchData = async () => {
    try {
      const [screensRes, postersRes, authRes] = await Promise.all([
        fetch('/api/screens'),
        fetch('/api/posters'),
        fetch('/api/auth/me'),
      ]);

      const screensJson = await screensRes.json();
      const postersJson = await postersRes.json();
      const authJson = await authRes.json();

      if (authJson.success && authJson.user) {
        setUser(authJson.user);
      }
      if (screensJson.success) {
        setScreens(screensJson.screens);
        if (managingScreen) {
          const updated = screensJson.screens.find((s: ScreenData) => s.id === managingScreen.id);
          if (updated) setManagingScreen(updated);
        }
      }
      if (postersJson.success) {
        setPosters(postersJson.posters);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // Initial load & 5s status refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle File Select
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('File exceeds maximum size limit of 10 MB.', 'error');
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showNotification('Unsupported file type. Please upload PNG, JPEG, or WebP.', 'error');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Toggle Target Screen for upload form
  const toggleUploadTargetScreen = (screenId: string) => {
    setTargetScreenIds((prev) =>
      prev.includes(screenId) ? prev.filter((id) => id !== screenId) : [...prev, screenId]
    );
  };

  const selectAllUploadScreens = () => {
    if (targetScreenIds.length === screens.length) {
      setTargetScreenIds([]);
    } else {
      setTargetScreenIds(screens.map((s) => s.id));
    }
  };

  // Upload and Publish Poster
  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showNotification('Please select an image file to upload.', 'error');
      return;
    }
    if (!title.trim()) {
      showNotification('Please enter a poster title.', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      targetScreenIds.forEach((id) => formData.append('screenIds', id));

      const res = await fetch('/api/posters/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || 'Poster uploaded and published!');
        setTitle('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setTargetScreenIds([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchData();
      } else {
        showNotification(data.error || 'Upload failed.', 'error');
      }
    } catch (err: any) {
      showNotification('Network error uploading poster.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Assign Existing Poster Modal
  const openAssignModal = (poster: Poster) => {
    setAssigningPoster(poster);
    const currentAssigned = poster.assignedScreens?.map((s) => s.id) || [];
    setAssignTargetScreenIds(currentAssigned);
  };

  const handleAssignSubmit = async () => {
    if (!assigningPoster) return;
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posterId: assigningPoster.id,
          screenIds: assignTargetScreenIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Poster successfully assigned to screen(s)!`);
        setAssigningPoster(null);
        await fetchData();
      } else {
        showNotification(data.error || 'Failed to assign poster.', 'error');
      }
    } catch (err) {
      showNotification('Error performing assignment.', 'error');
    }
  };

  // Delete Poster
  const handleDeletePoster = async (posterId: string, posterTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${posterTitle}"? This will unassign it from all screens.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/posters/${posterId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Deleted poster "${posterTitle}".`);
        await fetchData();
      } else {
        showNotification(data.error || 'Failed to delete poster.', 'error');
      }
    } catch (err) {
      showNotification('Error deleting poster.', 'error');
    }
  };

  // Unassign poster from screen
  const handleRemoveAssignment = async (screenId: string, posterId: string) => {
    try {
      const res = await fetch(`/api/assignments?screenId=${screenId}&posterId=${posterId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Poster removed from screen.');
        await fetchData();
      } else {
        showNotification(data.error || 'Failed to remove poster.', 'error');
      }
    } catch (err) {
      showNotification('Error removing assignment.', 'error');
    }
  };

  // Reorder playlist poster items
  const handleMovePosterOrder = async (screenId: string, posterId: string, direction: 'up' | 'down') => {
    if (!managingScreen) return;
    const currentPosters = [...managingScreen.posters];
    const index = currentPosters.findIndex((p) => p.id === posterId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPosters.length) return;

    const temp = currentPosters[index];
    currentPosters[index] = currentPosters[targetIndex];
    currentPosters[targetIndex] = temp;

    const orderedPosterIds = currentPosters.map((p) => p.id);

    try {
      const res = await fetch('/api/assignments/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId, orderedPosterIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Playlist order updated.');
        await fetchData();
      } else {
        showNotification(data.error || 'Failed to reorder playlist.', 'error');
      }
    } catch (err) {
      showNotification('Error reordering playlist.', 'error');
    }
  };

  // Summary Metrics
  const totalScreens = screens.length;
  const onlineScreens = screens.filter((s) => s.isOnline).length;
  const totalPosters = posters.length;
  const totalAssignments = screens.reduce((acc, s) => acc + s.posters.length, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Monitor className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Smart Billboard Control</h1>
              <p className="text-xs text-cyan-400 font-medium">IoT Digital Signage Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <div>
                  <span className="font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-cyan-300 font-mono ml-2 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md">
                    {user.role} ({user.clubId || 'global'})
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="SSO Logout"
                  className="ml-2 p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Server Time: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Toast Notification Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-semibold underline hover:no-underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Screens</span>
              <p className="text-2xl font-bold text-slate-900">{totalScreens}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Online Screens</span>
              <p className="text-2xl font-bold text-emerald-600">
                {onlineScreens} <span className="text-xs font-normal text-slate-400">/ {totalScreens}</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Posters</span>
              <p className="text-2xl font-bold text-slate-900">{totalPosters}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Assignments</span>
              <p className="text-2xl font-bold text-slate-900">{totalAssignments}</p>
            </div>
          </div>
        </section>

        {/* Section 1: Registered Display Screens */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              Registered Display Screens
            </h2>
            <span className="text-xs text-slate-500">Auto-refreshes every 5s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Card Header & Online Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">{screen.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{screen.location}</p>
                    </div>
                    {screen.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        Offline
                      </span>
                    )}
                  </div>

                  {/* Heartbeat Status */}
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {screen.lastSeenAt
                        ? `Last heartbeat: ${new Date(screen.lastSeenAt).toLocaleTimeString()}`
                        : 'No heartbeat recorded yet'}
                    </span>
                  </div>

                  {/* Currently Assigned Posters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Assigned Content ({screen.posters.length})</span>
                      {screen.posters.length > 1 && (
                        <span className="text-[11px] text-cyan-600 font-medium">Rotating Slideshow (8s)</span>
                      )}
                    </div>

                    {screen.posters.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {screen.posters.map((poster) => (
                          <div
                            key={poster.assignmentId}
                            className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-900"
                          >
                            <img
                              src={poster.imagePath}
                              alt={poster.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-1">
                              <button
                                onClick={() => handleRemoveAssignment(screen.id, poster.id)}
                                title="Remove from screen"
                                className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                        No poster assigned. Display showing default fallback.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <a
                    href={`/display/${screen.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Display Page
                  </a>

                  <button
                    onClick={() => setManagingScreen(screen)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Manage Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Upload and Publish Poster Form */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-600" />
              Upload & Remote Publish Poster
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an image, enter a title, and instantly publish it to one, multiple, or all screens.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Inputs */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Poster Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Campus Tech Innovation Summit 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Image File (PNG, JPEG, WebP, max 10MB) *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 border border-slate-300 rounded-xl cursor-pointer"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Target Display Screens
                  </label>
                  <button
                    type="button"
                    onClick={selectAllUploadScreens}
                    className="text-xs text-cyan-600 font-semibold hover:underline"
                  >
                    {targetScreenIds.length === screens.length ? 'Deselect All' : 'Select All Screens'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {screens.map((s) => {
                    const isChecked = targetScreenIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUploadTargetScreen(s.id)}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <UploadCloud className="w-5 h-5" />
                {isUploading ? 'Publishing to Network...' : 'Upload & Publish to Selected Screens'}
              </button>
            </div>

            {/* Right Live Image Preview */}
            <div className="flex flex-col">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Live Poster Preview
              </label>
              <div className="flex-1 bg-slate-900 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center p-4 min-h-[220px] relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Poster Preview"
                    className="w-full h-full max-h-[300px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-slate-500 space-y-2">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-xs">No image selected for preview</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Section 3: Media Library */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            Media Library ({posters.length})
          </h2>

          {posters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {posters.map((poster) => (
                <div
                  key={poster.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="aspect-video bg-slate-900 relative">
                    <img
                      src={poster.imagePath}
                      alt={poster.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{poster.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Uploaded: {new Date(poster.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">Assigned Screens:</span>
                      {poster.assignedScreens && poster.assignedScreens.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {poster.assignedScreens.map((sc) => (
                            <span
                              key={sc.id}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full border border-blue-200"
                            >
                              {sc.name.split('—')[0]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openAssignModal(poster)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Assign
                    </button>
                    <button
                      onClick={() => handleDeletePoster(poster.id, poster.title)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-medium rounded-lg transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              No posters uploaded yet. Use the upload form above to add your first digital poster.
            </div>
          )}
        </section>

        {/* Quick Assign Modal */}
        {assigningPoster && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Assign Poster to Screens</h3>
                <button
                  onClick={() => setAssigningPoster(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img
                  src={assigningPoster.imagePath}
                  alt={assigningPoster.title}
                  className="w-16 h-10 object-cover rounded-lg bg-slate-900"
                />
                <span className="font-bold text-sm text-slate-800 line-clamp-1">
                  {assigningPoster.title}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Select Target Screens
                </label>
                <div className="space-y-2">
                  {screens.map((sc) => {
                    const isChecked = assignTargetScreenIds.includes(sc.id);
                    return (
                      <label
                        key={sc.id}
                        className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{sc.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setAssignTargetScreenIds((prev) =>
                              prev.includes(sc.id)
                                ? prev.filter((id) => id !== sc.id)
                                : [...prev, sc.id]
                            );
                          }}
                          className="rounded text-blue-600"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setAssigningPoster(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen Playlist Management Modal */}
        {managingScreen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{managingScreen.name}</h3>
                  <p className="text-xs text-slate-500">Manage assigned poster rotation & order</p>
                </div>
                <button
                  onClick={() => setManagingScreen(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Current Playlist ({managingScreen.posters.length})
                </h4>

                {managingScreen.posters.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {managingScreen.posters.map((p, idx) => (
                      <div
                        key={p.assignmentId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 gap-2"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <img
                            src={p.imagePath}
                            alt={p.title}
                            className="w-12 h-8 object-cover rounded bg-slate-900 flex-shrink-0"
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate">{p.title}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reorder Buttons */}
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMovePosterOrder(managingScreen.id, p.id, 'up')}
                            title="Move Up"
                            className="p-1 text-slate-600 hover:text-cyan-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            disabled={idx === managingScreen.posters.length - 1}
                            onClick={() => handleMovePosterOrder(managingScreen.id, p.id, 'down')}
                            title="Move Down"
                            className="p-1 text-slate-600 hover:text-cyan-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={async () => {
                              await handleRemoveAssignment(managingScreen.id, p.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition ml-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No posters currently assigned.</p>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setManagingScreen(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Smart Digital Billboard Network • Academic Proof-of-Concept System
      </footer>
    </div>
  );
}
