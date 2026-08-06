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
  Calendar,
  Inbox,
  ShieldCheck,
  Check,
  X,
  MessageSquare,
  Building,
  Tv,
} from 'lucide-react';

interface Poster {
  id: string;
  title: string;
  imagePath: string;
  originalFileName: string;
  mimeType: string;
  createdAt: string;
  status?: string;
  checksum?: string;
  activeFrom?: string | null;
  activeUntil?: string | null;
  assignedScreens?: { id: string; name: string }[];
}

interface ScreenPoster {
  id: string;
  title: string;
  imagePath: string;
  displayOrder: number;
}

interface ScreenData {
  id: string;
  slug: string;
  name: string;
  location: string;
  building?: string;
  floor?: string;
  status?: string;
  playlistVersion?: number;
  freeStorageMb?: number;
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

interface InboxItem {
  id: string;
  title: string;
  imagePath: string;
  status: string;
  checksum: string;
  activeFrom: string | null;
  activeUntil: string | null;
  event?: {
    name: string;
    description: string;
    clubId: string;
    venue: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    contactInfo: string;
    registrationUrl: string | null;
  };
  approvals: {
    id: string;
    stage: string;
    reviewerName: string;
    action: string;
    comment: string | null;
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'inbox' | 'enrollment'>('overview');
  const [screens, setScreens] = useState<ScreenData[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Event Creation Form State
  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventClubId, setEventClubId] = useState('technology-club');
  const [eventVenue, setEventVenue] = useState('Main Auditorium');
  const [eventDate, setEventDate] = useState('2026-08-30');
  const [eventStartTime, setEventStartTime] = useState('09:00 AM');
  const [eventEndTime, setEventEndTime] = useState('05:00 PM');
  const [eventContact, setEventContact] = useState('tech@college.edu');
  const [eventRegUrl, setEventRegUrl] = useState('');
  const [eventTargetScreens, setEventTargetScreens] = useState<string[]>([]);
  const [eventPosterFile, setEventPosterFile] = useState<File | null>(null);
  const [eventPosterPreview, setEventPosterPreview] = useState<string | null>(null);

  // Approval Inbox Action Modal
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);
  const [approvalActionType, setApprovalActionType] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Screen Enrollment Form State
  const [enrollName, setEnrollName] = useState('');
  const [enrollLocation, setEnrollLocation] = useState('');
  const [enrollBuilding, setEnrollBuilding] = useState('Main Academic Block');
  const [enrollFloor, setEnrollFloor] = useState('1st Floor');
  const [enrolledSecret, setEnrolledSecret] = useState<{ deviceId: string; secret: string } | null>(null);

  // Quick Assign Modal & Content Management
  const [assigningPoster, setAssigningPoster] = useState<Poster | null>(null);
  const [assignTargetScreenIds, setAssignTargetScreenIds] = useState<string[]>([]);
  const [managingScreen, setManagingScreen] = useState<ScreenData | null>(null);

  // Notifications
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Fetch all admin data & approval inbox
  const fetchData = async () => {
    try {
      const [screensRes, postersRes, authRes, inboxRes] = await Promise.all([
        fetch('/api/screens'),
        fetch('/api/posters'),
        fetch('/api/auth/me'),
        fetch('/api/v1/approvals/inbox'),
      ]);

      const screensJson = await screensRes.json();
      const postersJson = await postersRes.json();
      const authJson = await authRes.json();
      const inboxJson = await inboxRes.json();

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
      if (inboxJson.success) {
        setInboxItems(inboxJson.inbox);
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Event Poster Select
  const handleEventPosterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showNotification('File exceeds max size limit of 10 MB.', 'error');
      return;
    }
    setEventPosterFile(file);
    setEventPosterPreview(URL.createObjectURL(file));
  };

  // Submit New Event & Draft Poster
  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventDesc || !eventDate) {
      showNotification('Please fill in required event fields.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', eventName);
      formData.append('description', eventDesc);
      formData.append('clubId', eventClubId);
      formData.append('venue', eventVenue);
      formData.append('eventDate', eventDate);
      formData.append('startTime', eventStartTime);
      formData.append('endTime', eventEndTime);
      formData.append('contactInfo', eventContact);
      if (eventRegUrl) formData.append('registrationUrl', eventRegUrl);
      eventTargetScreens.forEach((slug) => formData.append('targetScreens', slug));
      if (eventPosterFile) formData.append('poster', eventPosterFile);

      const res = await fetch('/api/v1/events', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Event created! Poster saved in DRAFT mode.');
        setEventName('');
        setEventDesc('');
        setEventPosterFile(null);
        setEventPosterPreview(null);
        setEventTargetScreens([]);
        await fetchData();
        setActiveTab('inbox');
      } else {
        showNotification(data.error || 'Failed to create event.', 'error');
      }
    } catch (err) {
      showNotification('Error creating event.', 'error');
    }
  };

