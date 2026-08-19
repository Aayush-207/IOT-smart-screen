# CampusCast — Smart Digital Billboard Platform

CampusCast is an enterprise smart digital billboard software platform built with Next.js (App Router), PostgreSQL, Prisma ORM, BullMQ/Redis, and TypeScript. It manages campus-wide digital poster submission, automated approval routing (Club President → HOD → Admin), broadcast window management, and physical screen fleet communication.

---

## Key Features

- **State Machine Approval Engine**: Enforces strict two-stage approvals (HOD → Admin), null-HOD bypass for unassigned clubs, self-approval prevention, rejection comment enforcement, and version history.
- **21-Day Broadcast Window Automation**: Automatically publishes approved posters to physical display screens for a fixed 21-day window before the event.
- **7-Day Eligibility Cutoff**: Automatically marks pending submissions as `ineligible` if they are not approved at least 7 days before the event.
- **IoT Device Fleet & Shadow Stubs**: Simulates MQTT communication with physical ESP32 screen kiosks (AWS IoT Core contract).
- **Brand Asset Kit Compliance**: Integrated self-certification check on poster uploads and downloadable guidelines kit.
- **Interactive Multi-Role Switcher**: Impersonate any of the 4 RBAC roles (`club_president`, `club_hod`, `admin`, `viewer`) in real time for testing.

---

## State Machine Transition Rules

| Initial Status | Action / Trigger | Next Status | Authorization & Rule |
| :--- | :--- | :--- | :--- |
| `awaiting_poster` | `upload_poster` (Club HAS HOD) | `pending_hod_approval` | Submitter must be President or Admin. Mandatory self-certification check. |
| `awaiting_poster` | `upload_poster` (Club HAS NO HOD) | `pending_admin_approval` | Direct Admin Path: Skips Stage 1 HOD review. |
| `pending_hod_approval` | `hod_approve` | `pending_admin_approval` | HOD of club's department. Self-approval blocked. |
| `pending_hod_approval` | `hod_reject` | `awaiting_poster` | Requires non-empty rejection reason comment. |
| `pending_admin_approval` | `admin_approve` | `approved` | Admin role required. Self-approval blocked. |
| `pending_admin_approval` | `admin_reject` | `awaiting_poster` | Requires non-empty rejection reason comment. |
| `approved` | `broadcast_live` (21-day job) | `live` | Triggered when `eventDate <= now() + 21 days`. Publishes MQTT payload. |
| *Pending* | `mark_ineligible` (7-day job) | `ineligible` | Triggered when `eventDate <= now() + 7 days` without final Admin approval. |
| `ineligible` | `admin_override` | `pending_admin_approval` | Admin only. Requires mandatory written exemption reason. |
| `live` | `auto_archive` | `archived` | Triggered when `eventDate < now()`. Clears playlist. |

---

## Tech Stack & Architecture

- **Frontend & Backend**: Next.js 16 (App Router, Server Actions, API Routes)
- **Database**: PostgreSQL with Prisma ORM 7 (`@prisma/adapter-pg`)
- **Queue & Background Jobs**: BullMQ & Redis (`ioredis`)
- **Styling**: Tailwind CSS v4 with dark mode & glassmorphism components
- **Testing**: Vitest (Unit & Integration tests)

---

## Getting Started

### 1. Requirements
- Node.js v18+
- Docker Compose (for PostgreSQL and Redis) OR local PostgreSQL/Redis instances

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Database & Redis (Docker)
```bash
docker-compose up -d
```

### 4. Database Seeding
Seed 2 clubs (one with HOD, one without), 5 role-based users, 2 IoT screens, and 8 sample events covering all statuses:
```bash
npm run seed
```

### 5. Development Server
Run the dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests

Run the complete Vitest unit and integration test suite:
```bash
npm test
```

Build for production:
```bash
npm run build
```

---

## API Surface Reference

- `GET /api/events` — Get all events and posters
- `POST /api/events` — Create a new event
- `POST /api/events/[id]/content` — Upload poster (with rate-limiting and self-certification)
- `POST /api/content/[id]/review` — Approve/reject poster (HOD & Admin)
- `POST /api/content/[id]/override` — Admin override for ineligible content
- `GET /api/content/[id]/history` — Approval audit steps & prior versions
- `GET /api/devices` — List IoT billboard screens
- `GET /api/devices/[id]/shadow` — Get AWS IoT Core device shadow JSON payload
- `POST /api/devices/[id]/heartbeat` — Send device heartbeat ping
- `GET /api/dashboard/deadlines` — Get 7-day eligibility deadline report
- `GET /api/dashboard/turnaround` — Get approval stage turnaround velocity metrics
- `POST /api/jobs/run` — Manually trigger background jobs (`broadcast`, `deadlines`, `reminders`, `archiving`)
- `POST /api/auth/switch-user` — Switch impersonated session user role

---

## License

MIT License. Built for CampusCast Smart Digital Billboard Platform.
