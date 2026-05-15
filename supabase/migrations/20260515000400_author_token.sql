-- Allow anonymous posters to follow their own questions across visits via a
-- persistent (unsigned) cookie token.

alter table public.questions
  add column if not exists author_token text;

create index if not exists idx_questions_author_token
  on public.questions(author_token);
