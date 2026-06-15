-- Link each question to a theme (optional). /board screenshots the questions
-- tied to the current active theme; /board/free screenshots the rest.

alter table public.questions
  add column if not exists theme_id uuid null
    references public.themes(id) on delete set null;

create index if not exists questions_theme_id_idx
  on public.questions (theme_id);

alter table public.archive_questions
  add column if not exists theme_id uuid null
    references public.themes(id) on delete set null;
