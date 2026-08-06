# CampusCast IoT Digital Signage Network & Approval Pipeline

CampusCast is an enterprise-grade IoT digital signage management platform built with Next.js, React 19, Prisma ORM, and SQLite. It provides a transactional multi-stage approval workflow (Design Lead → President → HOD → Campus Admin), 21-day automatic event scheduling, SHA-256 media integrity verification, screen enrollment with hashed device secrets, and jitter-stabilized kiosk telemetry synchronization.

---

## 🏛️ Architectural Overview & IoT Telemetry Flow

```
                               ┌─────────────────────────────────────────┐
                               │       Campus SSO / Login System        │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CampusCast Operations Portal                                     │
 │                                           (/admin)                                                  │
 └──────────────┬───────────────────────────┬───────────────────────────┬──────────────────────────────┘
                │                           │                           │
                ▼                           ▼                           ▼
 ┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
 │     1. Create Event         │ │    2. Multi-Stage Approval  │ │     3. Kiosk Enrollment     │
 │ POST /api/v1/events         │ │ POST /api/v1/approvals/...  │ │ POST /api/v1/screens/enroll │
 └──────────────┬──────────────┘ └──────────────┬──────────────┘ └──────────────┬──────────────┘
                │                               │                               │
                └───────────────────────┬───────┴───────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                  SQLite Database (Prisma ORM)                                       │
 │              Event | Poster (DRAFT → APPROVED) | Approval Audit | Screen | Assignments             │
 └──────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                        │ Jitter Sync Protocol (50-70s) & Heartbeat (5s)
                                        ▼
 ┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
 │       Kiosk Node 01         │ │       Kiosk Node 02         │ │       Kiosk Node 03         │
 │   /display/screen-1         │ │   /display/screen-2         │ │   /display/screen-3         │
 └─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

---

## 🚀 Key Features

* **Cursor Editorial Design System**: Warm cream canvas (`#f7f7f4`), warm ink text (`#26251e`), single Cursor Orange (`#f54e00`) CTA voltage, 1px hairline depth, and 5 AI action timeline pastel tokens.
* **Transactional Multi-Stage Approvals**: Enforces stage sequence (`DRAFT` → `PENDING_PRESIDENT` → `PENDING_HOD` → `PENDING_ADMIN` → `APPROVED`) inside atomic Prisma database transactions with immutable audit logs.
* **Automatic 21-Day Scheduling**: Automatically calculates display start (`Event Date - 21 days`) and display end (`Event Date 23:59:59`).
* **Media Integrity & Serving**: Computes SHA-256 checksums for uploaded poster images and serves approved media via `/media/{checksum}.webp`.
* **Kiosk Screen Enrollment**: Enrolls physical screen nodes generating secure credentials; stores only SHA-256 hashes (`deviceSecretHash`) in PostgreSQL/SQLite.
* **Jitter Telemetry Synchronization Protocol**: Kiosks report storage capacity, software version, and playback events via `/api/v1/screens/{slug}/sync` with randomized next sync intervals (50–70s) to prevent thundering herd load.

---

## ⚙️ Quickstart & Local Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **pnpm** (or `npm`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Gaurav-205/AI-IoT-Based-Smart-Screen.git
cd "AI - IoT Based Smart Screen"
pnpm install
```

### 2. Environment Setup
Create a `.env` file (or use default SQLite):
```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

### 3. Database Migration & Seeding
Sync the database schema and populate initial screens and test accounts:
```bash
# Push Prisma schema to SQLite
npx prisma db push

# Seed initial screens & user accounts
pnpm seed
```

### 4. Run Tests & Start Dev Server
```bash
# Run unit tests
pnpm test

# Run Next.js dev server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 API Reference (v1)

### 1. Event Creation & Poster Submission
* **`POST /api/v1/events`**: Creates an event, uploads poster, computes SHA-256 checksum, sets 21-day schedule, and initializes `DRAFT` poster record.
* **`POST /api/v1/posters/:posterId/submit`**: Transitions poster from `DRAFT` to `PENDING_PRESIDENT`.

### 2. Approval Workflow
* **`GET /api/v1/approvals/inbox`**: Retrieves pending approval submissions scoped to current reviewer role.
* **`POST /api/v1/approvals/:posterId/action`**: Executes `APPROVE`, `REQUEST_CHANGES`, or `REJECT` inside an atomic transaction.

### 3. Screen Enrollment & Telemetry Sync
* **`POST /api/v1/screens/enroll`**: Enrolls a physical kiosk display node and returns device credentials.
* **`POST /api/v1/screens/:slug/sync`**: Hardware heartbeat telemetry and active playlist manifest generator with jitter recommendation.

---

## 🎨 Design Tokens

| Token Name | Hex Value | Application |
| :--- | :--- | :--- |
| `Canvas Floor` | `#f7f7f4` | Page background floor |
| `Ink Text` | `#26251e` | Warm near-black display & body text |
| `Primary Voltage` | `#f54e00` | Signature Cursor Orange CTAs |
| `Surface Card` | `#ffffff` | Pure white cards over cream canvas |
| `Hairline Border` | `#e6e5e0` | 1px card borders & section dividers |
| `Timeline - Thinking` | `#dfa88f` | Peach pill (`DRAFT` stage) |
| `Timeline - Grep` | `#9fc9a2` | Mint pill (`PENDING_PRESIDENT` stage) |
| `Timeline - Read` | `#9fbbe0` | Pastel Blue pill (`PENDING_HOD` stage) |
| `Timeline - Edit` | `#c0a8dd` | Lavender pill (`PENDING_ADMIN` stage) |
| `Timeline - Done` | `#c08532` | Warm Gold pill (`APPROVED` stage) |

---

## 📄 License & Credits
Built for academic and enterprise digital signage research. Designed with editorial developer aesthetics and robust IoT telemetry standards.
