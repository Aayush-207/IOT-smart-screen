export type OrganizationId = 'org_mit_adt';

export type DeviceStatus = 'ONLINE' | 'STALE' | 'OFFLINE' | 'MAINTENANCE';

export type UserRole =
  | 'DESIGN_LEAD'
  | 'PRESIDENT'
  | 'CLUB_HOD'
  | 'ADMIN'
  | 'COLLEGE_REP'
  | 'VIEWER';

export type ApprovalStage =
  | 'PRESIDENT'
  | 'CLUB_HOD'
  | 'ADMIN'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED_ADMIN';

export type ContentStatus =
  | 'design_in_progress'
  | 'poster_delayed'
  | 'pending_president_approval'
  | 'pending_hod_approval'
  | 'pending_admin_approval'
  | 'escalated_admin'
  | 'approved'
  | 'rejected'
  | 'ineligible'
  | 'live'
  | 'archived';

export type ApprovalDecision =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTO_ESCALATED'
  | 'EDITED_POST_APPROVAL'
  | 'OVERRIDDEN';

export type ScheduleTargetType = 'DEVICE' | 'ZONE' | 'BUILDING' | 'CAMPUS';

export interface Club {
  id: string;
  name: string;
  designLead: string;
  president: string;
  hod: string;
  isHodRequired?: boolean;
}

export interface ApprovalStep {
  id: string;
  contentId: string;
  approverRole: UserRole | string;
  approverUserId?: string;
  approverName: string;
  decision: ApprovalDecision;
  comment?: string;
  timestamp: string;
}

export interface LocationHierarchy {
  campus: string;
  building: string;
  floor: string;
  zone: string;
  locationName: string;
}

export interface Device {
  id: string;
  organizationId: OrganizationId;
  thingName: string;
  displayName: string;
  location: LocationHierarchy;
  ipAddress: string;
  macAddress: string;
  certificateArn: string;
  status: DeviceStatus;
  lastHeartbeatAt: string;
  currentManifestVersion: string;
  appVersion: string;
  storageUsagePct: number;
  temperatureC: number;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  activeContentId?: string;
  isKioskLocked: boolean;
  clockSkewMs?: number;
  syncState?: 'SYNCHRONIZED' | 'OUT_OF_SYNC' | 'OFFLINE';
}

export interface EventItem {
  id: string;
  organizationId: OrganizationId;
  clubId: string;
  clubName: string;
  title: string;
  description: string;
  eventDate: string; // YYYY-MM-DD
  venue: string;
  status: ContentStatus;
  posterDueAt: string; // Event Date - 28 days
  expectedUploadAt?: string;
  designProgress: number; // 0 - 100%
  dueDateReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  externalUrl: string;
  shortCode: string;
  qrAssetUrl: string;
  createdAt: string;
  totalScans: number;
}

export interface ScanEvent {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  deviceId?: string;
  deviceName?: string;
  scannedAt: string;
  userAgent?: string;
  referrer?: string;
}

export interface ContentAsset {
  id: string;
  organizationId: OrganizationId;
  eventId: string;
  title: string;
  description: string;
  category: 'EVENT' | 'ANNOUNCEMENT' | 'EMERGENCY' | 'ACADEMIC';
  submitterName: string;
  submitterRole: string;
  mediaUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  dimensions: string;
  sha256: string;
  durationSeconds: number;
  status: ContentStatus;
  createdAt: string;
  clubId: string;
  clubName: string;
  eventDate: string;
  venue: string;
  displayStartDate?: string;
  approvalStage?: ApprovalStage;
  approvalHistory?: ApprovalStep[];
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  rejectionCount: number;
  selfCertified: boolean;
  posterDueAt: string;
  expectedUploadAt?: string;
  designProgress: number;
  isPostApprovalRecheck?: boolean;
  version: number;
}

export interface ScheduleRule {
  id: string;
  organizationId: OrganizationId;
  title: string;
  contentId: string;
  targetType: ScheduleTargetType;
  targetId: string;
  targetName: string;
  startTime: string;
  endTime: string;
  priority: number; // Higher number = higher precedence (100+ emergency)
  recurrenceRule?: string;
  createdBy: string;
  status:
    | 'ACTIVE'
    | 'SCHEDULED'
    | 'PAUSED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'OVERRIDDEN';
}

export interface PlaybackManifestItem {
  contentId: string;
  eventId: string;
  version: number;
  title: string;
  mediaUrl: string;
  mimeType: string;
  sha256: string;
  durationSeconds: number;
  priority: number;
  registrationShortCode?: string;
  displaySchedule: {
    startTime: string;
    endTime: string;
  };
}

export interface SynchronizedMasterManifest {
  manifestVersion: string;
  organizationId: OrganizationId;
  generatedAt: string;
  activateAt: string;
  validUntil: string;
  payloadHash: string;
  fallbackSlate: {
    mediaUrl: string;
    sha256: string;
    durationSeconds: number;
  };
  playlist: PlaybackManifestItem[];
}

export interface TelemetryEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  contentId: string;
  contentTitle: string;
  timestamp: string;
  result: 'PLAY_SUCCESS' | 'DOWNLOAD_FAILED' | 'CHECKSUM_MISMATCH' | 'CACHE_HIT';
  latencyMs: number;
}

export interface AuditLogRecord {
  id: string;
  organizationId: OrganizationId;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}
