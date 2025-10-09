# 週次運用チェックリスト

- **目的**: 週次でサービス健全性を確認し、小さな問題を早期に検知する。

## 事前準備
- Vercel / Supabase / Slack の管理権限を持つこと。
- 最新のデプロイ状況と既知のインシデント有無を Slack で確認。

## 実施項目
1. **メトリクス確認**
   - Vercel Analytics: p95 レイテンシ、エラー率。
   - Supabase: DB エラーログ、`pending_reviews` 件数。
2. **保留 48h 超チェック**
   - `/admin/review?stale=1` で対象がないか確認。
   - あれば moderator/admin で優先対応。
3. **Slack 通知確認**
   - `postSlackModeration` の watchdog ping が 24h 以内に届いているか。
   - システムアラートの見逃しがないか。
4. **バックログ整理**
   - 未対応インシデント、改善要望を Issue に転記。

## 結果の記録
- Slack `#system-alert` にスレッドで「週次チェック完了」を投稿。
- 気づき / 対応が必要な点は Notion / Issue Tracker に登録。

