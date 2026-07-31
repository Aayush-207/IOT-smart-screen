export type OrganizationId = 'org_mit_adt';

export type DeviceStatus = 'ONLINE' | 'STALE' | 'OFFLINE' | 'MAINTENANCE';

export type UserRole = 'DESIGN_LEAD' | 'PRESIDENT' | 'CLUB_HOD' | 'ADMIN';

export type ApprovalStage =
  | 'PRESIDENT'
  | 'CLUB_HOD'
  | 'ADMIN'
  | 'APPROVED'
  | 'REJECTED';

export type ContentStatus = 
  | 'AWAITING_POSTER'
  | 'QUARANTINED'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'INELIGIBLE'
  | 'EXPIRED';

export type ScheduleTargetType = 'DEVICE' | 'ZONE' | 'BUILDING' | 'CAMPUS';

export interface Club {
  id: string;
  name: string;
  designLead: string;
  president: string;
  hod: string;
}

export interface ApprovalRecord {
  stage: 'DESIGN_LEAD' | 'PRESIDENT' | 'CLUB_HOD' | 'ADMIN';
  actorName: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  timestamp: string;
  note?: string;
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
}

export interface ContentAsset {
  id: string;
  organizationId: OrganizationId;
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
  clubId?: string;
  clubName?: string;
  eventDate?: string;
  displayStartDate?: string;
  approvalStage?: ApprovalStage;
  approvalHistory?: ApprovalRecord[];
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
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
  version: number;
  title: string;
  mediaUrl: string;
  mimeType: string;
  sha256: string;
  durationSeconds: number;
  priority: number;
  displaySchedule: {
    startTime: string;
    endTime: string;
  };
}

export interface CompiledManifest {
  manifestVersion: string;
  deviceId: string;
  organizationId: OrganizationId;
  generatedAt: string;
  validFrom: string;
  validUntil: string;
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
