# Database Schema

CampusCast utilizes a PostgreSQL database managed via Supabase. All schemas and policies are defined in a single, idempotent migration file (`supabase/migrations/0001_campuscast_init.sql`).

## Tables Overview

### `profiles`
Extends the native `auth.users` table provided by Supabase.
- **Fields**: `id` (references `auth.users`), `email`, `name`, `role` (default: 'submitter'), `department_id`, `created_at`
- **Trigger**: A trigger `handle_new_user()` runs after a new user is created in `auth.users` and automatically inserts a row here.

### `departments`
Represents the organizational units on campus.
- **Fields**: `id`, `name`, `hod_id` (references `profiles`), `created_at`

### `screens`
Represents the physical display units in the fleet.
- **Fields**: `id`, `name`, `location`, `zone`, `last_seen_at`, `firmware_version`, `force_refresh_requested`, `reboot_requested`, `current_announcement_id` (references `announcements`), `created_at`

### `announcements`
The core object representing a piece of digital signage content.
- **Fields**: `id`, `title`, `body`, `department_id`, `priority` (routine | timesensitive | critical | emergency), `target_all`, `target_zones`, `attachment_url`, `display_start`, `display_end`, `status` (draft | pending_approval | approved | rejected | withdrawn | expired), `rejection_reason`, `ai_advisory`, `is_emergency`, `severity`, `submitted_by`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`

### `announcement_deliveries`
Tracks the delivery state of an announcement to a specific screen.
- **Fields**: `id`, `announcement_id`, `screen_id`, `state` (dispatched | acknowledged | displaying | expired | failed), `last_confirmed_at`, `created_at`

### `audit_log`
An append-only log providing a complete trail of authorization and screen actions.
- **Fields**: `id`, `actor_id` (references `profiles`), `action`, `target_type` (announcement | screen | broadcast), `target_id`, `target_label`, `metadata`, `created_at`

## Row Level Security (RLS)
The database enforces strict governance through RLS policies:
- **`profiles` / `departments`**: Any authenticated user can read; only `admin` can write.
- **`announcements`**: 
  - Submitter can read/update their own drafts.
  - HODs can update (approve/reject) `pending_approval` announcements for their own department (limited to `routine` and `timesensitive`).
  - Admins can update any announcement.
  - Anon role (devices) can only read `status = 'approved'`.
- **`screens` & `announcement_deliveries`**:
  - The Anon role is allowed to update `screens` (heartbeat `last_seen_at`) and insert/update `announcement_deliveries` as part of the device polling contract.
- **`audit_log`**:
  - Admins can view all.
  - Submitters can view logs related to their own announcements.
  - HODs can view logs for their department's announcements.
