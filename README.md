# 📺 CampusCast — Enterprise IoT Digital Signage Network

[![Build Status](https://img.shields.io/badge/Build-Passing-1f8a65?style=flat-square)](https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-f54e00?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?style=flat-square)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**CampusCast** is an enterprise-grade, offline-resilient IoT digital signage and campus billboard management platform engineered for university campuses, corporate headquarters, and high-density display networks. It governs the end-to-end event broadcast lifecycle—from institutional Single Sign-On (SSO) authentication and event submission to multi-stage departmental approval chains, SHA-256 cryptographic asset checksum verification, automatic 21-day scheduling, and autonomous offline kiosk playback.

---

## 📋 Table of Contents
- [🏛️ System Architecture](#-system-architecture)
- [⭐ Core Platform Features](#-core-platform-features)
- [🔄 Complete 27-Step End-to-End Workflow](#-complete-27-step-end-to-end-workflow)
- [🗄️ Database Schema & Data Models](#-database-schema--data-models)
- [🔌 Detailed RESTful API Specification](#-detailed-restful-api-specification)
- [📴 Offline Resilience & Kiosk Storage Engine](#-offline-resilience--kiosk-storage-engine)
- [🛡️ Immutable Append-Only Audit Logging](#️-immutable-append-only-audit-logging)
- [🛠️ Local Installation & Setup](#️-local-installation--setup)
- [💻 Test Roles & Authentication Matrix](#-test-roles--authentication-matrix)
- [📺 Physical Kiosk Deployment Guide](#-physical-kiosk-deployment-guide)

---

## 🏛️ System Architecture

CampusCast employs a containerized modular architecture designed for zero-downtime content deployment and high availability. Physical display hardware nodes communicate with the backend via an HTTPS polling synchronization protocol.

```
                      ┌──────────────────────────────────────────────┐
                      │    Institutional Single Sign-On (SSO)        │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │                         CampusCast Operations Portal                             │
  │       (Role-Scoped Auth: Design Lead | Club President | HOD | Campus Admin)      │
  └────────┬───────────────────────────────┬───────────────────────────────┬─────────┘
           │                               │                               │
           ▼                               ▼                               ▼
  ┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
  │ Event Lifecycle  │           │ Approval Chain   │           │ Audit & Control  │
  │ - Creation       │           │ - President      │           │ - Append-Only Log│
  │ - 21-Day Schedule│           │ - HOD            │           │ - Remote Commands│
  │ - Versioning     │           │ - Campus Admin   │           │ - Media Purging  │
  └────────┬─────────┘           └────────┬─────────┘           └────────┬─────────┘
           │                              │                              │
           └──────────────────────────────┼──────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │           PostgreSQL / Prisma ORM            │
                    └─────────────────────┬────────────────────────┘
                                          │
                           HTTPS Telemetry & Manifest Sync
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         ▼                                ▼                                ▼
  ┌───────────────┐              ┌───────────────┐                ┌───────────────┐
  │ Kiosk Node 1  │              │ Kiosk Node 2  │                │ Kiosk Node N  │
  │ (Main Gate)   │              │ (Library)     │                │ (Cafeteria)   │
  │ - IndexedDB   │              │ - IndexedDB   │                │ - IndexedDB   │
  │ - 15s Cycle   │              │ - 15s Cycle   │                │ - 15s Cycle   │
  └───────────────┘              └───────────────┘                └───────────────┘
```

---

## ⭐ Core Platform Features

### 1. 🔐 Institutional Single Sign-On & Scoped Authorization (Step 1)
* Integrates with campus OAuth2/SAML SSO identity providers.
* Grants role-based permissions scoped to specific clubs or departments. For example, a *Technology Club President* has review authority strictly for Technology Club event submissions.

### 2. 📅 Event Creation & Automated 21-Day Schedule Window (Steps 2–4, 9)
* Design Leads enter event metadata: Name, Description, Club ID, Venue, Event Date, Start/End Time, Contact Info, Registration Link, Target Screen Nodes, and Poster Artwork.
* Calculates active visibility windows automatically:
  * **`activeFrom`**: Event Date − 21 calendar days (00:00:00).
  * **`activeUntil`**: Event Date (23:59:59).

### 3. 🛡️ Multi-Stage Institutional Approval Hierarchy (Steps 5–8)
* Submissions traverse a 3-tier approval process:
  1. **Club President** (`DRAFT` → `PENDING_HOD`)
  2. **Head of Department (HOD)** (`PENDING_HOD` → `PENDING_ADMIN`)
  3. **Campus Admin** (`PENDING_ADMIN` → `APPROVED`)
* Every approval, rejection, or revision request executes inside an atomic Prisma database transaction.

### 4. 📴 Offline Resilience & Kiosk Rotation Engine (Steps 14–17, 22–23)
* Kiosks run fullscreen 15-second poster rotation cycles.
* Active manifests are saved in browser `IndexedDB` and WebP media assets in `Cache Storage`.
* During network outages, displays continue rotating cached media seamlessly without showing blank screens.
* Playback events (`eventId`, `startedAt`, `completedAt`, `status`) are queued locally in `IndexedDB` and synced automatically upon network reconnection.

### 5. 📜 Immutable Append-Only Audit Logging (Step 24)
* Standardized audit module (`src/lib/audit.ts`) logs every state mutation into the `AuditLog` table.
* Records actor ID, action type, resource ID, state transitions (`previousState` → `newState`), and HTTP request ID.
* Excludes passwords, tokens, and PII to comply with security standards.

### 6. 🎮 Remote IoT Command Dispatcher (Step 18, 25)
* Admins can dispatch low-level commands (`REFRESH_PLAYLIST`, `RELOAD_APP`, `CLEAR_UNUSED_CACHE`, `UPDATE_CONFIGURATION`) to remote display hardware.
* Tracked via `DeviceCommand` records with expiration TTLs and execution status reporting.

### 7. 🔄 Poster Versioning & Atomic Cancellation (Steps 19–20)
* **Versioning**: Uploading a new poster for an approved event creates a new `DRAFT` version while keeping the current approved poster active on screens until the new version passes the full approval chain.
* **Cancellation**: Immediate cancellation (`POST /api/v1/events/:id/cancel`) marks display schedules inactive, increments screen `playlistVersion` counters, and invalidates kiosk manifests instantly.

### 8. 🧹 Background Media Purge Worker (Step 21)
* Background worker (`POST /api/v1/admin/cleanup`) identifies expired posters (`activeUntil < now`), removes stale screen assignments, and purges unused cached media references.

---

## 🔄 Complete 27-Step End-to-End Workflow

| Step # | Stage | Action Description | Module / API Endpoint |
| :---: | :--- | :--- | :--- |
| **1** | Auth | User logs in via Campus SSO and receives role-scoped authorization claims | `/api/auth/login` |
| **2** | Event | Design Lead selects "Create Event" and inputs details, target screens, and poster image | `POST /api/v1/events` |
| **3** | Upload | System validates MIME type (PNG/JPEG/WebP), size (<10MB), and generates SHA-256 checksum | `src/app/api/v1/events/route.ts` |
| **4** | Draft | Event and initial Poster record created with `DRAFT` status and 21-day schedule window | `prisma.poster.create` |
| **5** | Submit | Design Lead submits draft poster for institutional review (`PENDING_PRESIDENT`) | `POST /api/v1/posters/:id/submit` |
| **6** | President | Club President reviews and approves submission (`PENDING_HOD`) | `POST /api/v1/approvals/:id/action` |
| **7** | HOD | Head of Department reviews and approves submission (`PENDING_ADMIN`) | `POST /api/v1/approvals/:id/action` |
| **8** | Admin | Campus Admin grants final approval (`APPROVED`) | `POST /api/v1/approvals/:id/action` |
| **9** | Schedule | Active schedule calculated: `[Event Date - 21 days]` to `[Event Date 23:59:59]` | `activeFrom` / `activeUntil` |
| **10** | Public | Public WebP URL `/media/{checksum}.webp` generated for verified media asset | `/media/[filename]` |
| **11** | Assign | Approved poster automatically linked to target screen display nodes | `ScreenAssignment` |
| **12** | Manifest | Manifest query filters active items (`activeFrom <= now <= activeUntil` & status = `APPROVED`) | `/api/v1/screens/:slug/sync` |
| **13** | Version | Target screen `playlistVersion` counter incremented to invalidate old kiosk cache | `Screen.playlistVersion` |
| **14** | Sync | Kiosk sends HTTPS sync request with current `playlistVersion` and queued telemetry | `POST /api/v1/screens/:slug/sync` |
| **15** | Download | Kiosk downloads new manifest and caches WebP media in IndexedDB & Cache Storage | `DisplayScreenPage` |
| **16** | Verification| Kiosk verifies SHA-256 checksum of downloaded media before adding to active rotation | `crypto.subtle.digest` |
| **17** | Playback | Kiosk runs fullscreen 15-second rotation; skips failed images automatically | Kiosk Engine |
| **18** | Report | Playback event (`eventId`, `startedAt`, `completedAt`) created locally & synced to DB | `PlaybackLog` |
| **19** | Versioning| Updating approved event creates new `DRAFT` version; old version stays live | `POST /api/v1/events/:id/version` |
| **20** | Cancel | Admin cancels event; schedule expires immediately and screen manifests invalidate | `POST /api/v1/events/:id/cancel` |
| **21** | Purge | Expired posters (`activeUntil < now`) marked `EXPIRED` and purged from playlists | `POST /api/v1/admin/cleanup` |
| **22** | Offline | Kiosk detects network outage; continues rotation using local IndexedDB cache | Offline Mode |
| **23** | Reconnect| Kiosk re-establishes server connection; uploads pending telemetry batch | Offline Sync Queue |
| **24** | Audit Log| Immutable audit record written for every sensitive action | `AuditLog` |
| **25** | Commands | Admin dispatches remote command (`REFRESH_PLAYLIST`, `RELOAD_APP`) to display node | `POST /api/v1/commands` |
| **26** | Enrollment| Admin enrolls physical screen node; raw secret returned once, SHA-256 hash saved | `POST /api/v1/screens/enroll` |
| **27** | Monitoring| Admin dashboard monitors live screen heartbeats, storage, active incidents, & telemetry | `/admin` Dashboard |

---

## 🗄️ Database Schema & Data Models

CampusCast uses **Prisma ORM** with SQLite for development and PostgreSQL for production.

```prisma
model Screen {
  id               String             @id @default(uuid())
  slug             String             @unique // deviceId (e.g. screen-1)
  name             String
  location         String
  building         String             @default("Main Academic Block")
  floor            String             @default("1st Floor")
  deviceSecretHash String             @default("hash_demo_secret")
  status           String             @default("ACTIVE")
  playlistVersion  Int                @default(1)
  freeStorageMb    Int                @default(2048)
  lastSyncAt       DateTime?
  lastSeenAt       DateTime?
  assignments      ScreenAssignment[]
  playbackLogs     PlaybackLog[]
  incidents        Incident[]
  deviceCommands   DeviceCommand[]
}

model Event {
  id              String   @id @default(uuid())
  name            String
  description     String
  clubId          String
  venue           String
  eventDate       DateTime
  startTime       String
  endTime         String
  contactInfo     String
  registrationUrl String?
  targetScreens   String   @default("[]") // JSON stringified array of screen slugs
  posters         Poster[]
}

model Poster {
  id               String             @id @default(uuid())
  eventId          String?
  title            String
  imagePath        String
  originalFileName String
  mimeType         String
  checksum         String             @default("af1d9038c2")
  status           String             @default("DRAFT") // DRAFT, PENDING_PRESIDENT, PENDING_HOD, PENDING_ADMIN, APPROVED, CANCELLED, EXPIRED
  activeFrom       DateTime?
  activeUntil      DateTime?
  isPublic         Boolean            @default(false)
  assignments      ScreenAssignment[]
  approvals        Approval[]
  playbackLogs     PlaybackLog[]
  event            Event?             @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Approval {
  id           String   @id @default(uuid())
  posterId     String
  stage        String   // PRESIDENT, HOD, ADMIN
  reviewerId   String
  reviewerName String
  action       String   // APPROVE, REQUEST_CHANGES, REJECT
  comment      String?
  poster       Poster   @relation(fields: [posterId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id            String   @id @default(uuid())
  actorId       String
  action        String
  resourceId    String
  previousState String?
  newState      String?
  requestId     String   @default("req_auto")
  timestamp     DateTime @default(now())
}
```

---

## 🔌 Detailed RESTful API Specification

### 1. Create Event & Upload Poster
* **`POST /api/v1/events`**
* **Request (`multipart/form-data`)**:
  ```json
  {
    "name": "Annual Hackathon 2026",
    "description": "24-Hour AI & IoT Hackathon",
    "clubId": "technology-club",
    "venue": "Auditorium Block A",
    "eventDate": "2026-08-25",
    "startTime": "09:00",
    "endTime": "18:00",
    "contactInfo": "tech@college.edu",
    "targetScreens": ["screen-1", "screen-2"],
    "poster": "(File: poster.png)"
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Event created successfully with DRAFT poster status.",
    "event": { "id": "evt_101", "name": "Annual Hackathon 2026" },
    "poster": {
      "id": "poster_101",
      "status": "DRAFT",
      "checksum": "a1b2c3d4e5f678901234",
      "activeFrom": "2026-08-04T00:00:00.000Z",
      "activeUntil": "2026-08-25T23:59:59.999Z"
    }
  }
  ```

### 2. Kiosk Synchronization & Heartbeat
* **`POST /api/v1/screens/:slug/sync`**
* **Request**:
  ```json
  {
    "playlistVersion": 1,
    "freeStorageMb": 4096,
    "playbackLogs": [
      {
        "eventId": "play_99812",
        "posterId": "poster_101",
        "playlistVersion": 1,
        "startedAt": "2026-08-06T10:00:00.000Z",
        "completedAt": "2026-08-06T10:00:15.000Z",
        "status": "SUCCESS"
      }
    ]
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "playlistVersion": 2,
    "hasUpdates": true,
    "manifest": [
      {
        "posterId": "poster_101",
        "title": "Annual Hackathon 2026 Poster",
        "url": "/media/a1b2c3d4e5f678901234.webp",
        "sha256": "a1b2c3d4e5f678901234",
        "durationSeconds": 15
      }
    ],
    "commands": []
  }
  ```

---

## 🛠️ Local Installation & Setup

```bash
# 1. Clone Repository
git clone https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen.git
cd AI-IoT-Based-Smart-Screen

# 2. Install Dependencies
npm install

# 3. Database Migration & Seeding
npx prisma db push
npx prisma db seed

# 4. Start Development Server
npm run dev

# 5. Run Complete Verification Suite
npm test        # 8/8 Unit Tests
npm run lint    # TypeScript Check
npm run build   # Next.js Production Build
```

---

## 💻 Test Roles & Authentication Matrix

| Role Name | User ID | Scoped Permissions |
| :--- | :--- | :--- |
| **Design Lead** | `usr_101` | Submits events and artwork drafts |
| **Technology Club President** | `usr_102` | Tier-1 reviewer for Technology Club items |
| **Head of Department (HOD)** | `usr_103` | Tier-2 reviewer for department events |
| **Campus Admin** | `usr_100` | Tier-3 final approver, hardware manager & command dispatcher |

---

## 📺 Physical Kiosk Deployment Guide

To deploy a screen kiosk on hardware (Raspberry Pi, Smart TV, PC display):

```bash
# Chromium Kiosk Autostart Command
chromium-browser --kiosk --noerrdialogs --disable-infobars http://<server-ip>:3000/display/screen-1
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
