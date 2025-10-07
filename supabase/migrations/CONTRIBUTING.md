# Migrations & Review

## 命名
- `YYYYMMDDHHMM__kebab-title.sql`

## チェックリスト
- `supabase db lint` が通ること
- `npm run build` が通ること
- 機密情報を含めないこと
- RLS（Row-Level Security）を意識した設計

## レビュー手順
1. PR 作成前にローカルで `supabase db lint`
2. CIが通過すればマージ可
