# 監視 SLO とアラート方針（フェーズ 4-1）

- **目的**: 本番運用時にユーザー影響を即座に検知し、一次対応を確実に行う。
- **対象環境**: Vercel（Preview/Production）、Supabase（Database、Auth、Storage）。

## SLO / KPI

- **レスポンス p95**: 2.0s 以内（Next.js edge/app routes）。
  - 逸脱基準: 10 分平均で 2.0s を超えた状態が 3 回連続。
- **HTTP エラー率**: 5% 未満（5xx + app エラー）。
  - 逸脱基準: 5 分平均で 5% を超過。
- **投稿成功率**: 98% 以上（`/ask/submit` で queue/publish 以外のリダイレクトが発生しない）。
- **モデレーション SLA**: `pending_reviews` の 48h 超過件数 = 0。
- **Slack Webhook 正常性**: テスト ping が 24h 以内に成功していること。

## データ取得方法

- **Vercel Analytics**
  - p95 レイテンシ / エラー率をダッシュボードでモニタ。
  - `VERCEL_PROJECT_PRODUCTION_URL` でメトリクスを確認。
- **Supabase**
  - Database logs: `supabase logs tail --project <ref>` でステータス確認。
  - Scheduled query で `pending_reviews` の 48h 超件数を算出。
- **Slack 正常性**
  - 1 日 1 回 `postSlackModeration('watchdog ping')` を cron (Vercel Scheduler など) で送信。

## アラートのトリガーと通知先

- Slack チャンネル: `#system-alert`
- 通知元:
  - Vercel → Slack (Integrations)
  - Supabase → Slack (Log drain / Alert)
  - アプリ内 `postSlackModeration`
- トリガー条件例:
  1. p95 >= 2.0s が 10 分以上継続 → Vercel Alert
  2. HTTP エラー率 >= 5% が 5 分以上継続 → Vercel Alert
  3. `/ask/submit` で `error=server` が 3 分以内に 5 回以上 → Supabase Edge Function で集計し Slack 投稿
  4. `pending_reviews` で 48h 超過件数 > 0 → Supabase 定期ジョブで Slack 投稿
  5. Slack ping が 24h 以上なし → Watchdog から自動アラート

## 初動対応フロー

1. Slack 受信者はアラートを確認し、Runbook（`runbooks/*.md`）に従って対応。
2. Vercel Dashboard → Functions/Logs で直近のエラー原因を調査。
3. Supabase Dashboard → SQL Editor / Logs で DB エラーを確認。
4. エラーがアプリ起因の場合はロールバック or hotfix を判断。
5. 事象と対応を `#system-alert` にスレッドで記録。

## 定期レビュー

- 週次: Runbook 週次点検（SLO 状況、保留 48h をレビュー）。
- 月次: モニタリング設定の更新、閾値再評価。
- 失敗事例のふりかえりを Notion/Issue に残し、改善チケットを作成。

