import type {
  ApprovalStage,
  ApprovalStep,
  Club,
  ContentAsset,
  ContentStatus,
  UserRole,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1_000;

export const roleLabels: Record<UserRole, string> = {
  DESIGN_LEAD: 'Design Lead',
  PRESIDENT: 'Club President',
  CLUB_HOD: 'Club HOD',
  ADMIN: 'Campus Admin',
  COLLEGE_REP: 'College Representative',
  VIEWER: 'Campus Viewer',
};

export const statusLabels: Record<ContentStatus, string> = {
  design_in_progress: 'Design in Progress',
  poster_delayed: 'Poster Delayed (Grace/Escalated)',
  pending_president_approval: 'Pending President Approval',
  pending_hod_approval: 'Pending HOD Approval',
  pending_admin_approval: 'Pending Admin Approval',
  escalated_admin: 'Escalated to Admin (2nd Rejection Ceiling)',
  approved: 'Approved for Broadcast',
  rejected: 'Changes Requested',
  ineligible: 'Ineligible (7-Day Cutoff Missed)',
  live: 'Live on Master Playlist',
  archived: 'Archived',
};

export function accountForRole(club: Club, role: UserRole): string {
  if (role === 'DESIGN_LEAD') return club.designLead;
  if (role === 'PRESIDENT') return club.president;
  if (role === 'CLUB_HOD') return club.hod;
  return 'Gaurav Khandelwal (Admin)';
}

/**
 * Calculates proposed poster design due date: 28 days before the event date
 * (21 broadcast days + 7 approval buffer days).
 */
export function calculateProposedPosterDueDate(eventDateStr: string): string {
  const eventDate = new Date(`${eventDateStr}T00:00:00.000Z`);
  if (Number.isNaN(eventDate.getTime())) {
    throw new Error('Event date must be a valid YYYY-MM-DD string.');
  }
  const due = new Date(eventDate.getTime() - 28 * DAY_MS);
  return due.toISOString().split('T')[0];
}

/**
 * Evaluates whether an event is in the 7-day hard cutoff window.
 */
export function isSevenDayCutoffPassed(eventDateStr: string, now = new Date()): boolean {
  const eventDate = new Date(`${eventDateStr}T00:00:00.000Z`).getTime();
  const cutoff = eventDate - 7 * DAY_MS;
  return now.getTime() >= cutoff;
}

/**
 * Evaluates design deadline, grace period, and cutoff status.
 */
export function evaluateWorkflowDeadlineStatus(
  asset: ContentAsset,
  now = new Date(),
): ContentAsset {
  if (asset.status === 'approved' || asset.status === 'live' || asset.status === 'archived') {
    return asset;
  }

  // 1. Check 7-day hard approval cutoff
  if (asset.eventDate && isSevenDayCutoffPassed(asset.eventDate, now)) {
    return {
      ...asset,
      status: 'ineligible',
      rejectionReason: '7-day deadline passed before reaching full approval.',
    };
  }

  // 2. Check event-relative poster due date & grace period
  if (asset.status === 'design_in_progress' && asset.posterDueAt) {
    const dueDate = new Date(`${asset.posterDueAt}T23:59:59.000Z`).getTime();
    const graceExpiry = dueDate + 2 * DAY_MS;
    const eventDate = new Date(`${asset.eventDate}T00:00:00.000Z`).getTime();
    const criticalWindowStart = eventDate - 14 * DAY_MS;

    // Escalated to poster_delayed if past 2-day grace or in critical 14-day window
    if (now.getTime() > graceExpiry || now.getTime() >= criticalWindowStart) {
      return {
        ...asset,
        status: 'poster_delayed',
      };
    }
  }

  return asset;
}

/**
 * Checks if the specified role can approve the asset's current stage.
 */
export function canApprove(
  asset: ContentAsset,
  role: UserRole,
  userClubId?: string,
): boolean {
  if (asset.status === 'approved' || asset.status === 'ineligible' || asset.status === 'archived') {
    return false;
  }

  if (role === 'ADMIN') {
    return (
      asset.status === 'pending_admin_approval' ||
      asset.status === 'escalated_admin' ||
      asset.status === 'poster_delayed'
    );
  }

  if (userClubId && asset.clubId !== userClubId) {
    return false;
  }

  if (role === 'PRESIDENT' && asset.status === 'pending_president_approval') {
    return true;
  }

  if (role === 'CLUB_HOD' && asset.status === 'pending_hod_approval') {
    return true;
  }

  return false;
}

/**
 * Advances content asset through the multi-tier approval state machine.
 */
export function advanceApproval(
  asset: ContentAsset,
  role: UserRole,
  actorName: string,
  comment?: string,
  timestamp = new Date().toISOString(),
): ContentAsset {
  let nextStatus: ContentStatus;
  let nextStage: ApprovalStage;

  if (asset.status === 'pending_president_approval') {
    nextStatus = 'pending_hod_approval';
    nextStage = 'CLUB_HOD';
  } else if (asset.status === 'pending_hod_approval') {
    nextStatus = 'pending_admin_approval';
    nextStage = 'ADMIN';
  } else if (asset.status === 'pending_admin_approval' || asset.status === 'escalated_admin') {
    nextStatus = 'approved';
    nextStage = 'APPROVED';
  } else {
    throw new Error(`Cannot approve asset in status: ${asset.status}`);
  }

  const step: ApprovalStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contentId: asset.id,
    approverRole: role,
    approverName: actorName,
    decision: 'APPROVED',
    comment,
    timestamp,
  };

  return {
    ...asset,
    status: nextStatus,
    approvalStage: nextStage,
    isPostApprovalRecheck: false,
    approvalHistory: [...(asset.approvalHistory ?? []), step],
    ...(nextStatus === 'approved'
      ? { approvedAt: timestamp, approvedBy: actorName }
      : {}),
  };
}

