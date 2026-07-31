# CampusCast - System Architecture & Component Specification
## IoT Smart Digital Billboard Network — Full System Design & Workflow

### 1. Executive Summary & Overview
CampusCast is an enterprise IoT digital-signage platform engineered for university campuses (MIT ADT University CRIeSP Academic IoT Project). The platform replaces static printed event posters with a network of IoT-connected digital displays centrally managed via AWS cloud services.

Unlike simple upload-and-approve models, content flow is tied directly to student organization operations:
1. Event calendared first.
2. Poster produced against official Brand Asset Kit guidelines.
3. Multi-stage approval chain (Design Lead -> Club President -> Club HOD -> Campus Admin).
4. Automatic time-gated broadcast window (21-day rolling window).
5. Automatic 7-day cutoff for unapproved posters (`INELIGIBLE`).
6. Rejection-loop ceiling (auto-escalation to Admin after 2nd rejection).
7. Campus-wide synchronized playback manifest across all physical screens.
8. Dynamic QR overlay per screen with HTTP 302 redirect tracking for scan analytics (`registrations` & `scan_events`).
9. Post-approval edit re-check workflow (`pending_admin_approval` fast single-stage re-check for date/venue changes).

```
[ Dashboard UI (Next.js) ] <--- REST API / JSON ---> [ Core API Service (Express/Node.js) ]
                                                             |
                                                  +----------+----------+
                                                  |                     |
                                           [ PostgreSQL ]         [ Redis / BullMQ ]
                                           (Identity, DB)        (Jobs, Worker Queue)
                                                  |                     |
                                       [ IoT Gateway Service ] <---+----+
                                                  |
                                          (MQTT / TLS v1.3)
                                                  |
                                       [ Android Kiosk Fleet ] (Per-Screen Dynamic QR Overlay)
```

### Component Responsibilities:
- **Core API Service**: Handles Cognito token authentication, PostgreSQL RBAC, content submissions, approval workflows with rejection ceilings, QR redirect routes, location/zone management, and scheduling.
- **Worker Service**: Executes media quarantine scanning, thumbnail normalization, event-relative poster deadline checks, deterministic schedule manifest compilation, and alert notifications.
- **IoT Gateway Service**: Manages mutual-TLS (X.509) connections to AWS IoT Core / MQTT Broker, synchronizes Named Device Shadows, and ingests telemetry.
- **Android Kiosk Client**: Kotlin lock-task kiosk application rendering synchronized master playlist with dynamic screen-specific QR overlay, Room DB for local caching, WorkManager for downloads, and ExoPlayer for presentation.

---

## 2. Multi-Tenant Data Schema & Boundaries

Every entity contains an immutable `organization_id` (Tenant scope). For the pilot, `organization_id = "org_mit_adt"`.

### Core Data Models:
1. **Organization**: `id`, `name`, `code`, `settings`, `created_at`
2. **Event**: `id`, `club_id`, `title`, `date`, `venue`, `status`, `poster_due_at`, `expected_upload_at`, `design_progress`, `due_date_reason`
3. **Content Item / Asset**: `id`, `event_id`, `media_url`, `status` (`design_in_progress`, `poster_delayed`, `pending_president_approval`, `pending_hod_approval`, `pending_admin_approval`, `escalated_admin`, `approved`, `rejected`, `ineligible`, `live`, `archived`), `submitted_by`, `approved_by`, `rejection_count`
4. **Approval Steps**: `id`, `content_id`, `approver_role`, `approver_user_id`, `decision`, `comment`, `timestamp`
5. **Registrations**: `id`, `event_id`, `external_url`, `short_code`, `qr_asset_url`, `created_at`
6. **Scan Events**: `id`, `registration_id`, `device_id` (nullable), `scanned_at`, `user_agent`
7. **Device Inventory**: `id`, `organization_id`, `location_id`, `thing_name`, `certificate_arn`, `mac_address`, `status` (`ONLINE`, `STALE`, `OFFLINE`, `MAINTENANCE`), `last_heartbeat_at`, `current_manifest_version`

