# Moderation Flow (Phase 3-1)

目的
- 健全な運用のため、投稿を自動/手動で審査可能にする。
- 監査ログを残し、可観測性と説明責任を担保する。

判定フロー（案）
- NGスコア or ルール一致で「保留」に入れる（`pending_reviews`）。
- 48h以内に `approve` or `reject`。未処理は自動処理ポリシー（要相談）。
- 本削除時も `moderation_logs` にメタを残す。

通知（開発段階の最小）
- Slack Incoming Webhook へ `moderation-alert` チャンネル通知。
- 環境変数: `SLACK_MODERATION_WEBHOOK_URL`（Vercel/GitHub Secrets）。

テーブル利用
- `questions`: 投稿の一次置き場。軽微なNGは直接投稿も可。
- `pending_reviews`: 審査待ちキュー。`reason`, `status` を管理。
- `moderation_logs`: 監査ログ（`action`, `actor_role`, `details`）。

実装メモ（MVP）
- サーバーアクション/Route Handlerで投稿受付。
- まずはダミー判定（長文/禁止語）で保留に振り分け。
- 保留投入/公開/却下などの操作時に `moderation_logs` を insert。
- 将来: AI 判定は `judge(content) -> { score, reasons }` のIFで差し替え可能に。

