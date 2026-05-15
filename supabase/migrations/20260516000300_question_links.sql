-- Posters can mark up to a few existing questions as the inspiration for
-- their own — a directed link from_question_id -> to_question_id. The wall
-- draws these as bezier curves between sticky notes.

create table if not exists public.question_links (
  id uuid primary key default gen_random_uuid(),
  from_question_id uuid not null references public.questions(id) on delete cascade,
  to_question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_question_id, to_question_id),
  check (from_question_id <> to_question_id)
);

create index if not exists question_links_from_idx
  on public.question_links (from_question_id);
create index if not exists question_links_to_idx
  on public.question_links (to_question_id);

alter table public.question_links enable row level security;

create policy anon_read_question_links
  on public.question_links
  for select
  using (true);
