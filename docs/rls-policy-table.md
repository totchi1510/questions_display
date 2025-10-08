# RLS Policy (Spec)

## 基本方針
- フロントは匿名（public anon）で読み取り中心
- 書き込みはサーバーアクション経由（サービスロールでRLSをバイパス）
- RLSは「匿名読み取り可テーブル」と「サーバー専用テーブル」を分離

## テーブル別方針（例）
- questions: SELECT allow anon / INSERT・UPDATE・DELETE はサーバーのみ
- archive_questions: SELECT allow anon / 書き込みはサーバーのみ
- likes: サーバーのみ（将来匿名投稿にする場合は再検討）
- pending_reviews, moderation_logs, qr_tokens, sessions: サーバーのみ

## SQLイメージ（抜粋）
    -- 読み取り可テーブル
    alter table public.questions enable row level security;
    create policy anon_read_questions
      on public.questions
      for select
      to anon
      using (true);

    -- サーバー専用テーブル（匿名ポリシー無し = デフォルトdeny）
    alter table public.moderation_logs enable row level security;
    -- ポリシー未付与 → anonは拒否、サービスロールはキーによりバイパス

## 運用メモ
- DDLは必ずマイグレーション（supabase/migrations）で管理
- 重要インデックス例: qr_tokens(hash), qr_tokens(expires_at)
- 監査: moderation_logs にサーバーアクションの操作を残す