---

## 3. End-to-End Workflow & State Machine

```
[Event Creation] (status: Awaiting Poster / Design in Progress, proposed poster due date = Event Date - 28 days)
       |
       v
[Poster Upload & Self-Cert] ---> [President Review] ---> [HOD Review] ---> [Admin Review] ---> [Approved]
       |                                |                      |                 |                 |
       +<-- Rejection (Count 1) --------+----------------------+-----------------+                 v
       |                                                                                    [21-Day Broadcast Manifest]
       v                                                                                           |
 [Rejection Count >= 2] -------------> Auto-Escalate to Admin (status: escalated_admin)             v
                                                                                            [Synchronized Playback]
                                                                                             (Dynamic Screen QR)
```

### Key Workflow Controls:
- **Event-Relative Poster Design Deadline**: Proposed poster due date set to 28 days before event (21 broadcast days + 7 approval days). 2-day grace period after due date before escalation to Admin (`poster_delayed`). Immediate escalation if event is within critical 14-day window.
- **Rejection Loop Ceiling**: 2nd rejection at any stage triggers status `escalated_admin`, bypassing repeat loop to President/HOD and routing straight to Admin.
- **Post-Approval Edit Re-Check**: Editing date or venue on an `approved` event automatically reverts status to `pending_admin_approval` (fast single-stage re-check) and logs a `edited-post-approval` entry in `approval_steps`.
- **7-Day Hard Cutoff**: Unapproved content for events within 7 days automatically transitions to `ineligible`. Only Campus Admin can override.

---

## 4. QR Registration & Scan Analytics Layer

1. **Short Redirect Code**: Platform generates short code (e.g. `campusiot.app/r/AB12X7`) linked to the club's target URL (Google Form, Unstop, website).
2. **Dynamic Per-Screen Overlay**: Displays the same master poster artwork across screens, with bottom-corner QR code injected per-screen with distinct `device_id` param.
3. **Stateless Redirect Service**: Scanning QR hits platform `/r/:code?device_id=X`, logs row into `scan_events`, and performs HTTP 302 redirect to club destination.
4. **Analytics View**: Tracks scan counts per event, breakdown per screen/location, and scan conversion trend across the 21-day window.

---

## 5. Device Communication & Synchronized Master Playlist

- **Synchronized Playback**: All online screens follow the same versioned master playlist manifest published via AWS IoT Core / S3 CDN.
- **Deterministic Manifest**: Generated by background scheduling service; specifies asset order, duration, valid window, sha256 checksums, and fallbacks.
- **MQTT Topics**:
  - `campuscast/org/{orgId}/device/{deviceId}/telemetry`
  - `campuscast/org/{orgId}/device/{deviceId}/state/reported`
  - `campuscast/org/{orgId}/device/{deviceId}/state/desired`
  - `campuscast/org/{orgId}/device/{deviceId}/commands/ack`
- **Emergency Overrides**: `priority >= 100` instantly clears default playlists campus-wide.

---

## 6. System Layers & Security Controls

| Layer | Primary Responsibilities |
|---|---|
| 1. Authoring | Event calendar creation, poster upload, Brand Asset Kit download & self-certification |
| 2. Workflow Engine | Approval routing (President -> HOD -> Admin), rejection ceiling escalation, design deadlines, notifications, audit logging |
| 3. Cloud Platform | REST API, PostgreSQL database, BullMQ scheduler, master manifest compiler, QR redirect & scan analytics, S3 media storage |
| 4. Device Messaging | AWS IoT Core MQTT broker, mTLS X.509 certs, device shadows, health telemetry |
| 5. Display Nodes | Android Kiosk displays rendering synchronized master playlist with dynamic QR overlay & offline local cache |

- **Security & Threat Controls**: X.509 mutual TLS device authentication, S3 Quarantine bucket scanning, append-only security audit log (`approval_steps` & `audit_logs`).
