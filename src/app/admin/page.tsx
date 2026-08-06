'use client';

import { useEffect, useState, useRef, ChangeEvent, FormEvent } from 'react';
import {
  Monitor,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  Calendar,
  Inbox,
  ShieldCheck,
  X,
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

  // Notifications
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    } catch {
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

  // Timeline stage pill helper
  const renderStagePill = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="timeline-pill-thinking">DRAFT</span>;
      case 'PENDING_PRESIDENT':
        return <span className="timeline-pill-grep">PENDING PRESIDENT</span>;
      case 'PENDING_HOD':
        return <span className="timeline-pill-read">PENDING HOD</span>;
      case 'PENDING_ADMIN':
        return <span className="timeline-pill-edit">PENDING ADMIN</span>;
      case 'APPROVED':
        return <span className="timeline-pill-done">APPROVED</span>;
      default:
        return <span className="timeline-pill-thinking">{status}</span>;
    }
  };

  const totalScreens = screens.length;
  const onlineScreens = screens.filter((s) => s.isOnline).length;
  const totalPosters = posters.length;

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#26251e] flex flex-col font-sans selection:bg-[#f54e00] selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-[#e6e5e0] bg-[#f7f7f4] sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#26251e] text-white flex items-center justify-center font-bold">
              <Monitor className="w-4 h-4 text-[#f54e00]" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#26251e] flex items-center gap-2">
                CampusCast Operations
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e6e5e0] text-[#5a5852]">
                  SSO Authenticated
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-[#ffffff] border border-[#e6e5e0] px-3 py-1.5 rounded-md text-xs">
                <span className="w-2 h-2 rounded-full bg-[#1f8a65]"></span>
                <div>
                  <span className="font-semibold text-[#26251e]">{user.name}</span>
                  <span className="text-[10px] font-mono text-[#807d72] ml-2">
                    {user.role} ({user.clubId || 'global'})
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="ml-2 p-1 text-[#807d72] hover:text-[#cf2d56] transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-[#ffffff] hover:bg-[#fafaf7] text-[#26251e] text-xs font-medium rounded-md border border-[#cfcdc4] transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1200px] mx-auto px-6 flex border-t border-[#e6e5e0] text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-[#f54e00] text-[#f54e00] bg-[#ffffff]'
                : 'border-transparent text-[#5a5852] hover:text-[#26251e]'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Billboard Fleet & Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'events'
                ? 'border-[#f54e00] text-[#f54e00] bg-[#ffffff]'
                : 'border-transparent text-[#5a5852] hover:text-[#26251e]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Create Event & Poster
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-5 py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'border-[#f54e00] text-[#f54e00] bg-[#ffffff]'
                : 'border-transparent text-[#5a5852] hover:text-[#26251e]'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Approval Inbox
            {inboxItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#f54e00] text-white font-bold text-[10px]">
                {inboxItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('enrollment')}
            className={`px-5 py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'enrollment'
                ? 'border-[#f54e00] text-[#f54e00] bg-[#ffffff]'
                : 'border-transparent text-[#5a5852] hover:text-[#26251e]'
            }`}
          >
            <Tv className="w-4 h-4" />
            Screen Enrollment
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {message && (
        <div className="max-w-[1200px] mx-auto px-6 mt-4 w-full">
          <div
            className={`p-4 rounded-md border text-xs font-medium flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-[#ffffff] border-[#1f8a65] text-[#1f8a65]'
                : 'bg-[#ffffff] border-[#cf2d56] text-[#cf2d56]'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-[#807d72] hover:text-[#26251e]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#807d72]">Total Kiosk Screens</p>
                  <h3 className="text-2xl font-normal text-[#26251e] mt-1">{totalScreens}</h3>
                  <p className="text-[11px] text-[#1f8a65] mt-1 font-mono">{onlineScreens} Online & Syncing</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-[#fafaf7] border border-[#e6e5e0] flex items-center justify-center text-[#26251e]">
                  <Monitor className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#807d72]">Media Poster Library</p>
                  <h3 className="text-2xl font-normal text-[#26251e] mt-1">{totalPosters}</h3>
                  <p className="text-[11px] text-[#5a5852] mt-1 font-mono">Approved & Scoped</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-[#fafaf7] border border-[#e6e5e0] flex items-center justify-center text-[#26251e]">
                  <ImageIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#807d72]">Pending Approvals</p>
                  <h3 className="text-2xl font-normal text-[#26251e] mt-1">{inboxItems.length}</h3>
                  <p className="text-[11px] text-[#f54e00] mt-1 font-mono">Multi-Stage Review</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-[#fafaf7] border border-[#e6e5e0] flex items-center justify-center text-[#f54e00]">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-normal text-[#26251e] flex items-center gap-2">
                <Tv className="w-5 h-5 text-[#f54e00]" />
                Live Kiosk Display Fleet
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {screens.map((screen) => (
                  <div key={screen.id} className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-[#26251e] text-base">{screen.name}</h3>
                        <p className="text-xs text-[#5a5852]">{screen.location}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                        screen.isOnline
                          ? 'bg-[#fafaf7] text-[#1f8a65] border-[#e6e5e0]'
                          : 'bg-[#fafaf7] text-[#807d72] border-[#e6e5e0]'
                      }`}>
                        {screen.isOnline ? '● ONLINE' : '○ OFFLINE'}
                      </span>
                    </div>

                    <div className="text-xs text-[#5a5852] space-y-1 bg-[#fafaf7] p-3 rounded-md border border-[#e6e5e0] font-mono">
                      <p>Building: <span className="text-[#26251e]">{screen.building}</span></p>
                      <p>Floor: <span className="text-[#26251e]">{screen.floor}</span></p>
                      <p>Manifest Version: <span className="text-[#f54e00]">v{screen.playlistVersion || 1}</span></p>
                    </div>

                    <a
                      href={`/display/${screen.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-[#fafaf7] hover:bg-[#26251e] hover:text-white text-[#26251e] text-xs font-medium rounded-md border border-[#e6e5e0] transition flex items-center justify-center gap-2"
                    >
                      <span>Open Display</span>
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
          <div className="max-w-2xl mx-auto bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-8 shadow-sm space-y-6">
            <div className="space-y-1 border-b border-[#e6e5e0] pb-4">
              <h2 className="text-xl font-normal text-[#26251e] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#f54e00]" />
                Create Event & Upload Poster
              </h2>
              <p className="text-xs text-[#5a5852]">
                Design Lead fills basic event details & uploads poster image. Creates an event & DRAFT poster record.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#26251e]">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Annual AI & Robotics Hackathon 2026"
                  className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#26251e]">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Event agenda, eligibility, and rules..."
                  className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Club Scope *</label>
                  <select
                    value={eventClubId}
                    onChange={(e) => setEventClubId(e.target.value)}
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  >
                    <option value="technology-club">Technology Club</option>
                    <option value="robotics-club">Robotics Club</option>
                    <option value="cultural-society">Cultural Society</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Venue *</label>
                  <input
                    type="text"
                    required
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">End Time *</label>
                  <input
                    type="text"
                    required
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Contact Email/Phone *</label>
                  <input
                    type="text"
                    required
                    value={eventContact}
                    onChange={(e) => setEventContact(e.target.value)}
                    placeholder="tech@college.edu"
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Registration URL</label>
                  <input
                    type="url"
                    value={eventRegUrl}
                    onChange={(e) => setEventRegUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-semibold text-[#26251e] block">Target Kiosk Screens:</label>
                <div className="grid grid-cols-3 gap-3">
                  {screens.map((screen) => (
                    <label
                      key={screen.slug}
                      className={`p-3 rounded-md border cursor-pointer flex items-center justify-between ${
                        eventTargetScreens.includes(screen.slug)
                          ? 'bg-[#fafaf7] border-[#f54e00] text-[#f54e00]'
                          : 'bg-[#ffffff] border-[#e6e5e0] text-[#5a5852]'
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

              <div className="space-y-2 pt-2">
                <label className="font-semibold text-[#26251e] block">Poster Image (PNG, JPEG, WebP) *</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleEventPosterChange}
                  className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2 text-[#26251e] text-xs"
                />
                {eventPosterPreview && (
                  <div className="mt-3 relative w-full h-44 rounded-md overflow-hidden border border-[#e6e5e0] bg-[#fafaf7] flex items-center justify-center">
                    <img src={eventPosterPreview} alt="Preview" className="max-h-full object-contain" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#f54e00] hover:bg-[#d04200] text-white font-medium rounded-md transition shadow-sm flex items-center justify-center gap-2 mt-4"
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
            <div className="flex items-center justify-between border-b border-[#e6e5e0] pb-4">
              <div>
                <h2 className="text-xl font-normal text-[#26251e] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#f54e00]" />
                  Multi-Stage Approval Inbox
                </h2>
                <p className="text-xs text-[#5a5852]">
                  Workflow Stages: <span className="timeline-pill-thinking">DRAFT</span> → <span className="timeline-pill-grep">PRESIDENT</span> → <span className="timeline-pill-read">HOD</span> → <span className="timeline-pill-edit">ADMIN</span> → <span className="timeline-pill-done">APPROVED</span>
                </p>
              </div>
              <span className="text-xs font-mono text-[#5a5852] bg-[#fafaf7] border border-[#e6e5e0] px-3 py-1.5 rounded-md">
                Active Role: <strong className="text-[#26251e]">{user?.role || 'DESIGN_LEAD'}</strong>
              </span>
            </div>

            {inboxItems.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#1f8a65] mx-auto" />
                <h3 className="font-semibold text-[#26251e] text-base">Approval Inbox Clean</h3>
                <p className="text-xs text-[#5a5852]">No posters are currently pending review for your active stage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inboxItems.map((item) => (
                  <div key={item.id} className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        {renderStagePill(item.status)}
                        <h3 className="font-semibold text-[#26251e] text-base mt-2">{item.title}</h3>
                        {item.event && <p className="text-xs text-[#f54e00] font-medium">{item.event.name}</p>}
                      </div>
                      <div className="w-20 h-20 rounded-md bg-[#fafaf7] overflow-hidden border border-[#e6e5e0] flex items-center justify-center">
                        <img src={item.imagePath} alt={item.title} className="max-h-full object-contain" />
                      </div>
                    </div>

                    {item.event && (
                      <div className="text-xs text-[#5a5852] space-y-1 bg-[#fafaf7] p-3 rounded-md border border-[#e6e5e0]">
                        <p>Venue: <span className="text-[#26251e] font-medium">{item.event.venue}</span></p>
                        <p>Event Date: <span className="text-[#26251e] font-medium">{new Date(item.event.eventDate).toLocaleDateString()}</span></p>
                        <p>21-Day Display Start: <span className="text-[#f54e00] font-mono">{item.activeFrom ? new Date(item.activeFrom).toLocaleDateString() : 'Auto-Calculated'}</span></p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-3">
                      {item.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleSubmitPosterForApproval(item.id)}
                          className="w-full py-2.5 bg-[#f54e00] hover:bg-[#d04200] text-white font-medium text-xs rounded-md transition"
                        >
                          Submit for President Approval
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedInboxItem(item)}
                          className="w-full py-2.5 bg-[#ffffff] hover:bg-[#fafaf7] text-[#26251e] border border-[#cfcdc4] font-medium text-xs rounded-md transition flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#f54e00]" />
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
              <div className="fixed inset-0 bg-[#26251e]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-6 max-w-lg w-full space-y-6 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#e6e5e0] pb-3">
                    <h3 className="font-semibold text-[#26251e] text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#f54e00]" />
                      Review Poster Submission
                    </h3>
                    <button onClick={() => setSelectedInboxItem(null)} className="text-[#807d72] hover:text-[#26251e]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#fafaf7] rounded-md border border-[#e6e5e0]">
                      <p className="text-[#5a5852]">Target Poster: <strong className="text-[#26251e]">{selectedInboxItem.title}</strong></p>
                      <p className="text-[#5a5852] mt-1 flex items-center gap-2">
                        Current Stage: {renderStagePill(selectedInboxItem.status)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-[#26251e] block">Select Action:</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setApprovalActionType('APPROVE')}
                          className={`py-2 rounded-md font-medium text-xs border ${
                            approvalActionType === 'APPROVE'
                              ? 'bg-[#fafaf7] border-[#1f8a65] text-[#1f8a65]'
                              : 'bg-[#ffffff] border-[#e6e5e0] text-[#5a5852]'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setApprovalActionType('REQUEST_CHANGES')}
                          className={`py-2 rounded-md font-medium text-xs border ${
                            approvalActionType === 'REQUEST_CHANGES'
                              ? 'bg-[#fafaf7] border-[#f54e00] text-[#f54e00]'
                              : 'bg-[#ffffff] border-[#e6e5e0] text-[#5a5852]'
                          }`}
                        >
                          Request Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setApprovalActionType('REJECT')}
                          className={`py-2 rounded-md font-medium text-xs border ${
                            approvalActionType === 'REJECT'
                              ? 'bg-[#fafaf7] border-[#cf2d56] text-[#cf2d56]'
                              : 'bg-[#ffffff] border-[#e6e5e0] text-[#5a5852]'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#26251e] block">Reviewer Comment:</label>
                      <textarea
                        rows={3}
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Add required comment or feedback for Design Lead..."
                        className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-3 py-2 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedInboxItem(null)}
                      className="px-4 py-2 bg-[#fafaf7] text-[#5a5852] text-xs rounded-md font-medium hover:bg-[#e6e5e0]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprovalActionSubmit}
                      disabled={isSubmittingApproval}
                      className="px-5 py-2 bg-[#f54e00] hover:bg-[#d04200] text-white text-xs font-medium rounded-md shadow-sm transition"
                    >
                      {isSubmittingApproval ? 'Processing...' : 'Execute Action'}
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
            <div className="bg-[#ffffff] border border-[#e6e5e0] rounded-xl p-8 shadow-sm space-y-6">
              <div className="space-y-1 border-b border-[#e6e5e0] pb-4">
                <h2 className="text-xl font-normal text-[#26251e] flex items-center gap-2">
                  <Tv className="w-5 h-5 text-[#f54e00]" />
                  Physical Display Screen Enrollment
                </h2>
                <p className="text-xs text-[#5a5852]">
                  Enrolls new kiosk screen node and generates hashed device credentials secret.
                </p>
              </div>

              <form onSubmit={handleEnrollScreen} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Screen Name *</label>
                  <input
                    type="text"
                    required
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="e.g. Science Block Ground Floor Kiosk"
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#26251e]">Location Description *</label>
                  <input
                    type="text"
                    required
                    value={enrollLocation}
                    onChange={(e) => setEnrollLocation(e.target.value)}
                    placeholder="e.g. Near Physics Lab Room 102"
                    className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#26251e]">Building</label>
                    <input
                      type="text"
                      value={enrollBuilding}
                      onChange={(e) => setEnrollBuilding(e.target.value)}
                      className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#26251e]">Floor</label>
                    <input
                      type="text"
                      value={enrollFloor}
                      onChange={(e) => setEnrollFloor(e.target.value)}
                      className="w-full bg-[#fafaf7] border border-[#e6e5e0] rounded-md px-4 py-2.5 text-[#26251e] focus:outline-none focus:border-[#f54e00]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#f54e00] hover:bg-[#d04200] text-white font-medium rounded-md shadow-sm transition flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Enroll Physical Screen Node
                </button>
              </form>
            </div>

            {enrolledSecret && (
              <div className="bg-[#ffffff] border border-[#1f8a65] rounded-xl p-6 space-y-3 text-xs shadow-sm">
                <h4 className="font-semibold text-[#1f8a65] text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Screen Credentials Generated Successfully
                </h4>
                <p className="text-[#5a5852]">
                  Save these credentials for screen kiosk authentication. Only the SHA-256 hash is stored in PostgreSQL.
                </p>
                <div className="p-3 bg-[#fafaf7] rounded-md font-mono text-[11px] space-y-1 text-[#26251e] border border-[#e6e5e0]">
                  <p>Device ID: <span className="text-[#f54e00]">{enrolledSecret.deviceId}</span></p>
                  <p>Device Secret: <span className="text-[#1f8a65]">{enrolledSecret.secret}</span></p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[#e6e5e0] py-6 text-center text-xs text-[#807d72] bg-[#f7f7f4]">
        CampusCast Multi-Stage Approval Engine • Developer Dialect Aesthetic
      </footer>
    </div>
  );
}
