-- Close an approval bypass. The original insert / update-own policies only
-- checked `submitted_by`, so any signed-in submitter could use the public anon
-- key to write status = 'approved' or is_emergency = true directly and put
-- content on every screen with no review. Safe to re-run.

drop policy if exists campuscast_announcements_insert on public.announcements;
create policy campuscast_announcements_insert on public.announcements
  for insert with check (
    submitted_by = auth.uid()
    and (
      public.campuscast_current_role() in ('admin', 'emergency')
      or (
        public.campuscast_current_role() in ('submitter', 'hod')
        and status in ('draft', 'pending_approval')
        and is_emergency = false
      )
    )
  );

drop policy if exists campuscast_announcements_update_own on public.announcements;
create policy campuscast_announcements_update_own on public.announcements
  for update using (submitted_by = auth.uid() and status in ('draft', 'rejected'))
  with check (
    submitted_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and is_emergency = false
  );
