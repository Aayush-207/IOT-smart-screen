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

export const MOCK_AUDIT_LOGS: AuditLogRecord[] = [];

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