  // Submit Poster for Approval Workflow (DRAFT -> PENDING_PRESIDENT)
  const handleSubmitPosterForApproval = async (posterId: string) => {
    try {
      const res = await fetch(`/api/v1/posters/${posterId}/submit`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Poster submitted for President approval!');
        await fetchData();
      } else {
        showNotification(data.error || 'Submission failed.', 'error');
      }
    } catch {
      showNotification('Error submitting poster.', 'error');
    }
  };

  // Submit Approval Action (Approve / Request Changes / Reject)
  const handleApprovalActionSubmit = async () => {
    if (!selectedInboxItem) return;
    if ((approvalActionType === 'REQUEST_CHANGES' || approvalActionType === 'REJECT') && !approvalComment.trim()) {
      showNotification('A comment is required for rejection or change requests.', 'error');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/v1/approvals/${selectedInboxItem.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalActionType,
          comment: approvalComment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Approval action "${approvalActionType}" executed successfully!`);
        setSelectedInboxItem(null);
        setApprovalComment('');
        await fetchData();
      } else {
        showNotification(data.error || 'Approval action failed.', 'error');
      }
    } catch {
      showNotification('Network error processing approval action.', 'error');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Screen Enrollment Submit
  const handleEnrollScreen = async (e: FormEvent) => {
    e.preventDefault();
    if (!enrollName || !enrollLocation) {
      showNotification('Please enter screen name and location.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/v1/screens/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: enrollName,
          location: enrollLocation,
          building: enrollBuilding,
          floor: enrollFloor,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Screen kiosk enrolled successfully!');
        setEnrolledSecret({
          deviceId: data.device.deviceId,
          secret: data.device.deviceSecret,
        });
        setEnrollName('');
        setEnrollLocation('');
        await fetchData();
      } else {
        showNotification(data.error || 'Enrollment failed.', 'error');
      }
    } catch {
      showNotification('Error enrolling screen.', 'error');
    }
  };

  // Summary Metrics
  const totalScreens = screens.length;
  const onlineScreens = screens.filter((s) => s.isOnline).length;
  const totalPosters = posters.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                CampusCast Admin Operations
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  SSO Protected
                </span>
              </h1>
              <p className="text-xs text-slate-400">IoT Digital Signage & Scoped Approvals</p>
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
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Billboard Fleet & Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'events'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Create Event & Poster
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-5 py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Approval Inbox
            {inboxItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
                {inboxItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('enrollment')}
            className={`px-5 py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'enrollment'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            Screen Kiosk Enrollment
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div
            className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-lg ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-red-950/80 border-red-800 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Kiosk Screens</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{totalScreens}</h3>
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">{onlineScreens} Online & Syncing</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Monitor className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Media Poster Library</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{totalPosters}</h3>
                  <p className="text-[11px] text-cyan-400 mt-1 font-mono">Approved & Scoped Posters</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Pending Approvals</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{inboxItems.length}</h3>
                  <p className="text-[11px] text-amber-400 mt-1 font-mono">Multi-Stage Review Inbox</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Inbox className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Active Screens Fleet */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                Live Kiosk Billboard Fleet
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {screens.map((screen) => (
                  <div key={screen.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">{screen.name}</h3>
                        <p className="text-xs text-slate-400">{screen.location}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border flex items-center gap-1.5 ${
                        screen.isOnline
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${screen.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                        {screen.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      <p>Building: <span className="text-slate-200">{screen.building}</span></p>
                      <p>Floor: <span className="text-slate-200">{screen.floor}</span></p>
                      <p>Playlist Manifest Version: <span className="text-cyan-400 font-mono">v{screen.playlistVersion || 1}</span></p>
                    </div>

                    <a
                      href={`/display/${screen.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-2"
                    >
                      <span>Open Kiosk Display</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE EVENT */}
        {activeTab === 'events' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-cyan-400" />
                Step 2: Create Event & Submit Poster
              </h2>
              <p className="text-xs text-slate-400">
                Design Lead fills basic event details & uploads poster image. Creates an event & DRAFT poster record.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Annual AI & Robotics Hackathon 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Event agenda, eligibility, and rules..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Club Scope *</label>
                  <select
                    value={eventClubId}
                    onChange={(e) => setEventClubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="technology-club">Technology Club</option>
                    <option value="robotics-club">Robotics Club</option>
                    <option value="cultural-society">Cultural Society</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Venue *</label>
                  <input
                    type="text"
                    required
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">End Time *</label>
                  <input
                    type="text"
                    required
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Contact Email/Phone *</label>
                  <input
                    type="text"
                    required
                    value={eventContact}
                    onChange={(e) => setEventContact(e.target.value)}
                    placeholder="tech@college.edu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Registration URL</label>
                  <input
                    type="url"
                    value={eventRegUrl}
                    onChange={(e) => setEventRegUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Target Screens Selection */}
              <div className="space-y-2 pt-2">
                <label className="font-semibold text-slate-300 block">Target Kiosk Screens:</label>
                <div className="grid grid-cols-3 gap-3">
                  {screens.map((screen) => (
                    <label
                      key={screen.slug}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                        eventTargetScreens.includes(screen.slug)
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-medium text-[11px] truncate">{screen.name}</span>
                      <input
                        type="checkbox"
                        checked={eventTargetScreens.includes(screen.slug)}
                        onChange={() => {
                          setEventTargetScreens((prev) =>
                            prev.includes(screen.slug)
                              ? prev.filter((s) => s !== screen.slug)
                              : [...prev, screen.slug]
                          );
                        }}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Poster Upload File */}
              <div className="space-y-2 pt-2">
                <label className="font-semibold text-slate-300 block">Poster Image (PNG, JPEG, WebP) *</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleEventPosterChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-300 text-xs"
                />
                {eventPosterPreview && (
                  <div className="mt-3 relative w-full h-44 rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                    <img src={eventPosterPreview} alt="Preview" className="max-h-full object-contain" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                Create Event & Save DRAFT Poster
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: APPROVAL INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-cyan-400" />
                  Multi-Stage Transactional Approval Inbox
                </h2>
                <p className="text-xs text-slate-400">
                  Workflow: <code className="text-cyan-300">DRAFT</code> → <code className="text-purple-300">PENDING_PRESIDENT</code> → <code className="text-amber-300">PENDING_HOD</code> → <code className="text-emerald-300">PENDING_ADMIN</code> → <code className="text-emerald-400">APPROVED</code>
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                Current Role: <strong className="text-white">{user?.role || 'DESIGN_LEAD'}</strong>
              </span>
            </div>

            {inboxItems.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-white text-base">Approval Inbox Clean</h3>
                <p className="text-xs text-slate-400">No posters are currently pending review for your role stage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inboxItems.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {item.status}
                        </span>
                        <h3 className="font-bold text-white text-base mt-1">{item.title}</h3>
                        {item.event && <p className="text-xs text-cyan-400 font-medium">{item.event.name}</p>}
                      </div>
                      <div className="w-20 h-20 rounded-xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                        <img src={item.imagePath} alt={item.title} className="max-h-full object-contain" />
                      </div>
                    </div>

                    {item.event && (
                      <div className="text-xs text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <p>Venue: <span className="text-slate-200">{item.event.venue}</span></p>
                        <p>Event Date: <span className="text-slate-200">{new Date(item.event.eventDate).toLocaleDateString()}</span></p>
                        <p>Calculated 21-Day Display: <span className="text-cyan-400 font-mono">{item.activeFrom ? new Date(item.activeFrom).toLocaleDateString() : 'Auto-Calculated'}</span></p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-3">
                      {item.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleSubmitPosterForApproval(item.id)}
                          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition"
                        >
                          Submit for President Approval
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedInboxItem(item)}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Review & Execute Approval Action
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approval Action Modal */}
            {selectedInboxItem && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      Review Poster Submission
                    </h3>
                    <button onClick={() => setSelectedInboxItem(null)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-slate-400">Target Item: <strong className="text-white">{selectedInboxItem.title}</strong></p>
                      <p className="text-slate-400 mt-0.5">Current Stage: <strong className="text-cyan-400 font-mono">{selectedInboxItem.status}</strong></p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-300 block">Select Action:</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setApprovalActionType('APPROVE')}
                          className={`py-2 rounded-xl font-bold text-xs border ${
                            approvalActionType === 'APPROVE'
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setApprovalActionType('REQUEST_CHANGES')}
                          className={`py-2 rounded-xl font-bold text-xs border ${
                            approvalActionType === 'REQUEST_CHANGES'
                              ? 'bg-amber-950 border-amber-500 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Request Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setApprovalActionType('REJECT')}
                          className={`py-2 rounded-xl font-bold text-xs border ${
                            approvalActionType === 'REJECT'
                              ? 'bg-red-950 border-red-500 text-red-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-300 block">Reviewer Comment:</label>
                      <textarea
                        rows={3}
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Add required comment or feedback for Design Lead..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedInboxItem(null)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprovalActionSubmit}
                      disabled={isSubmittingApproval}
                      className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition"
                    >
                      {isSubmittingApproval ? 'Processing...' : 'Execute Transaction'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SCREEN ENROLLMENT */}
        {activeTab === 'enrollment' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tv className="w-6 h-6 text-cyan-400" />
                  Step 12: Physical Display Screen Enrollment
                </h2>
                <p className="text-xs text-slate-400">
                  Enrolls new kiosk screen node and generates hashed device credentials secret.
                </p>
              </div>

              <form onSubmit={handleEnrollScreen} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Screen Name *</label>
                  <input
                    type="text"
                    required
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="e.g. Science Block Ground Floor Kiosk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Location Description *</label>
                  <input
                    type="text"
                    required
                    value={enrollLocation}
                    onChange={(e) => setEnrollLocation(e.target.value)}
                    placeholder="e.g. Near Physics Lab Room 102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Building</label>
                    <input
                      type="text"
                      value={enrollBuilding}
                      onChange={(e) => setEnrollBuilding(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Floor</label>
                    <input
                      type="text"
                      value={enrollFloor}
                      onChange={(e) => setEnrollFloor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Enroll Physical Screen Node
                </button>
              </form>
            </div>

            {enrolledSecret && (
              <div className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-6 space-y-3 text-xs">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Screen Credentials Generated Successfully
                </h4>
                <p className="text-slate-300">
                  Save these credentials for screen kiosk authentication. Only the SHA-256 hash is stored in PostgreSQL.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] space-y-1 text-slate-200 border border-emerald-900">
                  <p>Device ID: <span className="text-cyan-400">{enrolledSecret.deviceId}</span></p>
                  <p>Device Secret: <span className="text-emerald-400">{enrolledSecret.secret}</span></p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 bg-slate-950">
        CampusCast IoT Network Operations • Multi-Stage Approval System
      </footer>
    </div>
  );
}
