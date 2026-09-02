-- CampusCast — full database schema (create-from-scratch, idempotent)
--
-- Run this once in the Supabase SQL editor on a fresh project (or via
-- `supabase db push` if you wire up the CLI). It is safe to re-run: every
-- statement is guarded with `if not exists` / `create or replace` /
-- `drop policy if exists`.
--
-- This is the ONLY migration. It supersedes the old
-- `0001_campuscast_rebuild.sql`, which assumed pre-existing
-- `profiles` / `departments` / `screens` / `clubs` tables that were never
-- created anywhere in the repo (so a fresh project could not be bootstrapped).

-- ============================================================
-- 1. Core tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'submitter',
  department_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hod_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.profiles
    add constraint profiles_department_id_fkey
    foreign key (department_id) references public.departments(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('submitter', 'hod', 'admin', 'emergency'));
exception when duplicate_object then null; end $$;

create table if not exists public.screens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  zone text,
  last_seen_at timestamptz,
  firmware_version text not null default 'v1.0.0',
  force_refresh_requested boolean not null default false,
  reboot_requested boolean not null default false,
  current_announcement_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  department_id uuid references public.departments(id) on delete set null,
  priority text not null default 'routine',
  target_all boolean not null default false,
  target_zones text[] not null default '{}',
  attachment_url text,
  display_start timestamptz,
  display_end timestamptz,
  status text not null default 'draft',
  rejection_reason text,
  ai_advisory jsonb,
  is_emergency boolean not null default false,
  severity text,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.announcements add constraint announcements_priority_check
    check (priority in ('routine', 'timesensitive', 'critical', 'emergency'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.announcements add constraint announcements_status_check
    check (status in ('draft', 'pending_approval', 'approved', 'rejected', 'withdrawn', 'expired'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.announcements add constraint announcements_severity_check
    check (severity is null or severity in ('critical', 'warning'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.screens add constraint screens_current_announcement_fkey
    foreign key (current_announcement_id) references public.announcements(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.announcement_deliveries (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  screen_id uuid not null references public.screens(id) on delete cascade,
  state text not null default 'dispatched',
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (announcement_id, screen_id)
);

do $$ begin
  alter table public.announcement_deliveries add constraint deliveries_state_check
    check (state in ('dispatched', 'acknowledged', 'displaying', 'expired', 'failed'));
exception when duplicate_object then null; end $$;

-- Append-only accountability record. No FK on target_id so a row survives
-- even if the thing it references is later deleted.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  target_label text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.audit_log add constraint audit_target_type_check
    check (target_type in ('announcement', 'screen', 'broadcast'));
exception when duplicate_object then null; end $$;

create index if not exists idx_announcements_status on public.announcements(status);
create index if not exists idx_announcements_department on public.announcements(department_id);
create index if not exists idx_deliveries_screen on public.announcement_deliveries(screen_id);
create index if not exists idx_audit_target on public.audit_log(target_type, target_id);

-- ============================================================
-- 2. Auto-create a profile row for every new auth user
-- ============================================================
-- Without this, signups (including `seed-auth.ts`) leave `profiles` empty
-- and every dashboard query returns nothing. Role/department are assigned
-- afterwards from the Admin dashboard's Users tab.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Institutional email-domain enforcement (blueprint Part 9) is a Supabase
-- Auth Hook (dashboard: Authentication -> Hooks -> "Before user created"),
-- not code -- left unconfigured so the sample `campus.*` seed accounts work.

-- ============================================================
-- 3. RLS helper functions
-- ============================================================
-- SECURITY DEFINER + fixed search_path so they can read `profiles`
-- regardless of the caller's own row-level policies (no recursive checks).

create or replace function public.campuscast_current_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.campuscast_current_department()
returns uuid language sql stable security definer set search_path = public
as $$ select department_id from public.profiles where id = auth.uid() $$;

-- ============================================================
-- 4. Row Level Security
-- ============================================================

-- --- profiles ---
-- Any authenticated user may read profile rows (emails/roles are surfaced
-- across the approval + audit joins by design). Only admins may write them.
alter table public.profiles enable row level security;

drop policy if exists campuscast_profiles_select on public.profiles;
create policy campuscast_profiles_select on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists campuscast_profiles_admin_update on public.profiles;
create policy campuscast_profiles_admin_update on public.profiles
  for update using (public.campuscast_current_role() = 'admin')
  with check (public.campuscast_current_role() = 'admin');

-- --- departments ---
alter table public.departments enable row level security;

drop policy if exists campuscast_departments_select on public.departments;
create policy campuscast_departments_select on public.departments
  for select using (auth.uid() is not null);

drop policy if exists campuscast_departments_write_admin on public.departments;
create policy campuscast_departments_write_admin on public.departments
  for all using (public.campuscast_current_role() = 'admin')
  with check (public.campuscast_current_role() = 'admin');

-- --- announcements ---
alter table public.announcements enable row level security;

drop policy if exists campuscast_announcements_select on public.announcements;
create policy campuscast_announcements_select on public.announcements
  for select using (
    submitted_by = auth.uid()
    or public.campuscast_current_role() in ('admin', 'emergency')
    or (public.campuscast_current_role() = 'hod' and department_id = public.campuscast_current_department())
  );

-- Physical screens poll with the anon key; they only ever see approved content.
drop policy if exists campuscast_announcements_select_anon on public.announcements;
create policy campuscast_announcements_select_anon on public.announcements
  for select to anon using (status = 'approved');

drop policy if exists campuscast_announcements_insert on public.announcements;
create policy campuscast_announcements_insert on public.announcements
  for insert with check (
    submitted_by = auth.uid()
    and public.campuscast_current_role() in ('submitter', 'hod', 'admin', 'emergency')
  );

drop policy if exists campuscast_announcements_update_own on public.announcements;
create policy campuscast_announcements_update_own on public.announcements
  for update using (submitted_by = auth.uid() and status in ('draft', 'rejected'))
  with check (submitted_by = auth.uid());

-- HODs approve only their own department, only routine/time-sensitive items
-- (critical + cross-department go to a Campus Admin -- blueprint Part 8/13).
drop policy if exists campuscast_announcements_update_hod on public.announcements;
create policy campuscast_announcements_update_hod on public.announcements
  for update using (
    public.campuscast_current_role() = 'hod'
    and department_id = public.campuscast_current_department()
    and status = 'pending_approval'
    and priority in ('routine', 'timesensitive')
  ) with check (
    public.campuscast_current_role() = 'hod'
    and department_id = public.campuscast_current_department()
  );

drop policy if exists campuscast_announcements_update_admin on public.announcements;
create policy campuscast_announcements_update_admin on public.announcements
  for update using (public.campuscast_current_role() in ('admin', 'emergency'))
  with check (public.campuscast_current_role() in ('admin', 'emergency'));

-- --- screens ---
alter table public.screens enable row level security;

drop policy if exists campuscast_screens_select on public.screens;
create policy campuscast_screens_select on public.screens
  for select using (true);

drop policy if exists campuscast_screens_write_admin on public.screens;
create policy campuscast_screens_write_admin on public.screens
  for all using (public.campuscast_current_role() in ('admin', 'emergency'))
  with check (public.campuscast_current_role() in ('admin', 'emergency'));

-- Devices are not individually authenticated yet (no per-device token). The
-- public GET /api/screens/[id] heartbeat updates last_seen_at /
-- current_announcement_id via the anon key. Trade-off documented in the README.
drop policy if exists campuscast_screens_anon_heartbeat on public.screens;
create policy campuscast_screens_anon_heartbeat on public.screens
  for update to anon using (true) with check (true);

-- --- announcement_deliveries ---
alter table public.announcement_deliveries enable row level security;

drop policy if exists campuscast_deliveries_select on public.announcement_deliveries;
create policy campuscast_deliveries_select on public.announcement_deliveries
  for select using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and (
          a.submitted_by = auth.uid()
          or public.campuscast_current_role() in ('admin', 'emergency')
          or (public.campuscast_current_role() = 'hod' and a.department_id = public.campuscast_current_department())
        )
    )
  );

-- Same device-trust caveat as screens above.
drop policy if exists campuscast_deliveries_anon_insert on public.announcement_deliveries;
create policy campuscast_deliveries_anon_insert on public.announcement_deliveries
  for insert to anon with check (true);

drop policy if exists campuscast_deliveries_anon_update on public.announcement_deliveries;
create policy campuscast_deliveries_anon_update on public.announcement_deliveries
  for update to anon using (true) with check (true);

-- --- audit_log ---
alter table public.audit_log enable row level security;

drop policy if exists campuscast_audit_select on public.audit_log;
create policy campuscast_audit_select on public.audit_log
  for select using (
    public.campuscast_current_role() in ('admin', 'emergency')
    or actor_id = auth.uid()
    or (
      public.campuscast_current_role() = 'hod'
      and target_type = 'announcement'
      and exists (
        select 1 from public.announcements a
        where a.id = target_id and a.department_id = public.campuscast_current_department()
      )
    )
    -- a submitter can see the timeline of their own announcement
    or (
      target_type = 'announcement'
      and exists (
        select 1 from public.announcements a
        where a.id = target_id and a.submitted_by = auth.uid()
      )
    )
  );

drop policy if exists campuscast_audit_insert on public.audit_log;
create policy campuscast_audit_insert on public.audit_log
  for insert with check (actor_id = auth.uid());
-- (The expiry cron writes system rows with actor_id = null via the service
-- role, which bypasses RLS.)

-- ============================================================
-- 5. Storage bucket for announcement attachments
-- ============================================================

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

drop policy if exists campuscast_posters_read on storage.objects;
create policy campuscast_posters_read on storage.objects
  for select using (bucket_id = 'posters');

drop policy if exists campuscast_posters_write on storage.objects;
create policy campuscast_posters_write on storage.objects
  for insert to authenticated with check (bucket_id = 'posters');

drop policy if exists campuscast_posters_update on storage.objects;
create policy campuscast_posters_update on storage.objects
  for update to authenticated using (bucket_id = 'posters') with check (bucket_id = 'posters');
