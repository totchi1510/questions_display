-- Expand single-like to multi-axis reactions: think / talk / inspire.

-- 1. reaction_type column on likes (default 'think'; legacy likes become 'think')
alter table public.likes
  add column if not exists reaction_type text not null default 'think'
  check (reaction_type in ('think', 'talk', 'inspire'));

-- 2. Per-type count columns on questions
alter table public.questions add column if not exists think_count int not null default 0;
alter table public.questions add column if not exists talk_count int not null default 0;
alter table public.questions add column if not exists inspire_count int not null default 0;

-- 3. Backfill: prior likes_count was all "think" semantics
update public.questions q
set think_count = q.likes_count
where q.think_count = 0 and q.likes_count > 0;

-- 4. Sort score: generated column summing the three reaction counts
alter table public.questions
  add column if not exists total_reactions int
  generated always as (think_count + talk_count + inspire_count) stored;

-- 5. Replace the single-purpose RPC with a typed one
drop function if exists public.increment_question_likes(uuid);

create or replace function public.increment_question_reaction(qid uuid, rtype text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if rtype = 'think' then
    update public.questions set think_count = think_count + 1 where id = qid;
  elsif rtype = 'talk' then
    update public.questions set talk_count = talk_count + 1 where id = qid;
  elsif rtype = 'inspire' then
    update public.questions set inspire_count = inspire_count + 1 where id = qid;
  end if;
end;
$$;

revoke all on function public.increment_question_reaction(uuid, text) from public;
grant execute on function public.increment_question_reaction(uuid, text) to service_role;

-- 6. Helpful index for per-type dedup lookups
create index if not exists idx_likes_question_type_ip
  on public.likes(question_id, reaction_type, source_ip_hash);
