-- CampusCast Production PostgreSQL DDL Schema (Updated Master Plan)
-- Multi-tenant digital signage database schema with organization_id boundaries

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenants)
CREATE TABLE organizations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Location Hierarchy
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campus VARCHAR(128) NOT NULL,
  building VARCHAR(128) NOT NULL,
  floor VARCHAR(64) NOT NULL,
  zone VARCHAR(128) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_org ON locations(organization_id);

-- 3. Users & Identity Roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cognito_sub VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL CHECK (role IN (
    'DESIGN_LEAD', 'PRESIDENT', 'CLUB_HOD', 'ADMIN', 'COLLEGE_REP', 'VIEWER'
  )),
  department_id VARCHAR(128),
  club_id VARCHAR(128),
  status VARCHAR(32) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_org_sub ON users(organization_id, cognito_sub);

-- 4. Clubs & Departments
CREATE TABLE clubs (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  design_lead_user_id UUID REFERENCES users(id),
  president_user_id UUID REFERENCES users(id),
  hod_user_id UUID REFERENCES users(id),
  is_hod_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Events Calendar (With Event-Relative Poster Deadline & Progress Tracking)
CREATE TABLE events (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  club_id VARCHAR(64) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  venue VARCHAR(255) NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'design_in_progress' CHECK (status IN (
    'design_in_progress', 'poster_delayed', 'pending_president_approval',
    'pending_hod_approval', 'pending_admin_approval', 'escalated_admin',
    'approved', 'rejected', 'ineligible', 'live', 'archived'
  )),
  poster_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_upload_at TIMESTAMP WITH TIME ZONE,
  design_progress INT DEFAULT 0 CHECK (design_progress BETWEEN 0 AND 100),
  due_date_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_club_date ON events(club_id, event_date);

-- 6. Content Items / Assets (With Rejection-Loop Ceiling Counter)
CREATE TABLE content_items (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/png',
  file_size_bytes BIGINT NOT NULL,
  dimensions VARCHAR(32) NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  duration_seconds INT DEFAULT 15,
  status VARCHAR(64) NOT NULL DEFAULT 'design_in_progress' CHECK (status IN (
    'design_in_progress', 'poster_delayed', 'pending_president_approval',
    'pending_hod_approval', 'pending_admin_approval', 'escalated_admin',
    'approved', 'rejected', 'ineligible', 'live', 'archived'
  )),
  submitted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_count INT DEFAULT 0,
  rejection_reason TEXT,
  self_certified BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_event_status ON content_items(event_id, status);

-- 7. Approval Steps Audit Trail
CREATE TABLE approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  approver_role VARCHAR(64) NOT NULL,
  approver_user_id UUID REFERENCES users(id),
  approver_name VARCHAR(255) NOT NULL,
  decision VARCHAR(64) NOT NULL CHECK (decision IN (
    'SUBMITTED', 'APPROVED', 'REJECTED', 'AUTO_ESCALATED', 'EDITED_POST_APPROVAL', 'OVERRIDDEN'
  )),
  comment TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_steps_content ON approval_steps(content_id);

-- 8. QR Registrations (Short Link Redirects)
CREATE TABLE registrations (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  external_url TEXT NOT NULL,
  short_code VARCHAR(32) NOT NULL UNIQUE,
  qr_asset_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_code ON registrations(short_code);

-- 9. QR Scan Events Analytics (Per-Device Attribution)
CREATE TABLE scan_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  registration_id VARCHAR(64) NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  device_id VARCHAR(64) REFERENCES devices(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_scan_events_reg_device ON scan_events(registration_id, device_id);

-- 10. Device Inventory & IoT Credentials
CREATE TABLE devices (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  thing_name VARCHAR(128) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  mac_address VARCHAR(17) NOT NULL,
  certificate_arn VARCHAR(255) NOT NULL,
  status VARCHAR(32) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'STALE', 'OFFLINE', 'MAINTENANCE')),
  current_manifest_version VARCHAR(32) DEFAULT 'v1.0.0',
  app_version VARCHAR(32) NOT NULL,
  storage_usage_pct INT DEFAULT 0,
  temperature_c INT DEFAULT 35,
  orientation VARCHAR(16) DEFAULT 'LANDSCAPE',
  last_heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Synchronized Playback Manifest History
CREATE TABLE playlist_manifests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  manifest_version VARCHAR(32) NOT NULL UNIQUE,
  activate_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  playlist_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Device Logs & Synchronized Manifest Acknowledgements
CREATE TABLE device_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  manifest_version VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('ACKNOWLEDGED', 'OUT_OF_SYNC', 'DOWNLOAD_FAILED')),
  clock_skew_ms INT DEFAULT 0,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
