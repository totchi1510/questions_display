-- Consolidate the three-axis reaction back into a single "考えている"
-- counter. Historical reactions are summed in so no engagement is lost.

alter table public.questions
  add column if not exists hold_count int not null default 0;

-- Preserve historical totals: sum of all prior reaction types.
update public.questions
set hold_count = coalesce(think_count, 0) + coalesce(talk_count, 0) + coalesce(inspire_count, 0)
where hold_count = 0;

-- total_reactions is a generated column over the soon-to-be-dropped fields; drop it first.
alter table public.questions drop column if exists total_reactions;
alter table public.questions drop column if exists think_count;
alter table public.questions drop column if exists talk_count;
alter table public.questions drop column if exists inspire_count;

-- likes.reaction_type is no longer needed; collapse to a single implicit type.
alter table public.likes drop column if exists reaction_type;

-- Drop the typed RPC; introduce a single-purpose one.
drop function if exists public.increment_question_reaction(uuid, text);

create or replace function public.increment_question_hold(qid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.questions set hold_count = hold_count + 1 where id = qid;
$$;

revoke all on function public.increment_question_hold(uuid) from public;
grant execute on function public.increment_question_hold(uuid) to service_role;

drop index if exists idx_likes_question_type_ip;
create index if not exists idx_likes_question_ip
  on public.likes(question_id, source_ip_hash);
