# Schema Spec (Phase 2)

目的: MVPに必要なデータ構造を固定化し、後続の実装・RLS設定・マイグレーション作成を容易にする。

## 対象テーブル（MVP）
- questions
  - id: uuid (pk, default gen_random_uuid())
  - content: text (not null)
  - created_at: timestamptz (default now())
  - likes_count: int (default 0, not null)
  - archived: boolean (default false)
  - archived_at: timestamptz (nullable)
  - meta_ip_hash: text (nullable) — レート制限/重複検出用（ハッシュ）

- archive_questions
  - id: uuid (pk)
  - content: text (not null)
  - created_at: timestamptz (not null)
  - archived_at: timestamptz (not null)
  - likes_count: int (not null)

- likes
  - id: uuid (pk, default gen_random_uuid())
  - question_id: uuid (fk → questions.id, on delete cascade)
  - created_at: timestamptz (default now())
  - source_jti: text (nullable) — セッションJTIで粗い重複抑止
  - source_ip_hash: text (nullable)

- pending_reviews
  - id: uuid (pk, default gen_random_uuid())
  - question_id: uuid (fk → questions.id)
  - reason: text (not null)
  - created_at: timestamptz (default now())
  - status: text check in ('pending','approved','rejected') default 'pending'
  - reviewed_at: timestamptz (nullable)

- moderation_logs
  - id: bigserial (pk)
  - action: text not null -- e.g. 'approve','reject','delete','restore'
  - actor_role: text not null -- 'moderator'|'admin'
  - question_id: uuid (nullable)
  - details: jsonb default '{}'::jsonb
  - created_at: timestamptz default now()

- qr_tokens（将来の本番化用・Phase1デモ置換）
  - id: uuid (pk, default gen_random_uuid())
  - hash: text unique not null -- tokenのハッシュ
  - role: text not null check in ('viewer','moderator','admin')
  - expires_at: timestamptz not null
  - revoked_at: timestamptz (nullable)
  - created_at: timestamptz default now()
  - used_at: timestamptz (nullable) -- 単回利用にする場合

- sessions（任意・監査強化時）
  - jti: text primary key
  - role: text not null
  - created_at: timestamptz default now()
  - last_seen_at: timestamptz (nullable)

## インデックス例
- questions: (created_at desc), (archived, created_at desc)
- likes: (question_id, created_at), (source_jti), (source_ip_hash)
- qr_tokens: (hash), (expires_at)

## 初期マイグレーション方針
- 既存のプレースホルダ `supabase/migrations/00000000000000_init.sql` は残し、
  新規で `YYYYMMDDHHMMSS_init_schema.sql` を追加して上記DDLを実装
- RLSはPhase 2-2で別ファイルにて付与（読むテーブルのみselect許可）

## 型とアプリ連携
- 将来的に `types/supabase.ts` を生成（型安全にselect/insert）
- 現段階はアプリで必要最小限の型（Questionなど）を手書きで運用開始

