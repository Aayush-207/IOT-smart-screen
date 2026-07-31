# CampusCast - System Architecture & Component Specification

## 1. System Overview & Architecture Topology

CampusCast is an enterprise IoT digital-signage platform engineered for university campuses. It operates on a prototype-first, production-shaped topology:

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
                                      [ Android Kiosk Fleet ]
```

### Component Responsibilities:
- **Core API Service**: Handles Cognito token authentication, PostgreSQL RBAC, content submissions, approval workflows, location/zone management, and scheduling.
- **Worker Service**: Executes media quarantine scanning, thumbnail normalization, deterministic schedule manifest compilation, and alert notifications.
- **IoT Gateway Service**: Manages mutual-TLS (X.509) connections to AWS IoT Core / MQTT Broker, synchronizes Named Device Shadows, and ingests telemetry.
- **Android Kiosk Client**: Kotlin lock-task kiosk application utilizing Room DB for local caching, WorkManager for downloads, and ExoPlayer for presentation.

---

## 2. Multi-Tenant Data Schema & Boundaries

Every entity contains an immutable `organization_id` (Tenant scope). For the pilot, `organization_id = "org_mit_adt"`.

### Core Data Models:
1. **Organization**: `id`, `name`, `code`, `settings`, `created_at`
2. **Location Hierarchy**: `Organization` -> `Campus` -> `Building` -> `Floor` -> `Zone` -> `Location`
3. **User & Identity**: `id`, `organization_id`, `cognito_sub`, `email`, `role`, `department_id`, `status`
4. **Device Inventory**: `id`, `organization_id`, `location_id`, `thing_name`, `certificate_arn`, `mac_address`, `status` (`ONLINE`, `STALE`, `OFFLINE`, `MAINTENANCE`), `last_heartbeat_at`, `current_manifest_version`
5. **Content Asset**: `id`, `organization_id`, `submitter_id`, `title`, `description`, `media_url`, `media_type`, `sha256`, `status` (`AWAITING_POSTER`, `QUARANTINED`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `INELIGIBLE`, `EXPIRED`)

### 2.1 Multi-Tier Poster Approval & Time-Gated Broadcast Engine:
- **Event Creation**: Created by Club President (`AWAITING_POSTER`).
- **Brand Kit & Poster Upload**: Club Design Lead downloads official Brand Asset Kit and attaches poster (`PENDING_APPROVAL`, stage: `PRESIDENT`).
- **Sequential Approval Chain**: `Club President` -> `Club HOD` -> `Campus Admin` -> `APPROVED`. Rejection resets to `PRESIDENT` stage and requires re-upload.
- **Continuous 21-Day Broadcast Window**: Approved events inside the 21-day event window are automatically compiled into active kiosk manifests.
- **7-Day Hard Cutoff Deadline**: Unapproved posters for events < 7 days away automatically transition to `INELIGIBLE`. Only Campus Admin can override `INELIGIBLE` assets.

---

## 3. Device Communication Protocol & Manifest Specification

### MQTT Topic Hierarchy:
- **Heartbeat & Telemetry**: `campuscast/org/{orgId}/device/{deviceId}/telemetry`
- **Reported State**: `campuscast/org/{orgId}/device/{deviceId}/state/reported`
- **Desired State & Manifest Push**: `campuscast/org/{orgId}/device/{deviceId}/state/desired`
- **Command Acknowledgment**: `campuscast/org/{orgId}/device/{deviceId}/commands/ack`

### Deterministic Playback Manifest JSON Schema:
```json
{
  "$schema": "https://campuscast.edu/schemas/manifest.v1.json",
  "manifestVersion": "1.0.4",
  "deviceId": "dev_block_a_f1_01",
  "organizationId": "org_mit_adt",
  "generatedAt": "2026-07-30T11:30:00Z",
  "validFrom": "2026-07-30T11:30:00Z",
  "validUntil": "2026-07-31T23:59:59Z",
  "fallbackSlate": {
    "mediaUrl": "https://cdn.campuscast.edu/default/university_logo_slate.png",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "durationSeconds": 10
  },
  "playlist": [
    {
      "contentId": "cnt_event_techfest_2026",
      "version": 2,
      "mediaUrl": "https://cdn.campuscast.edu/assets/techfest_poster_v2.png",
      "mimeType": "image/png",
      "sha256": "8a719d3f112233445566778899aabbccddeeff00112233445566778899aabbcc",
      "sizeBytes": 2450120,
      "durationSeconds": 15,
      "priority": 10,
      "displaySchedule": {
        "startTime": "2026-07-30T09:00:00Z",
        "endTime": "2026-07-30T18:00:00Z"
      }
    }
  ]
}
```

---

## 4. Conflict Precedence & Schedule Engine Rules

When multiple active schedules target the same device simultaneously, the compiler resolves content order using explicit strict precedence:

1. **Emergency Overrides**: `priority >= 100` immediately clears default playlists and displays emergency alert.
2. **Explicit Priority**: Higher numeric priority value takes precedence (`10` > `1`).
3. **Target Specificity**: Direct device targeting (`DEVICE`) > `ZONE` > `BUILDING` > `CAMPUS`.
4. **Latest Approved Revision**: If priority and specificity are tied, the most recently updated content revision is played.

---

## 5. Security & Threat Controls

- **Device Identity**: X.509 Certificate mutual TLS authentication bound strictly to AWS IoT Thing identity.
- **Upload Quarantine**: All incoming user media is uploaded to isolated S3 Quarantine bucket. Media processing worker validates MIME type, checksum, dimensions, and performs malware scan before moving to Production CDN bucket.
- **Audit Immutability**: All security-sensitive actions (`APPROVE_CONTENT`, `REJECT_CONTENT`, `TRIGGER_OTA`, `UPDATE_ROLE`) append to `audit_logs` table with actor, IP, timestamp, and diff payload.
