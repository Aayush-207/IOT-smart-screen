import {
  AuditLogRecord,
  Club,
  CompiledManifest,
  ContentAsset,
  Device,
  ScheduleRule,
  TelemetryEvent,
} from './types';

export const CLUBS: Club[] = [
  {
    id: 'club_acm',
    name: 'ACM Student Chapter',
    designLead: 'Aditi Deshmukh',
    president: 'Aditya Patil',
    hod: 'Dr. Neha Kulkarni',
  },
  {
    id: 'club_robotics',
    name: 'Robotics & AI Club',
    designLead: 'Meera Joshi',
    president: 'Rohan Sharma',
    hod: 'Dr. Sameer Shah',
  },
  {
    id: 'club_cultural',
    name: 'Cultural Club',
    designLead: 'Isha Rao',
    president: 'Kabir Mehta',
    hod: 'Prof. Ananya Verma',
  },
];

export const INITIAL_DEVICES: Device[] = [];

export const INITIAL_CONTENT: ContentAsset[] = [];

export const INITIAL_SCHEDULES: ScheduleRule[] = [];

export const MOCK_TELEMETRY: TelemetryEvent[] = [];

export const MOCK_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'aud_init_01',
    organizationId: 'org_mit_adt',
    actor: 'System Initialization',
    action: 'SYSTEM_BOOTSTRAP',
    resource: 'SECURITY_DOMAIN',
    resourceId: 'org_mit_adt',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    ipAddress: '127.0.0.1',
    details: 'AWS IoT Certificate Authority & Cognito JWT Issuer boundary verified.',
  },
  {
    id: 'aud_init_02',
    organizationId: 'org_mit_adt',
    actor: 'Gaurav Khandelwal',
    action: 'RBAC_VERIFY',
    resource: 'USER_ROLE',
    resourceId: 'role_admin',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    ipAddress: '192.168.1.100',
    details: 'Authenticated as Campus Admin. Scope: org_mit_adt full fleet authority.',
  },
];

export const SAMPLE_COMPILED_MANIFEST: CompiledManifest = {
  manifestVersion: 'v1.0.0',
  deviceId: '',
  organizationId: 'org_mit_adt',
  generatedAt: new Date().toISOString(),
  validFrom: new Date().toISOString(),
  validUntil: new Date(Date.now() + 86400000).toISOString(),
  fallbackSlate: {
    mediaUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    durationSeconds: 10
  },
  playlist: []
};