/**
 * Handles rejection with rejection-loop ceiling auto-escalation to Admin.
 */
export function rejectApproval(
  asset: ContentAsset,
  role: UserRole,
  actorName: string,
  comment: string,
  timestamp = new Date().toISOString(),
): ContentAsset {
  const newRejectionCount = (asset.rejectionCount || 0) + 1;
  const isCeilingReached = newRejectionCount >= 2;

  const nextStatus: ContentStatus = isCeilingReached
    ? 'escalated_admin'
    : 'rejected';

  const nextStage: ApprovalStage = isCeilingReached
    ? 'ESCALATED_ADMIN'
    : 'REJECTED';

  const decision = isCeilingReached ? 'AUTO_ESCALATED' : 'REJECTED';
  const effectiveComment = isCeilingReached
    ? `[Rejection Ceiling Reached (${newRejectionCount} Rejections)] Auto-escalated directly to Campus Admin. Feedback: ${comment}`
    : comment;

  const step: ApprovalStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contentId: asset.id,
    approverRole: role,
    approverName: actorName,
    decision,
    comment: effectiveComment,
    timestamp,
  };

  return {
    ...asset,
    status: nextStatus,
    approvalStage: nextStage,
    rejectionCount: newRejectionCount,
    rejectionReason: comment,
    approvalHistory: [...(asset.approvalHistory ?? []), step],
  };
}

/**
 * Handles post-approval edits (date/venue changes). Reverts approved item to pending_admin_approval.
 */
export function handlePostApprovalEdit(
  asset: ContentAsset,
  updatedDate: string,
  updatedVenue: string,
  actorName: string,
  timestamp = new Date().toISOString(),
): ContentAsset {
  const isDateChanged = asset.eventDate !== updatedDate;
  const isVenueChanged = asset.venue !== updatedVenue;

  if (!isDateChanged && !isVenueChanged) {
    return {
      ...asset,
      eventDate: updatedDate,
      venue: updatedVenue,
    };
  }

  // Post-approval edit triggers fast single-stage Admin re-check
  const step: ApprovalStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contentId: asset.id,
    approverRole: 'PRESIDENT',
    approverName: actorName,
    decision: 'EDITED_POST_APPROVAL',
    comment: `Edited metadata after approval (Date: ${asset.eventDate} -> ${updatedDate}, Venue: ${asset.venue} -> ${updatedVenue}). Triggered fast Admin re-check.`,
    timestamp,
  };

  return {
    ...asset,
    eventDate: updatedDate,
    venue: updatedVenue,
    posterDueAt: calculateProposedPosterDueDate(updatedDate),
    status: asset.status === 'approved' ? 'pending_admin_approval' : asset.status,
    approvalStage: asset.status === 'approved' ? 'ADMIN' : asset.approvalStage,
    isPostApprovalRecheck: asset.status === 'approved',
    approvalHistory: [...(asset.approvalHistory ?? []), step],
  };
}

/**
 * Calculates the 21-day synchronized display window and hard cutoff.
 */
export function eventDisplayWindow(eventDateStr: string) {
  const eventDate = new Date(`${eventDateStr}T00:00:00.000Z`);
  const plannedStart = new Date(eventDate.getTime() - 21 * DAY_MS).toISOString().split('T')[0];
  const hardCutoffDate = new Date(eventDate.getTime() - 7 * DAY_MS).toISOString().split('T')[0];
  const endTime = `${eventDateStr}T23:59:59.999Z`;
  return {
    plannedStart,
    effectiveStart: plannedStart,
    hardCutoffDate,
    endTime,
  };
}

/**
 * Generates dynamic QR redirect code.
 */
export function generateShortRedirectCode(eventId: string): string {
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `r_${hash}`;
}

