# 📺 CampusCast — Enterprise IoT Digital Signage Network

[![Build Status](https://img.shields.io/badge/Build-Passing-1f8a65?style=flat-square)](https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-f54e00?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?style=flat-square)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.style=flat-square)](LICENSE)

**CampusCast** is a production-grade, offline-resilient IoT digital signage platform engineered for university campuses and enterprise networks. It manages the complete event lifecycle—from initial SSO authentication, event creation, and multi-stage institutional approval chains to cryptographic asset checksum verification, automatic 21-day schedule windows, and offline kiosk display rotation.

---

## 🏛️ System Architecture

CampusCast uses a containerized modular architecture designed for high availability and zero downtime. Kiosks poll the backend via an optimized HTTPS telemetry synchronization protocol, caching manifests and optimized media locally for autonomous operation during network outages.

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
* Integrates with institutional LDAP/OAuth SSO systems.
* Grants role-based permissions scoped to specific clubs or departments (e.g., *Technology Club President* has review rights strictly for Technology Club submissions).

### 2. 📅 Event Creation & Automated 21-Day Schedule Window (Steps 2–4, 9)
* Design Leads create events with metadata (Name, Description, Club, Venue, Date, Time, Registration Link, Target Screens).
* Calculates exact active availability windows automatically:
  * **`activeFrom`**: Event Date − 21 calendar days (00:00:00).
  * **`activeUntil`**: Event Date (23:59:59).

### 3. 🛡️ Multi-Stage Institutional Approval Engine (Steps 5–8)
* Poster submissions traverse a strict 3-tier approval hierarchy:
  1. **Club President** (`DRAFT` → `PENDING_HOD`)
  2. **Head of Department (HOD)** (`PENDING_HOD` → `PENDING_ADMIN`)
  3. **Campus Admin** (`PENDING_ADMIN` → `APPROVED`)
* Every approval, rejection, or request for revision executes inside an atomic Prisma transaction.

### 4. 📴 Offline Resilience & Kiosk Display Engine (Steps 14–17)
* Displays operate autonomously on 15-second rotation cycles.
* Manifests are stored locally in browser `IndexedDB` and media assets in `Cache Storage`.
* During network disconnection, displays continue rotating cached media seamlessly without showing blank screens or error prompts.
* Playback telemetry reports (`eventId`, `startedAt`, `completedAt`, `status`) are queued locally and uploaded automatically upon reconnection.

### 5. 📜 Immutable Append-Only Audit Logging (Step 24)
* Standardized audit service (`src/lib/audit.ts`) records every system state mutation in the `AuditLog` table.
* Tracks action type, actor ID, resource ID, state transition (`previousState` → `newState`), and HTTP request ID.
* Excludes passwords, tokens, and PII to comply with security standards.

### 6. 🎮 Remote IoT Command Dispatcher (Step 18)
* Admins can dispatch real-time commands (`REFRESH_PLAYLIST`, `RELOAD_APP`, `CLEAR_UNUSED_CACHE`, `UPDATE_CONFIGURATION`) to remote display hardware.
* Tracked via `DeviceCommand` models with expiration TTLs and execution status reporting.

### 7. 🔄 Poster Versioning & Atomic Cancellation (Steps 19–20)
* **Versioning**: Uploading a new poster for an approved event creates a new `DRAFT` version while keeping the existing approved poster active on screens until the new version passes the full approval chain.
* **Cancellation**: Immediate cancellation (`POST /api/v1/events/:id/cancel`) marks display schedules inactive, increments screen `playlistVersion` counters, and invalidates kiosk manifests instantly.

### 8. 🧹 Background Media Purge Worker (Step 21)
* Background worker (`POST /api/v1/admin/cleanup`) identifies expired posters (`activeUntil < now`), removes stale screen assignments, and purges unused cached media references.

---

## 🔄 The Complete 27-Step End-to-End Workflow

| Step # | Stage | Action Description | Core API / Module |
| :--- | :--- | :--- | :--- |
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

CampusCast uses **Prisma ORM** with SQLite for local development and PostgreSQL for production deployments.

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

## 🔌 API Endpoint Reference

### 🔐 Authentication & Session
- `POST /api/auth/login` — Authenticate user and issue session cookie.
- `POST /api/auth/logout` — Revoke active session.
- `GET /api/auth/me` — Retrieve current authenticated user profile and roles.

### 📅 Events & Poster Management
- `POST /api/v1/events` — Create new event and upload poster image (`DRAFT`).
- `GET /api/v1/events` — List all campus events and poster versions.
- `POST /api/v1/posters/:id/submit` — Submit poster for institutional review.
- `POST /api/v1/events/:id/version` — Create new poster draft version for an event.
- `POST /api/v1/events/:id/cancel` — Cancel event and invalidate active screen manifests.

### 🛡️ Institutional Approval Chain
- `GET /api/v1/approvals/inbox` — Fetch pending approval items for current user's role.
- `POST /api/v1/approvals/:posterId/action` — Process approval action (`APPROVE`, `REQUEST_CHANGES`, `REJECT`).

### 🖥️ Kiosk Sync & Telemetry
- `POST /api/v1/screens/:slug/sync` — Kiosk heartbeat, manifest fetch, telemetry upload, and command polling.
- `POST /api/v1/screens/enroll` — Enroll new physical display node and generate hardware credentials.
- `POST /api/v1/telemetry/playback` — Bulk upload playback telemetry logs.

### 🎮 Administrative Control & Audit
- `GET /api/v1/audit` — Query append-only audit trail logs.
- `POST /api/v1/commands` — Dispatch remote command to target kiosk node.
- `POST /api/v1/admin/cleanup` — Run background media expiration and cache purge worker.

---

## 🛠️ Local Installation & Setup

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: `npm` or `pnpm`
- **Git**

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen.git
   cd AI-IoT-Based-Smart-Screen
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Database**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Run Suite Verification**:
   ```bash
   npm test        # Run unit tests
   npm run lint    # Run TypeScript compiler check
   npm run build   # Run Next.js production build
   ```

---

## 💻 Roles & Quick Testing Credentials

The system includes built-in role switching on the `/login` page for easy testing:

| Role Name | User ID | Description |
| :--- | :--- | :--- |
| **Design Lead** | `usr_101` | Creates events and uploads poster artwork |
| **Technology Club President** | `usr_102` | Tier-1 reviewer for Technology Club submissions |
| **Head of Department (HOD)** | `usr_103` | Tier-2 reviewer for department events |
| **Campus Admin** | `usr_100` | Tier-3 final approver, hardware manager & command dispatcher |

---

## 📺 Kiosk Display Setup

To run a screen kiosk on physical hardware (e.g. Raspberry Pi, Android Smart TV, or PC display):

1. Launch a browser in fullscreen kiosk mode pointing to:
   ```
   http://<server-ip>:3000/display/screen-1
   ```
2. The kiosk automatically registers with the backend server, downloads the latest playlist manifest, caches media locally in IndexedDB, and begins 15-second rotation playback.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
