import type {
  ApprovalStage,
  Club,
  ContentAsset,
  UserRole,
} from './types';

const dayMs = 24 * 60 * 60 * 1_000;

export const roleLabels: Record<UserRole, string> = {
  DESIGN_LEAD: 'Design Lead',
  PRESIDENT: 'Club President',
  CLUB_HOD: 'Club HOD',
  ADMIN: 'Campus Admin',
};

export const approvalStageLabels: Record<ApprovalStage, string> = {
  PRESIDENT: 'President review',
  CLUB_HOD: 'Club HOD review',
  ADMIN: 'Admin review',
  APPROVED: 'Approved',
  REJECTED: 'Changes requested',
};

export function accountForRole(club: Club, role: UserRole): string {
  if (role === 'DESIGN_LEAD') return club.designLead;
  if (role === 'PRESIDENT') return club.president;
  if (role === 'CLUB_HOD') return club.hod;
  return 'Gaurav Khandelwal';
}

export function canApprove(
  asset: ContentAsset,
  role: UserRole,
  clubId: string,
): boolean {
  if (asset.status !== 'PENDING_APPROVAL') return false;
  if (role === 'ADMIN') return asset.approvalStage === 'ADMIN';
  if (asset.clubId !== clubId) return false;
  return (
    (role === 'PRESIDENT' && asset.approvalStage === 'PRESIDENT') ||
    (role === 'CLUB_HOD' && asset.approvalStage === 'CLUB_HOD')
  );
}

export function advanceApproval(
  asset: ContentAsset,
  role: UserRole,
  clubId: string,
  actorName: string,
  timestamp = new Date().toISOString(),
): ContentAsset {
  if (!canApprove(asset, role, clubId)) {
    throw new Error('This role cannot approve the current workflow stage.');
  }

  const nextStage: ApprovalStage =
    role === 'PRESIDENT'
      ? 'CLUB_HOD'
      : role === 'CLUB_HOD'
        ? 'ADMIN'
        : 'APPROVED';

  return {
    ...asset,
    status: nextStage === 'APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL',
    approvalStage: nextStage,
    approvalHistory: [
      ...(asset.approvalHistory ?? []),
      {
        stage: role,
        actorName,
        action: 'APPROVED',
        timestamp,
      },
    ],
    ...(nextStage === 'APPROVED'
      ? { approvedAt: timestamp, approvedBy: actorName }
      : {}),
  };
}

export function eventDisplayWindow(
  eventDate: string,
  now = new Date(),
): {
  plannedStart: string;
  effectiveStart: string;
  endTime: string;
} {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error('Event date must use YYYY-MM-DD.');
  }
  const eventStart = new Date(`${eventDate}T00:00:00.000Z`);
  const eventEnd = new Date(`${eventDate}T23:59:59.999Z`);
  if (Number.isNaN(eventStart.getTime()) || eventEnd <= now) {
    throw new Error('Event date must be in the future.');
  }

  const plannedStart = new Date(eventStart.getTime() - 21 * dayMs);
  return {
    plannedStart: plannedStart.toISOString(),
    effectiveStart:
      plannedStart > now ? plannedStart.toISOString() : now.toISOString(),
    endTime: eventEnd.toISOString(),
  };
}
