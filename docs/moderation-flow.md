# モデレーションフロー（フェーズ 3-1）

目的: NG 判定 → キュー投入 → 48 時間の取り扱い、Slack 通知、監査メタデータの保持を定義する。

- 対象範囲
  - ユーザー投稿の質問本文（`questions` テーブル）
  - 既存の管理画面レビュー UI と `pending_reviews` キューを補完

- 判断フロー
  - 投稿内容を評価し、アクションと理由を決定
    - アクション `publish`: `questions` に直接挿入
    - アクション `queue`: `questions` に挿入後、`pending_reviews(status: 'pending')` を追加
  - キュー/審査の各イベントで Slack 通知
  - 48 時間経過で自動削除はしない（MVP）。管理画面の「要対応」リストに浮上させる

- NG 判定（MVP）
  - ヒューリスティック: 文字数 > 280 ならキュー
  - 禁止語の素朴な一致（例: `['spam','abuse']`）
  - 将来: ML/LLM による `judge(content) -> { score, reasons }` へ置き換え可能に

- テーブル/フィールド
  - `questions(id, content, created_at, likes_count, archived, archived_at, meta_ip_hash)`
  - `pending_reviews(id, question_id, reason, status, created_at, reviewed_at)`
    - `status in ('pending','approved','rejected')`
  - `moderation_logs(id, action, actor_role, question_id, details, created_at)`
    - `action in ('queue','approve','reject','delete','restore','publish')`
    - `details` は `{ reason, jti, reviewer?, notes? }` を保持

- Slack
  - 環境変数 `SLACK_MODERATION_WEBHOOK_URL` を使用
  - キュー投入: "Queued for moderation" として `{ question_id, role, jti }` を添付
  - 審査決定: "Approved" / "Rejected" / "Deleted" に `{ question_id, reviewer, notes }` を添付

- 48 時間の取り扱い
  - 管理リストの推奨フィルタ: `status='pending' AND now()-created_at > interval '48 hours'`
  - 自動削除は行わず、可視化のみ（MVP）

- 物理削除と監査
  - 質問の物理削除時は、削除前のスナップショットを `details` に含めて `moderation_logs` に記録
  - 復旧が必要な場合は `archive_questions` への退避も検討

- 実行場所
  - 現状は Route Handler から呼び出すサーバー側関数
  - 将来的には Edge Function 化してロジックの独立・バージョニングを容易にする
