-- Enable RLS and add anon read policies for public tables

alter table public.questions enable row level security;
drop policy if exists anon_read_questions on public.questions;
create policy anon_read_questions
  on public.questions
  for select
  to anon
  using (true);

alter table public.archive_questions enable row level security;
drop policy if exists anon_read_archive_questions on public.archive_questions;
create policy anon_read_archive_questions
  on public.archive_questions
  for select
  to anon
  using (true);

-- Other tables are server-only; do not add anon policies (deny-by-default)
alter table public.likes enable row level security;
alter table public.pending_reviews enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.qr_tokens enable row level security;
alter table public.sessions enable row level security;
