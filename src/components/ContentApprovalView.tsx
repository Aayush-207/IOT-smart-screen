import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Search,
  ShieldCheck,
  Upload,
  UserRoundCheck,
  X,
  XCircle,
} from 'lucide-react';

import type { Club, ContentAsset, UserRole } from '../types';
import {
  approvalStageLabels,
  canApprove,
  eventDisplayWindow,
  roleLabels,
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

type Filter = 'all' | 'queue' | 'approved';

const fallbackImage =
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=85';

const workflowSteps = [
  ['DESIGN_LEAD', 'Design Lead', 'Submits poster'],
  ['PRESIDENT', 'President', 'Checks club details'],
  ['CLUB_HOD', 'Club HOD', 'Verifies the event'],
  ['ADMIN', 'Campus Admin', 'Final approval'],
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
  if (asset.approvalStage === 'PRESIDENT') return 1;
  if (asset.approvalStage === 'CLUB_HOD') return 2;
  if (asset.approvalStage === 'ADMIN') return 3;
  if (asset.approvalStage === 'APPROVED') return 4;
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
  const [reviewing, setReviewing] = useState<ContentAsset | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [mediaUrl, setMediaUrl] = useState(fallbackImage);
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
          (filter === 'approved' && content.status === 'APPROVED');
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

  const resetComposer = () => {
    if (mediaUrl.startsWith('blob:')) URL.revokeObjectURL(mediaUrl);
    setCreating(false);
    setTitle('');
    setDescription('');
    setEventDate('');
    setMediaUrl(fallbackImage);
    setValidationError(null);
  };

  const submitPoster = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !eventDate || !currentClub) {
      setValidationError('Add the poster title and event date.');
      return;
    }

    try {
      const window = eventDisplayWindow(eventDate);
      const createdAt = new Date().toISOString();
      const asset: ContentAsset = {
        id: `cnt_${Date.now()}`,
        organizationId: 'org_mit_adt',
        title: cleanTitle,
        description: description.trim(),
        category: 'EVENT',
        submitterName: currentUserName,
        submitterRole: roleLabels.DESIGN_LEAD,
        mediaUrl,
        mimeType: 'image/jpeg',
        fileSizeBytes: 2_400_000,
        dimensions: '1920x1080',
        sha256: crypto.randomUUID().replace(/-/g, '').padEnd(64, '0'),
        durationSeconds: 15,
        status: 'PENDING_APPROVAL',
        createdAt,
        clubId: currentClub.id,
        clubName: currentClub.name,
        eventDate,
        displayStartDate: window.plannedStart,
        approvalStage: 'PRESIDENT',
        approvalHistory: [
          {
            stage: 'DESIGN_LEAD',
            actorName: currentUserName,
            action: 'SUBMITTED',
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
          <p className="cc-eyebrow">Poster workflow</p>
          <h1 className="cc-page-title">Club event posters</h1>
          <p className="cc-page-description">
            Every poster follows the same verified path before reaching a screen.
          </p>
        </div>
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
          Submit poster
        </button>
      </section>

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
                ? 'Final approval queue across all clubs'
                : currentClub?.name}
            </small>
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {canSubmit
            ? 'Submit posters here. Your President reviews them next.'
            : queueCount
              ? `${queueCount} poster${queueCount === 1 ? '' : 's'} waiting for you.`
              : 'Nothing is waiting for your approval.'}
        </p>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="cc-segmented" role="group" aria-label="Poster filter">
          {[
            ['all', 'All posters'],
            ['queue', currentRole === 'DESIGN_LEAD' ? 'My submissions' : 'My queue'],
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
            const approved = content.status === 'APPROVED';
            return (
              <article key={content.id} className="cc-content-card">
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
                  <span
                    className={`cc-status absolute left-3 top-3 ${
                      approved
                        ? 'cc-status-success'
                        : content.status === 'REJECTED'
                          ? 'cc-status-danger'
                          : 'cc-status-warning'
                    }`}
                  >
                    {content.approvalStage
                      ? approvalStageLabels[content.approvalStage]
                      : approved
                        ? 'Approved'
                        : 'Review required'}
                  </span>
                </button>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                    {content.clubName ?? 'Campus office'}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
                    {content.title}
                  </h2>
                  {content.eventDate && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-lg bg-[var(--surface-raised)] p-2">
                        <small className="block text-[var(--muted-foreground)]">
                          Event
                        </small>
                        <strong>{formatDate(content.eventDate)}</strong>
                      </span>
                      <span className="rounded-lg bg-[var(--surface-raised)] p-2">
                        <small className="block text-[var(--muted-foreground)]">
                          Display starts
                        </small>
                        <strong>{formatDate(content.displayStartDate)}</strong>
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
                      {actionable ? 'Review' : 'View workflow'}
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
                <h2 className="text-xl font-semibold">Submit event poster</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  It will go to {currentClub.president} for the first review.
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
                  <strong>Choose poster</strong>
                  <span>PNG or JPG · maximum 10 MB</span>
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
                  <span>Poster title</span>
                  <input
                    required
                    maxLength={120}
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setValidationError(null);
                    }}
                    placeholder="e.g. Robotics Expo 2026"
                  />
                </label>
                <label className="cc-field">
                  <span>Event date</span>
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
                  {eventDate && (
                    <small>
                      Screen campaign starts{' '}
                      {formatDate(eventDisplayWindow(eventDate).plannedStart)} —
                      exactly 21 days before the event.
                    </small>
                  )}
                </label>
                <label className="cc-field">
                  <span>
                    Event details <small>Optional</small>
                  </span>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Venue, registration details, or important instructions"
                  />
                </label>
                {validationError && (
                  <p role="alert" className="cc-form-error">
                    {validationError}
                  </p>
                )}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-xs text-[var(--muted-foreground)]">
                  <ShieldCheck className="mr-2 inline h-4 w-4 text-[var(--accent)]" />
                  President → Club HOD → Campus Admin. No stage can be skipped.
                </div>
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
                Send to President
              </button>
            </div>
          </form>
        </div>
      )}

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
                    reviewing.status === 'APPROVED'
                      ? 'cc-status-success'
                      : reviewing.status === 'REJECTED'
                        ? 'cc-status-danger'
                        : 'cc-status-warning'
                  }`}
                >
                  {reviewing.approvalStage
                    ? approvalStageLabels[reviewing.approvalStage]
                    : reviewing.status}
                </span>
                <h2 className="mt-3 text-xl font-semibold">{reviewing.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {reviewing.clubName ?? 'Campus office'} · Event{' '}
                  {formatDate(reviewing.eventDate)}
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

            <div className="mt-5">
              <h3 className="text-sm font-semibold">Approval progress</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {workflowSteps.map(([id, label], index) => {
                  const complete = stageIndex(reviewing) > index;
                  const current = stageIndex(reviewing) === index;
                  return (
                    <div
                      key={id}
                      className={`rounded-xl border p-3 ${
                        complete
                          ? 'border-[var(--success)] bg-[var(--success-soft)]'
                          : current
                            ? 'border-[var(--warning)] bg-[var(--warning-soft)]'
                            : 'border-[var(--border)] bg-[var(--surface-raised)]'
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-[var(--muted-foreground)]" />
                      )}
                      <strong className="mt-2 block text-xs">{label}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {reviewing.approvalHistory?.length ? (
              <div className="mt-5 rounded-xl bg-[var(--surface-raised)] p-3">
                {reviewing.approvalHistory.map((record) => (
                  <div
                    key={`${record.stage}-${record.timestamp}`}
                    className="flex items-center gap-3 border-b border-[var(--border)] py-2 last:border-0"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    <span className="min-w-0 flex-1 text-xs">
                      <strong className="block">{record.actorName}</strong>
                      <small className="text-[var(--muted-foreground)]">
                        {record.action.toLowerCase()} as{' '}
                        {roleLabels[record.stage]}
                      </small>
                    </span>
                    <small className="text-[var(--muted-foreground)]">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            ) : null}

            {reviewing.description && (
              <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                {reviewing.description}
              </p>
            )}

            {canApprove(reviewing, currentRole, currentClubId) && (
              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onRejectContent(
                      reviewing.id,
                      `Changes requested by ${currentUserName}.`,
                    );
                    setReviewing(null);
                  }}
                  className="cc-button-secondary text-[var(--danger)]"
                >
                  <XCircle className="h-4 w-4" />
                  Request changes
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
