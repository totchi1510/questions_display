-- Pivot from custom QR-token cookie auth to Supabase Auth + staff_roles table.

-- 1. Drop the now-obsolete custom auth tables.
drop table if exists public.qr_tokens cascade;
drop table if exists public.sessions cascade;

-- 2. staff_roles: maps Supabase auth users to admin/moderator.
create table if not exists public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('moderator','admin')),
  created_at timestamptz not null default now()
);

-- RLS: authenticated users can read their own row; writes are server-only.
alter table public.staff_roles enable row level security;

drop policy if exists staff_self_read on public.staff_roles;
create policy staff_self_read
  on public.staff_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 3. Allow anonymous-origin moderation_logs entries (queue/publish from anon posters).
alter table public.moderation_logs drop constraint if exists moderation_logs_actor_role_check;
alter table public.moderation_logs add constraint moderation_logs_actor_role_check
  check (actor_role in ('anon','moderator','admin'));
