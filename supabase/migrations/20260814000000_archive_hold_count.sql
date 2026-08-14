-- Monthly snapshots were still carrying the retired `likes_count` counter,
-- which nothing has incremented since reactions were consolidated into
-- `questions.hold_count` (20260515000500). Archived questions therefore showed
-- 🤔 0 and sorted by a dead column.
--
-- Give archive_questions its own hold_count, seeded from whatever likes_count
-- held, and let likes_count default so the rollover no longer has to supply it.

alter table public.archive_questions
  add column if not exists hold_count int not null default 0;

-- Preserve whatever the old column captured for already-archived rows.
update public.archive_questions
set hold_count = likes_count
where hold_count = 0 and likes_count > 0;

-- likes_count is kept for historical rows but is no longer written; a default
-- lets inserts omit it entirely (the column is NOT NULL).
alter table public.archive_questions
  alter column likes_count set default 0;
