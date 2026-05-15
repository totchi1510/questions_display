-- Atomic increment for questions.likes_count, callable via PostgREST RPC
create or replace function public.increment_question_likes(qid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.questions set likes_count = likes_count + 1 where id = qid;
$$;

revoke all on function public.increment_question_likes(uuid) from public;
grant execute on function public.increment_question_likes(uuid) to service_role;
