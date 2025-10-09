# レート制限（フェーズ 3-2）

目的: JST（日付境界 00:00 JST）を基準とした 1 日あたりの投稿回数を、セッション単位と IP 単位で制限し、濫用を防止する。

- ポリシー
  - セッションごと（`jti`）に 1 日 50 件まで
  - IP ごと（ハッシュ化した IP）に 1 日 100 件まで
  - 日付境界は JST。00:00 JST にリセット

- データモデル
  - `questions.meta_ip_hash`: text（null 可）
  - `moderation_logs.details.jti`: セッション単位の活動カウントに利用
  - 参考（いいね機能など）: `likes.source_jti`, `likes.source_ip_hash`

- IP のハッシュ化
  - サーバー側のみで、IP + ソルトの一方向 SHA-256 を使用
  - 生の IP は保存しない（ハッシュのみ保存）

- 実施場所
  - MVP: 投稿ルートハンドラ（サーバー）で実装
  - 目標: Middleware または Edge Function に移行
    - service role key はサーバー専用。Edge Functions は許容

- 集計ウィンドウ（JST）
  - 当日の JST に対する `[startUtc, endUtc)` を算出
  - `gte('created_at', startUtc).lt('created_at', endUtc)` で件数を取得

- 応答
  - 閾値超過時は `?error=rate` で元画面へリダイレクト
  - `moderation_logs` に記録し、必要に応じて Slack 通知

- 可観測性
  - 閾値超過時に `SLACK_MODERATION_WEBHOOK_URL` へ通知（任意）
  - Vercel Functions のログと Supabase のクエリログで観測
