-- A simple themes table: admin creates entries, exactly one is `active` at a
-- time (enforced application-side by deactivating others on activation).
-- Themes show up as a small "今月のテーマ" line on /, /board, and /ask.

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists themes_active_idx
  on public.themes (active) where active;

alter table public.themes enable row level security;

create policy anon_read_themes
  on public.themes
  for select
  using (true);

-- Seed an initial active theme; the admin UI lets you change it later.
insert into public.themes (id, label, description, active) values
  (
    '00000000-0000-0000-0000-0000000000a1',
    '問いを問う',
    '答えのない問いに、もう一度問いを返してみる月。',
    true
  )
on conflict (id) do nothing;
