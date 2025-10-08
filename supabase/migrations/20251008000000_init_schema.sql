-- Enable required extensions
create extension if not exists pgcrypto;

-- questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now(),
  likes_count int not null default 0,
  archived boolean not null default false,
  archived_at timestamptz null,
  meta_ip_hash text null
);

-- archive_questions
create table if not exists public.archive_questions (
  id uuid primary key,
  content text not null,
  created_at timestamptz not null,
  archived_at timestamptz not null,
  likes_count int not null
);

-- likes
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  source_jti text null,
  source_ip_hash text null
);

-- pending_reviews
create table if not exists public.pending_reviews (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz null
);

-- moderation_logs
create table if not exists public.moderation_logs (
  id bigserial primary key,
  action text not null,
  actor_role text not null check (actor_role in ('moderator','admin')),
  question_id uuid null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- qr_tokens (productionizing Phase 1)
create table if not exists public.qr_tokens (
  id uuid primary key default gen_random_uuid(),
  hash text unique not null,
  role text not null check (role in ('viewer','moderator','admin')),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  used_at timestamptz null
);

-- sessions (optional)
create table if not exists public.sessions (
  jti text primary key,
  role text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz null
);

-- indexes
create index if not exists idx_questions_created_at on public.questions(created_at desc);
create index if not exists idx_questions_archived_created on public.questions(archived, created_at desc);

create index if not exists idx_likes_question_created on public.likes(question_id, created_at);
create index if not exists idx_likes_source_jti on public.likes(source_jti);
create index if not exists idx_likes_source_ip_hash on public.likes(source_ip_hash);

create index if not exists idx_qr_tokens_hash on public.qr_tokens(hash);
create index if not exists idx_qr_tokens_expires_at on public.qr_tokens(expires_at);
