import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck,
  ImagePlus,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserRoundCheck,
  X,
  XCircle,
} from 'lucide-react';

import type { Club, ContentAsset, EventItem, UserRole } from '../types';
import {
  canApprove,
  calculateProposedPosterDueDate,
  roleLabels,
  statusLabels,
} from '../workflow';

interface ContentApprovalViewProps {
  contentList: ContentAsset[];
  events?: EventItem[];
  clubs: Club[];
  currentRole: UserRole;
  currentClubId: string;
  currentUserName: string;
  onAddContent: (asset: ContentAsset) => void;
  onAddEvent?: (event: EventItem) => void;
  onAdvanceApproval: (id: string) => void;
  onRejectContent: (id: string, reason: string) => void;
  createRequest: number;
}

type Filter = 'all' | 'queue' | 'approved' | 'escalated';

const fallbackImage =
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=85';

const workflowSteps = [
  ['DESIGN_LEAD', 'Design Lead', 'Uploads poster'],
  ['PRESIDENT', 'President', 'Stage 1 Review'],
  ['CLUB_HOD', 'Club HOD', 'Stage 2 Review'],
  ['ADMIN', 'Campus Admin', 'Stage 3 Final Review'],
] as const;

function formatDate(value?: string): string {
  if (!value) return 'Not set';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00.000Z`
    : value;
  return new Date(normalized).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function stageIndex(asset: ContentAsset): number {
  if (asset.status === 'pending_president_approval') return 1;
  if (asset.status === 'pending_hod_approval') return 2;
  if (asset.status === 'pending_admin_approval' || asset.status === 'escalated_admin') return 3;
  if (asset.status === 'approved' || asset.status === 'live') return 4;
  return 0;
}

export function ContentApprovalView({
  contentList,
  events = [],
  clubs,
  currentRole,
  currentClubId,
  currentUserName,
  onAddContent,
  onAddEvent,
  onAdvanceApproval,
  onRejectContent,
  createRequest,
}: ContentApprovalViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [reviewing, setReviewing] = useState<ContentAsset | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Poster submission form fields
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('2026-08-25');
  const [venue, setVenue] = useState('Tech Block A Auditorium');
  const [mediaUrl, setMediaUrl] = useState(fallbackImage);
  const [selfCertified, setSelfCertified] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Event creation form fields (President-First)
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtDate, setEvtDate] = useState('2026-08-25');
  const [evtVenue, setEvtVenue] = useState('Central Amphitheatre');
  const [evtClubId, setEvtClubId] = useState(currentClubId);
  const [evtError, setEvtError] = useState<string | null>(null);

  const currentClub = clubs.find((club) => club.id === currentClubId) ?? clubs[0];
  const canSubmit = currentRole === 'DESIGN_LEAD';
  const canCreateEvent = ['PRESIDENT', 'CLUB_HOD', 'ADMIN'].includes(currentRole);

  useEffect(() => {
    if (createRequest > 0 && canSubmit) setCreating(true);
  }, [canSubmit, createRequest]);

  const visible = useMemo(
    () =>
      contentList.filter((content) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          content.title.toLowerCase().includes(query) ||
          content.clubName?.toLowerCase().includes(query);
        const inQueue =
          currentRole === 'DESIGN_LEAD'
            ? content.clubId === currentClubId && content.submitterName === currentUserName
            : canApprove(content, currentRole, currentClubId);

        if (filter === 'queue') return matchesSearch && inQueue;
        if (filter === 'approved') return matchesSearch && (content.status === 'approved' || content.status === 'live');
        if (filter === 'escalated') return matchesSearch && content.status === 'escalated_admin';
        return matchesSearch;
      }),
    [contentList, currentClubId, currentRole, currentUserName, filter, search],
  );

  const queueCount = useMemo(
    () =>
      contentList.filter((content) =>
        currentRole === 'DESIGN_LEAD'
          ? content.clubId === currentClubId && content.submitterName === currentUserName
          : canApprove(content, currentRole, currentClubId),
      ).length,
    [contentList, currentClubId, currentRole, currentUserName],
  );

  const escalatedCount = useMemo(
    () => contentList.filter((content) => content.status === 'escalated_admin').length,
    [contentList],
  );

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtDate) {
      setEvtError('Event title and date are required.');
      return;
    }

    const club = clubs.find((c) => c.id === evtClubId) ?? currentClub;
    const posterDueAt = calculateProposedPosterDueDate(evtDate);

    const newEvt: EventItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: 'org_mit_adt',
      clubId: evtClubId,
      clubName: club.name,
      title: evtTitle,
      description: evtDescription,
      eventDate: evtDate,
      venue: evtVenue,
      status: 'design_in_progress',
      posterDueAt,
      expectedUploadAt: posterDueAt,
      designProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onAddEvent) {
      onAddEvent(newEvt);
    }
    setCreatingEvent(false);
    setEvtTitle('');
    setEvtDescription('');
    setEvtError(null);
  };

  const handlePosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mediaUrl.trim() || !eventDate) {
      setValidationError('Poster title, image URL, and event date are required.');
      return;
    }

    if (!selfCertified) {
      setValidationError('You must certify compliance with the Brand Asset Kit.');
      return;
    }

    const posterDueAt = calculateProposedPosterDueDate(eventDate);
    const newAsset: ContentAsset = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: 'org_mit_adt',
      eventId: selectedEventId || `evt_${Date.now()}`,
      title,
      description,
      category: 'EVENT',
      submitterName: currentUserName,
      submitterRole: 'DESIGN_LEAD',
      mediaUrl,
      mimeType: 'image/png',
      fileSizeBytes: 2500000,
      dimensions: '1920x1080',
      sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
      durationSeconds: 15,
      status: 'pending_president_approval',
      createdAt: new Date().toISOString(),
      clubId: currentClubId,
      clubName: currentClub.name,
      eventDate,
      venue,
      approvalStage: 'PRESIDENT',
      rejectionCount: 0,
      selfCertified: true,
      posterDueAt,
      designProgress: 100,
      version: 1,
      approvalHistory: [
        {
          id: `step_${Date.now()}`,
          contentId: `cnt_${Date.now()}`,
          approverRole: 'DESIGN_LEAD',
          approverName: currentUserName,
          decision: 'SUBMITTED',
          comment: 'Poster submitted with self-certified Brand Asset Kit verification.',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    onAddContent(newAsset);
    setCreating(false);
    setTitle('');
    setDescription('');
    setSelfCertified(false);
    setValidationError(null);
  };

  return (
    <div className="cc-page space-y-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="cc-eyebrow">Approval Workflow & Governance</p>
          <h1 className="cc-page-title text-white">Event Poster Approval Chain</h1>
          <p className="cc-page-description">
            Design Lead Submission → President Approval → HOD Sign-off → Admin Final Broadcast Approval.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreateEvent && (
            <button
              type="button"
              onClick={() => setCreatingEvent(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition"
            >
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              Create Event (President)
            </button>
          )}

          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={!canSubmit}
            className="cc-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Submit Poster
          </button>
        </div>
      </section>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          {[
            ['all', 'All Posters'],
            ['queue', `Action Required (${queueCount})`],
            ['approved', 'Approved'],
            ['escalated', `Admin Escalated (${escalatedCount})`],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id as Filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search poster title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Content List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((asset) => {
          const eligibleToApprove = canApprove(asset, currentRole, currentClubId);
          const currentStageIdx = stageIndex(asset);

          return (
            <div
              key={asset.id}
              className={`bg-slate-900/90 border rounded-2xl overflow-hidden flex flex-col transition hover:border-slate-700 ${
                asset.status === 'escalated_admin'
                  ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'border-slate-800'
              }`}
            >
              {/* Image Header */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={asset.mediaUrl}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-indigo-300 text-[11px] font-bold">
                    {asset.clubName}
                  </span>
                  {asset.rejectionCount >= 2 && (
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Escalated (Rejection Ceiling)
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="font-mono text-[11px] text-slate-300">Venue: {asset.venue}</span>
                  <span className="font-mono text-[11px] text-indigo-300">Event: {asset.eventDate}</span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{asset.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{asset.description || 'No description provided.'}</p>
                </div>

                {/* Workflow Stepper Progress */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Current Stage</span>
                    <strong className="text-indigo-400 font-semibold">{statusLabels[asset.status] || asset.status}</strong>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {workflowSteps.map(([roleKey, stepLabel], idx) => {
                      const isComplete = currentStageIdx > idx + 1;
                      const isCurrent = currentStageIdx === idx + 1;
                      return (
                        <div
                          key={roleKey}
                          className={`h-1.5 rounded-full ${
                            isComplete
                              ? 'bg-emerald-500'
                              : isCurrent
                              ? 'bg-indigo-500 animate-pulse'
                              : 'bg-slate-800'
                          }`}
                          title={`${stepLabel}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewing(asset)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                  >
                    View Details
                  </button>

                  {eligibleToApprove ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewing(asset);
                          setShowRejectModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdvanceApproval(asset.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {asset.status === 'approved' || asset.status === 'live'
                        ? 'Fully Approved'
                        : 'Awaiting Next Stage Review'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* President-First Event Creation Modal */}
      {creatingEvent && (
        <div className="cc-overlay" onMouseDown={(e) => e.target === e.currentTarget && setCreatingEvent(false)}>
          <form onSubmit={handleCreateEventSubmit} className="cc-dialog max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="cc-eyebrow">President-First Event Registration</p>
                <h2 className="text-lg font-bold text-white">Create New Event</h2>
              </div>
              <button type="button" onClick={() => setCreatingEvent(false)} className="cc-icon-button">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="cc-field">
              <span>Event Title</span>
              <input
                type="text"
                required
                placeholder="e.g. HackMIT 2026 AI Innovation Sprint"
                value={evtTitle}
                onChange={(e) => setEvtTitle(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="cc-field">
                <span>Event Date</span>
                <input
                  type="date"
                  required
                  value={evtDate}
                  onChange={(e) => setEvtDate(e.target.value)}
                />
              </label>

              <label className="cc-field">
                <span>Target Club</span>
                <select value={evtClubId} onChange={(e) => setEvtClubId(e.target.value)}>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="cc-field">
              <span>Venue</span>
              <input
                type="text"
                required
                placeholder="e.g. Tech Block A Auditorium"
                value={evtVenue}
                onChange={(e) => setEvtVenue(e.target.value)}
              />
            </label>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <strong>Calculated Poster Target Due Date:</strong>{' '}
              <span className="font-mono">{calculateProposedPosterDueDate(evtDate)}</span> (28 days prior to event date)
            </div>

            {evtError && <p className="text-xs text-rose-400 font-semibold">{evtError}</p>}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setCreatingEvent(false)} className="cc-button-secondary">
                Cancel
              </button>
              <button type="submit" className="cc-button-primary">
                Save & Register Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Poster Submission Modal */}
      {creating && (
        <div className="cc-overlay" onMouseDown={(e) => e.target === e.currentTarget && setCreating(false)}>
          <form onSubmit={handlePosterSubmit} className="cc-dialog max-w-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="cc-eyebrow">Design Lead Upload</p>
                <h2 className="text-lg font-bold text-white">Submit Poster for Approval</h2>
              </div>
              <button type="button" onClick={() => setCreating(false)} className="cc-icon-button">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="cc-field">
              <span>Link to Registered Event</span>
              <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.eventDate})
                  </option>
                ))}
              </select>
            </label>

            <label className="cc-field">
              <span>Poster Title</span>
              <input
                type="text"
                required
                placeholder="Poster Artwork Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="cc-field">
                <span>Event Date</span>
                <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </label>

              <label className="cc-field">
                <span>Venue</span>
                <input type="text" required value={venue} onChange={(e) => setVenue(e.target.value)} />
              </label>
            </div>

            <label className="cc-field">
              <span>Poster Image URL (1920x1080)</span>
              <input type="url" required value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
            </label>

            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={selfCertified}
                  onChange={(e) => setSelfCertified(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  <strong>Brand Asset Kit Self-Certification:</strong> I certify that this poster strictly follows all font sizes, high-contrast sponsor logomarks, and official color standards.
                </span>
              </label>
            </div>

            {validationError && <p className="text-xs text-rose-400 font-semibold">{validationError}</p>}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setCreating(false)} className="cc-button-secondary">
                Cancel
              </button>
              <button type="submit" className="cc-button-primary">
                Submit for President Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal & History */}
      {reviewing && (
        <div className="cc-overlay" onMouseDown={(e) => e.target === e.currentTarget && setReviewing(null)}>
          <div className="cc-dialog max-w-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-400">{reviewing.clubName}</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{reviewing.title}</h2>
              </div>
              <button type="button" onClick={() => setReviewing(null)} className="cc-icon-button">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
              <img src={reviewing.mediaUrl} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {reviewing.approvalHistory?.map((step) => (
                  <div key={step.id} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">{step.approverName} ({step.approverRole})</strong>
                      <span className="text-slate-400 text-[10px]">{formatDate(step.timestamp)}</span>
                    </div>
                    {step.comment && <p className="text-slate-300 mt-1 italic">"{step.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>

            {showRejectModal && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <label className="block text-xs font-bold text-rose-300">
                  Reason for Rejection / Changes Requested:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify required changes..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="px-3 py-1 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!rejectionReasonInput.trim()) return;
                      onRejectContent(reviewing.id, rejectionReasonInput);
                      setShowRejectModal(false);
                      setReviewing(null);
                    }}
                    className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
