# CampusCast — Governed Campus Display Network

CampusCast is the **governance, priority, and delivery-verification layer** for
campus digital signage — not a poster CMS. Departments submit announcements, an
HOD (or, for critical items, a Campus Admin) approves them, the approved content
is resolved to a set of physical screens, and the admin dashboard shows —
screen by screen — what each is displaying and a full audit trail of who
authorized what.

Built with Next.js 16 (App Router) + Supabase (Postgres + Auth + Storage).

---

## Roles

| Role | Dashboard | Capabilities |
| :--- | :--- | :--- |
| `submitter` | `/dashboard/submitter` | Create announcements (text/image, target zones, schedule window, priority), track per-device delivery. |
| `hod` | `/dashboard/hod` | Approve / reject **routine & time-sensitive** announcements from their own department. |
| `admin` | `/dashboard/admin` | Approve **critical** announcements (any department); monitor the screen fleet; withdraw live content; review the full audit log; manage departments and user role/department assignments. |
| `emergency` | `/dashboard/admin` (+ `/dashboard/admin/emergency`) | Send an emergency broadcast that overrides every screen; clear it. **No** device management, **no** approvals. |

Roles + department live on `profiles.role` / `profiles.department_id`, assigned
from the Admin dashboard's **Users** tab. No self-service role selection, no SSO.

**Bootstrap:** after the first signup, set that one `profiles` row's `role` to
`admin` in the Supabase Table Editor; every later account is promoted from the
Admin dashboard.

---

## Priority & approval routing (blueprint Part 8 / 15)

| Priority | Who approves | Notes |
| :--- | :--- | :--- |
| Routine | HOD of the owning department | |
| Time-sensitive | HOD of the owning department | dated / urgent |
| Critical | Campus Admin (`/dashboard/admin/approvals`) | campus-wide / cross-department |
| Emergency | nobody — pre-authorized | Emergency Authority only, via `/dashboard/admin/emergency`; overrides all screens; auto-clears after 4h or on **Clear Emergency**. |

Enforced twice: Postgres RLS (`campuscast_announcements_update_hod` restricts
HODs to `routine`/`timesensitive` in their own department) **and** the route
handlers / queue pages.

---

## Data model

One migration: **`supabase/migrations/0001_campuscast_init.sql`** — a
create-from-scratch, idempotent (re-runnable) schema. Run it once in the
Supabase SQL editor on a fresh project.

- **`profiles`** — one row per auth user (`role`, `department_id`); auto-created
  by the `handle_new_user` trigger on signup.
- **`departments`** — org units with an assigned `hod_id`.
- **`screens`** — the fleet (`zone`, `last_seen_at`, `current_announcement_id`,
  `firmware_version`, `force_refresh_requested`, `reboot_requested`).
- **`announcements`** — the core object: title/body, department, `priority`
  (`routine|timesensitive|critical|emergency`), targets (`target_all` or
  `target_zones[]`), display window, `status`
  (`draft|pending_approval|approved|rejected|withdrawn|expired`), the
  emergency fields (`is_emergency`, `severity`), and `ai_advisory` (advisory
  moderation metadata).
- **`announcement_deliveries`** — per (announcement, screen): `state`
  (`dispatched → acknowledged → displaying`, or `expired`/`failed`) +
  `last_confirmed_at`, advanced by the screen poll.
- **`audit_log`** — append-only; every approve / reject / withdraw / emergency /
  moderation / device action / scheduled expiry.

RLS notes: any authenticated user can `select` `profiles` / `departments`
(emails and roles are surfaced across the approval + audit joins); only admins
may write them. The anon key can read `approved` announcements and stamp screen
heartbeats — see the polling contract below for that trade-off.

---

## Screen (device) polling contract

Screens poll `GET /api/screens/[id]` (public, no auth — there is no per-device
token yet). Each request is a heartbeat and returns:

```json
{
  "announcement": { "id": "...", "title": "...", "body": "...", "attachment_url": "...", "is_emergency": false, "severity": null } | null,
  "force_refresh": false,
  "reboot_requested": false
}
```

The endpoint stamps `last_seen_at`, resolves the winning announcement (active
**emergency** → highest **priority** → newest), advances the delivery state
machine (`acknowledged` on first hand-off, `displaying` once it's already the
screen's current content), and clears any one-shot `force_refresh` /
`reboot_requested`. A screen is `online` within 1 min, `stale` within 5 min,
`offline` beyond (`src/lib/fleet.ts`).

---

## Scheduled expiry

`GET /api/cron/expire` flips `approved` announcements past their `display_end`
to `expired`, logs each, and marks their delivery rows `expired`. Guarded by
`Authorization: Bearer $CRON_SECRET`. `vercel.json` schedules it every 15 min
(**sub-daily crons need a Vercel paid plan** — on the free tier, trigger it
manually or from an external scheduler). Manual run:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire
```

---

## Advisory moderation (blueprint Part 22 — not core)

On "Submit for Approval" the form fire-and-forgets `POST
/api/announcements/moderate`. It always runs deterministic checks (missing
display window, shouting, an event with no date, …) and — **only if
`ANTHROPIC_API_KEY` is set** — an 8-second, non-blocking `claude-haiku-4-5`
advisory call. The result is stored on `announcements.ai_advisory` (needs
`SUPABASE_SERVICE_ROLE_KEY` — the item is already `pending_approval` by then, so
the owner's RLS can't write it) and shown to the approver. It never changes
`status`; a failure or missing key is a no-op.

---

## Getting started

### 1. Environment

```bash
cp .env.example .env.local
```

Fill `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required).
`SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` are only needed for the expiry cron;
`ANTHROPIC_API_KEY` only for the AI advisory.

### 2. Database

Run `supabase/migrations/0001_campuscast_init.sql` in the Supabase SQL editor.

### 3. Seed test accounts (optional)

```bash
npx tsx seed-auth.ts
```

Then promote one row to `admin` in the Table Editor and assign the rest from the
Admin dashboard's Users tab.

### 4. Run

```bash
npm install
npm run dev            # http://localhost:3000
```

### 5. Demo the delivery pipeline without hardware

```bash
# Register a screen in the Fleet dashboard, copy its UUID, then:
npm run sim:device -- --screen <uuid>
# and open http://localhost:3000/kiosk.html?id=<uuid> in a tab
```

See `scripts/README.md` (offline toggle, kiosk renderer, emergency override).

---

## Tests

```bash
npm test     # vitest: fleet status, priority ordering, deterministic advisories
npm run build
```

---

## Out of scope / future work

The full blueprint also specifies a hardware + messaging stack that needs
external accounts and physical devices and is **not** in this repo:

- **AWS IoT Core / MQTT / X.509 device certs** — this build uses the HTTP
  polling contract above instead. It still satisfies the blueprint's Part 34
  "MUST DEMONSTRATE" list (submit→approve→dispatch→ack→displaying, offline
  resilience, emergency override, live dashboard, audit log).
- **Raspberry Pi OS image + Python agent** — replaced by `scripts/sim-device.mjs`
  + `scripts/kiosk.html` for demos.
- **Cloudflare R2** — attachments use Supabase Storage (`posters` bucket).
- **Institutional SSO / email-domain enforcement** — a Supabase Auth Hook,
  configured in the dashboard, not code.
- Production Vercel / Supabase / AWS provisioning.
