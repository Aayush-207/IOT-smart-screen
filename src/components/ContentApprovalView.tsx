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
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserRoundCheck,
  X,
  XCircle,
} from 'lucide-react';

import type { Club, ContentAsset, UserRole } from '../types';
import {
  canApprove,
  calculateProposedPosterDueDate,
  roleLabels,
  statusLabels,
} from '../workflow';

interface ContentApprovalViewProps {
  contentList: ContentAsset[];
  clubs: Club[];
  currentRole: UserRole;
  currentClubId: string;
  currentUserName: string;
  onAddContent: (asset: ContentAsset) => void;
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
  clubs,
  currentRole,
  currentClubId,
  currentUserName,
  onAddContent,
  onAdvanceApproval,
  onRejectContent,
  createRequest,
}: ContentApprovalViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [reviewing, setReviewing] = useState<ContentAsset | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [mediaUrl, setMediaUrl] = useState(fallbackImage);
  const [selfCertified, setSelfCertified] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentClub = clubs.find((club) => club.id === currentClubId) ?? clubs[0];
  const canSubmit = currentRole === 'DESIGN_LEAD';
  const tomorrow = new Date(Date.now() + 24 * 60 * 60_000)
    .toISOString()
    .slice(0, 10);

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
            ? content.clubId === currentClubId &&
              content.submitterName === currentUserName
            : canApprove(content, currentRole, currentClubId);
        const matchesFilter =
          filter === 'all' ||
          (filter === 'queue' && inQueue) ||
          (filter === 'approved' && (content.status === 'approved' || content.status === 'live')) ||
          (filter === 'escalated' && content.status === 'escalated_admin');
        return matchesSearch && matchesFilter;
      }),
    [
      contentList,
      currentClubId,
      currentRole,
      currentUserName,
      filter,
      search,
    ],
  );

  const queueCount = contentList.filter((content) =>
    currentRole === 'DESIGN_LEAD'
      ? content.clubId === currentClubId &&
        content.submitterName === currentUserName
      : canApprove(content, currentRole, currentClubId),
  ).length;

  const escalatedCount = contentList.filter(
    (c) => c.status === 'escalated_admin',
  ).length;

  const resetComposer = () => {
    if (mediaUrl.startsWith('blob:')) URL.revokeObjectURL(mediaUrl);
    setCreating(false);
    setTitle('');
    setDescription('');
    setEventDate('');
    setVenue('');
    setMediaUrl(fallbackImage);
    setSelfCertified(false);
    setValidationError(null);
  };

  const submitPoster = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !eventDate || !currentClub) {
      setValidationError('Add the poster title and event date.');
      return;
    }

    if (!selfCertified) {
      setValidationError('You must confirm self-certification against the Brand Asset Kit.');
      return;
    }

    try {
      const posterDueAt = calculateProposedPosterDueDate(eventDate);
      const createdAt = new Date().toISOString();
      const asset: ContentAsset = {
        id: `cnt_${Date.now()}`,
        organizationId: 'org_mit_adt',
        eventId: `evt_${Date.now()}`,
        title: cleanTitle,
        description: description.trim(),
        category: 'EVENT',
        submitterName: currentUserName,
        submitterRole: roleLabels.DESIGN_LEAD,
        mediaUrl,
        mimeType: 'image/png',
        fileSizeBytes: 2_400_000,
        dimensions: '1920x1080',
        sha256: crypto.randomUUID().replace(/-/g, '').padEnd(64, '0'),
        durationSeconds: 15,
        status: 'pending_president_approval',
        createdAt,
        clubId: currentClub.id,
        clubName: currentClub.name,
        eventDate,
        venue: venue || 'Campus Main Foyer',
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
            comment: 'Uploaded event poster with Brand Asset Kit self-certification.',
            timestamp: createdAt,
          },
        ],
      };
      onAddContent(asset);
      resetComposer();
      setFilter('queue');
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Choose a valid event date.',
      );
    }
  };

  return (
    <div className="cc-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="cc-eyebrow">Multi-Tier Approval Engine</p>
          <h1 className="cc-page-title">Poster Governance & Escalation Queue</h1>
          <p className="cc-page-description">
            Sequential approvals (President → HOD → Admin), 2nd rejection ceiling escalation, and Brand Asset Kit controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBrandKit(true)}
            className="cc-button-secondary"
            title="Download brand logos and placement guidelines"
          >
            <Download className="h-4 w-4" />
            Brand Asset Kit
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={!canSubmit}
            title={
              canSubmit
                ? 'Submit a new event poster'
                : 'Switch to Design Lead to submit a poster'
            }
            className="cc-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Submit Poster
          </button>
        </div>
      </section>

      {/* Escalation Alert Notice if items hit rejection ceiling */}
      {escalatedCount > 0 && (
        <section className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <strong className="text-sm font-semibold text-amber-300">
                {escalatedCount} Poster{escalatedCount > 1 ? 's' : ''} Escalated to Admin (Rejection Ceiling Reached)
              </strong>
              <p className="text-xs text-amber-200/80">
                Posters rejected twice at any stage are auto-escalated straight to Campus Admin to break infinite rejection loops.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilter('escalated')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
          >
            View Escalated Queue
          </button>
        </section>
      )}

      <section
        aria-label="Poster approval hierarchy"
        className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {workflowSteps.map(([id, label, description], index) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl bg-[var(--surface-raised)] p-3"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
              {index + 1}
            </span>
            <span>
              <strong className="block text-sm">{label}</strong>
              <small className="text-[var(--muted-foreground)]">
                {description}
              </small>
            </span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserRoundCheck className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <strong className="block text-sm">
              {currentUserName} · {roleLabels[currentRole]}
            </strong>
            <small className="text-[var(--muted-foreground)]">
              {currentRole === 'ADMIN'
                ? 'Campus Admin override & final approval authority'
                : currentClub?.name}
            </small>
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {canSubmit
            ? 'Upload posters here. President reviews next.'
            : queueCount
              ? `${queueCount} poster${queueCount === 1 ? '' : 's'} waiting in your queue.`
              : 'No items currently awaiting your approval.'}
        </p>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="cc-segmented" role="group" aria-label="Poster filter">
          {[
            ['all', 'All Posters'],
            ['queue', currentRole === 'DESIGN_LEAD' ? 'My Submissions' : 'My Queue'],
            ['escalated', 'Escalated to Admin'],
            ['approved', 'Approved'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id as Filter)}
              className={filter === id ? 'active' : ''}
            >
              {label}
              {id === 'queue' && queueCount > 0 && <span>{queueCount}</span>}
              {id === 'escalated' && escalatedCount > 0 && (
                <span className="bg-amber-500 text-black font-bold px-1.5 rounded-full">{escalatedCount}</span>
              )}
            </button>
          ))}
        </div>
        <label className="cc-search-field">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search posters</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search poster or club"
          />
        </label>
      </section>

      {visible.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((content) => {
            const actionable = canApprove(
              content,
              currentRole,
              currentClubId,
            );
            const approved = content.status === 'approved' || content.status === 'live';
            const isEscalated = content.status === 'escalated_admin';
            const isRecheck = content.isPostApprovalRecheck;

            return (
              <article key={content.id} className={`cc-content-card relative ${isEscalated ? 'border-amber-500/50 bg-amber-950/10' : ''}`}>
                <button
                  type="button"
                  onClick={() => setReviewing(content)}
                  className="relative block aspect-[16/9] w-full overflow-hidden bg-[var(--surface-raised)]"
                >
                  <img
                    src={content.mediaUrl}
                    alt={`Preview of ${content.title}`}
                    onError={(event) => {
                      event.currentTarget.src = fallbackImage;
                    }}
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                  />

                  {/* Status Badge */}
                  <span
                    className={`cc-status absolute left-3 top-3 ${
                      approved
                        ? 'cc-status-success'
                        : isEscalated
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : content.status === 'rejected'
                            ? 'cc-status-danger'
                            : 'cc-status-warning'
                    }`}
                  >
                    {isEscalated
                      ? '⚡ Escalated to Admin (Rejection Ceiling)'
                      : isRecheck
                        ? '🔄 Post-Approval Edit Re-Check'
                        : statusLabels[content.status] || content.status}
                  </span>

                  {content.rejectionCount > 0 && (
                    <span className="absolute right-3 top-3 px-2 py-0.5 rounded bg-rose-500/90 text-white font-mono text-[10px] font-bold">
                      Rejections: {content.rejectionCount}/2
                    </span>
                  )}
                </button>

                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                    {content.clubName ?? 'Campus Office'}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white">
                    {content.title}
                  </h2>

                  {content.eventDate && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-lg bg-[var(--surface-raised)] p-2">
                        <small className="block text-[var(--muted-foreground)]">
                          Event Date
                        </small>
                        <strong className="text-white">{formatDate(content.eventDate)}</strong>
                      </span>
                      <span className="rounded-lg bg-[var(--surface-raised)] p-2">
                        <small className="block text-[var(--muted-foreground)]">
                          Design Due Date
                        </small>
                        <strong className="text-white">{formatDate(content.posterDueAt)}</strong>
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2 border-t border-[var(--border)] pt-3">
                    {actionable && (
                      <button
                        type="button"
                        onClick={() => onAdvanceApproval(content.id)}
                        className="cc-button-primary flex-1"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReviewing(content)}
                      className="cc-button-secondary flex-1"
                    >
                      {actionable ? 'Review & Decision' : 'View History'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="cc-empty-state">
          <ImagePlus className="h-7 w-7" />
          <h2>No posters in this view</h2>
          <p>Switch filters or submit a new event poster.</p>
        </section>
      )}

      {/* Upload Poster Modal */}
      {creating && canSubmit && currentClub && (
        <div
          className="cc-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Submit event poster"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetComposer();
          }}
        >
          <form onSubmit={submitPoster} className="cc-dialog max-w-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="cc-eyebrow">{currentClub.name}</p>
                <h2 className="text-xl font-semibold">Submit Event Poster</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Will enter Stage 1 review with {currentClub.president}.
                </p>
              </div>
              <button
                type="button"
                onClick={resetComposer}
                className="cc-icon-button"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <label className="cc-upload-zone aspect-video">
                  <Upload className="h-6 w-6 text-[var(--accent)]" />
                  <strong>Choose Poster File</strong>
                  <span>PNG or JPG · 1080p 16:9</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!['image/png', 'image/jpeg'].includes(file.type)) {
                        setValidationError('Choose a PNG or JPG image.');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        setValidationError('Poster files must be 10 MB or smaller.');
                        return;
                      }
                      if (mediaUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaUrl);
                      }
                      setMediaUrl(URL.createObjectURL(file));
                      setValidationError(null);
                    }}
                  />
                </label>
                <img
                  src={mediaUrl}
                  alt="Poster preview"
                  className="mt-3 aspect-video w-full rounded-xl border border-[var(--border)] bg-black object-contain"
                />
              </div>

              <div className="space-y-4">
                <label className="cc-field">
                  <span>Poster Title</span>
                  <input
                    required
                    maxLength={120}
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setValidationError(null);
                    }}
                    placeholder="e.g. HackMIT 2026 AI Innovation Sprint"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="cc-field">
                    <span>Event Date</span>
                    <input
                      type="date"
                      required
                      min={tomorrow}
                      value={eventDate}
                      onInput={(event) => {
                        setEventDate(event.currentTarget.value);
                        setValidationError(null);
                      }}
                    />
                  </label>
                  <label className="cc-field">
                    <span>Venue</span>
                    <input
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Tech Block A Foyer"
                    />
                  </label>
                </div>

                {eventDate && (
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                    Proposed poster design due date:{' '}
                    <strong>{calculateProposedPosterDueDate(eventDate)}</strong> (28 days before event).
                  </div>
                )}

                {/* Self-Certification Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-700 bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selfCertified}
                    onChange={(e) => setSelfCertified(e.target.checked)}
                    className="mt-1 rounded text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    <strong>Brand Asset Kit Self-Certification:</strong> I confirm this poster uses approved logos, minimum clear padding (60px), and official university branding.
                  </span>
                </label>

                {validationError && (
                  <p role="alert" className="cc-form-error">
                    {validationError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={resetComposer}
                className="cc-button-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="cc-button-primary">
                <Clock3 className="h-4 w-4" />
                Submit to President
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review & Workflow Modal */}
      {reviewing && (
        <div
          className="cc-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Poster approval workflow"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReviewing(null);
          }}
        >
          <div className="cc-dialog max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`cc-status ${
                    reviewing.status === 'approved'
                      ? 'cc-status-success'
                      : reviewing.status === 'escalated_admin'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : reviewing.status === 'rejected'
                          ? 'cc-status-danger'
                          : 'cc-status-warning'
                  }`}
                >
                  {statusLabels[reviewing.status] || reviewing.status}
                </span>
                <h2 className="mt-3 text-xl font-semibold text-white">{reviewing.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {reviewing.clubName ?? 'Campus Office'} · Event Date:{' '}
                  {formatDate(reviewing.eventDate)} · Venue: {reviewing.venue}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="cc-icon-button"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <img
              src={reviewing.mediaUrl}
              alt={`Preview of ${reviewing.title}`}
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
              className="mt-5 aspect-video w-full rounded-xl bg-black object-contain"
            />

            {/* Approval Stepper */}
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-white">Multi-Tier Approval Chain</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {workflowSteps.map(([id, label], index) => {
                  const complete = stageIndex(reviewing) > index;
                  const current = stageIndex(reviewing) === index;
                  return (
                    <div
                      key={id}
                      className={`rounded-xl border p-3 ${
                        complete
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : current
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-[var(--border)] bg-[var(--surface-raised)]'
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-slate-400" />
                      )}
                      <strong className="mt-2 block text-xs text-white">{label}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History Steps */}
            {reviewing.approvalHistory?.length ? (
              <div className="mt-5 rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-2 max-h-40 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Trail Steps</h4>
                {reviewing.approvalHistory.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 text-xs border-b border-slate-800 pb-2 last:border-0"
                  >
                    <span className="font-semibold text-indigo-300">{step.approverName} ({step.approverRole}):</span>
                    <span className="text-slate-300 flex-1">{step.decision} — {step.comment || 'No comment'}</span>
                    <span className="text-[10px] text-slate-500">{new Date(step.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Rejection Input Section */}
            {showRejectModal ? (
              <div className="mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-3">
                <h4 className="text-sm font-bold text-rose-300">Request Changes / Reject Poster</h4>
                <p className="text-xs text-slate-300">
                  Note: If this is the 2nd rejection, it will auto-escalate straight to Campus Admin.
                </p>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Provide specific required changes (e.g., logo clear space violation, incorrect venue date)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="cc-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!rejectionReasonInput.trim()) return;
                      onRejectContent(reviewing.id, rejectionReasonInput.trim());
                      setShowRejectModal(false);
                      setReviewing(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : canApprove(reviewing, currentRole, currentClubId) ? (
              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="cc-button-secondary text-rose-400 border-rose-500/30 hover:bg-rose-950/30"
                >
                  <XCircle className="h-4 w-4" />
                  Reject / Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAdvanceApproval(reviewing.id);
                    setReviewing(null);
                  }}
                  className="cc-button-primary"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve as {roleLabels[currentRole]}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Brand Asset Kit Modal */}
      {showBrandKit && (
        <div
          className="cc-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Brand Asset Kit & Guidelines"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowBrandKit(false);
          }}
        >
          <div className="cc-dialog w-full max-w-2xl p-0">
            <header className="flex items-center justify-between border-b border-[var(--border)] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <FileCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold sm:text-lg text-white">Official Brand Asset Kit</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    MIT ADT University logo assets, placement rules & safe padding guidelines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandKit(false)}
                className="cc-icon-button"
                aria-label="Close brand kit modal"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-4 p-4 text-xs sm:p-5 text-slate-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                  <strong className="block text-sm font-semibold text-white">16:9 Aspect Ratio</strong>
                  <p className="mt-1 leading-relaxed text-slate-400">
                    Full HD 1920x1080 resolution. PNG or high-quality JPG under 5 MB.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                  <strong className="block text-sm font-semibold text-white">60px Safe Margin</strong>
                  <p className="mt-1 leading-relaxed text-slate-400">
                    Keep logos, date, venue, and QR code 60px away from display screen edges.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 space-y-3">
                <strong className="block text-sm font-semibold text-indigo-300">
                  Download Official Logo Files
                </strong>
                <p className="text-slate-400">
                  Use pre-approved SVG/PNG vectors to ensure instant approval during Admin review.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    download="MIT_ADT_University_Logo.svg"
                    href="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='60' viewBox='0 0 200 60'%3E%3Crect width='200' height='60' rx='8' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2338bdf8' font-family='sans-serif' font-weight='bold' font-size='16'%3EMIT ADT LOGO%3C/text%3E%3C/svg%3E"
                    className="cc-button-secondary text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download SVG Logo
                  </a>
                  <a
                    download="1080p_Poster_Canvas_Guide.png"
                    href={fallbackImage}
                    target="_blank"
                    rel="noreferrer"
                    className="cc-button-secondary text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    1080p Canvas Guidelines
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
