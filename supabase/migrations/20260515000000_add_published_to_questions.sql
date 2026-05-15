-- Add published flag to questions (server-managed; controls /board visibility)
alter table public.questions
  add column if not exists published boolean not null default false;

-- Backfill existing rows: any question without a pending review entry is considered published
update public.questions q
set published = true
where not exists (
  select 1 from public.pending_reviews pr
  where pr.question_id = q.id and pr.status = 'pending'
);

-- Composite index for /board query (published + archived + recency)
create index if not exists idx_questions_published_archived_created
  on public.questions(published, archived, created_at desc);
