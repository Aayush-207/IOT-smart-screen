-- CampusCast Production PostgreSQL DDL Schema
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
    'PLATFORM_ADMIN', 'ORG_ADMIN', 'CONTENT_APPROVER', 
    'COLLEGE_REP', 'CLUB_REP', 'FACILITIES_OPERATOR', 'ANALYST'
  )),
  department VARCHAR(128),
  status VARCHAR(32) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_org_sub ON users(organization_id, cognito_sub);

-- 4. Device Inventory & IoT Credentials
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

CREATE INDEX idx_devices_org_status ON devices(organization_id, status);

-- 5. Content Assets & Quarantine Lifecycle
CREATE TABLE content_assets (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(32) NOT NULL CHECK (category IN ('EVENT', 'ANNOUNCEMENT', 'EMERGENCY', 'ACADEMIC')),
  media_url TEXT NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  dimensions VARCHAR(32) NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  duration_seconds INT DEFAULT 15,
  status VARCHAR(32) DEFAULT 'QUARANTINED' CHECK (status IN ('QUARANTINED', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED')),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_org_status ON content_assets(organization_id, status);

-- 6. Schedule Rules
CREATE TABLE schedule_rules (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_type VARCHAR(32) NOT NULL CHECK (target_type IN ('DEVICE', 'ZONE', 'BUILDING', 'CAMPUS')),
  target_id VARCHAR(128) NOT NULL,
  target_name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INT DEFAULT 10,
  recurrence_rrul VARCHAR(255),
  status VARCHAR(32) DEFAULT 'ACTIVE',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_org_dates ON schedule_rules(organization_id, start_time, end_time);

-- 7. Compiled Playback Manifest History
CREATE TABLE compiled_manifests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  manifest_version VARCHAR(32) NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  items_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manifests_device_ver ON compiled_manifests(device_id, manifest_version);

-- 8. Raw Ingested Telemetry Events (Partitioned by Month)
CREATE TABLE telemetry_events (
  id UUID DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL,
  device_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  result VARCHAR(32) NOT NULL,
  latency_ms INT DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- 9. Append-Only Security Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(64) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(128) NOT NULL,
  resource VARCHAR(128) NOT NULL,
  resource_id VARCHAR(128) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_org_actor ON audit_logs(organization_id, actor);
