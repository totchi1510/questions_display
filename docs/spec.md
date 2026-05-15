# Spec — Questions Display

このドキュメントは現時点の決定事項を集約した source of truth。
個別の仕様詳細は他の `docs/*.md` を参照する。

ステータスタグ:
- ✅ 実装済（仕様確定）
- 🟡 仕様確定・未実装
- 🔴 仕様未確定（要検討）

---

## 1. 目的・利用シーン

### 目的
通りがかりにディスプレイを見た人が問いを目にして、周りの人とその問いについて会話を深める。
自分もみんなと考えたい問いを投稿する流れを作る。

### 利用シーン
- **掲示板（物理ディスプレイ）**
  - 学内の通路や共有空間に設置された電子ディスプレイに、サイトのスクリーンショットを表示
  - 運営が定期的にスクショを更新する運用（ライブ反映ではない）
  - 通りがかった人が問いに触れ、隣の人と会話を始める
- **個人アクセス（スマホ / PC）**
  - URL でサイトにアクセス可能
  - 主用途は **問いの投稿** と **ディスプレイで見たビューの確認**
  - リッチな閲覧体験は二次

---

## 2. アクセスモデル ✅

匿名 + スタッフ認証の 2 層構成:

### 匿名（通行人・投稿者）
- 認証なし。`/`, `/board`, `/archive/*`, `/ask`, `/like` は誰でもアクセス可
- `/ask/submit` 時に IP ハッシュベースでレート制限（100 件/日/IP、JST 基準）
- いいね dedup も IP ハッシュベース

### スタッフ（moderator / admin）
- **Supabase Auth** + **マジックリンク**でログイン
- `staff_roles(user_id, role)` テーブルで auth ユーザー → role を紐付け
- `/login` でメール入力 → マジックリンク受信 → クリック → `/auth/callback` → セッション cookie 発行
- 以降は `lib/staff.ts` の `getStaffRole()` がスタッフかどうかを判定
- `/admin/*` 系ルートは `getStaffRole()` でゲート

### スタッフの追加（運用）
1. Supabase Dashboard → Authentication → Users → "Invite a user" でメール招待（Disable signups 設定でも可能）
2. 招待された人がメール内リンクから初回ログイン
3. Dashboard → SQL Editor で:
   ```sql
   insert into public.staff_roles (user_id, role)
   values ((select id from auth.users where email = 'new-staff@example.com'), 'moderator');
   ```

### 初回 admin のブートストラップ
最初の管理者だけはまだ `staff_roles` に誰も居ない状態から始めるので:
1. Supabase Auth 設定で一時的に signups を有効化（または Dashboard から手動でユーザー作成）
2. `/login` から自分のメールで magic link → ログイン
3. SQL Editor で自分の user_id を `staff_roles` に admin として挿入
4. Auth 設定を Disable signups に戻す

---

## 3. データモデル

詳細: [schema.md](./schema.md) / 実DDL: `supabase/migrations/20251008000000_init_schema.sql` ✅

### テーブル一覧（全て ✅ DDL 適用済）
- `questions` — 問い本体（`published` フラグあり）
- `archive_questions` — 月次アーカイブのスナップショット
- `likes` — いいね
- `pending_reviews` — モデレーション待ち
- `moderation_logs` — 監査ログ（`actor_role` は `'anon' | 'moderator' | 'admin'`）
- `staff_roles` — Supabase Auth ユーザーと role の紐付け

### 削除済み
- `qr_tokens`（QR トークン体系を廃止）
- `sessions`（カスタム cookie 廃止）

### 追加提案 🟡
- `questions.published boolean not null default false`
  - 公開可否を 1 カラムで判定できるようにする
  - `evaluateContent` が `publish` → 即 `true`、`queue` → `false`
  - `pending_reviews` を `approve` で `true` に更新
  - `/board` のクエリが `published=true && archived=false` の単純フィルタで済む

### RLS ✅
詳細: [rls-policy-table.md](./rls-policy-table.md)
- `questions`、`archive_questions` のみ匿名 SELECT 許可
- それ以外は deny-by-default（サーバから service role でアクセス）

---

## 4. ルート・画面

詳細: [routes.md](./routes.md)（旧仕様、要更新）

| Path | 用途 | 状態 |
|---|---|---|
| `/` | 個人アクセス時のトップ。投稿導線がメイン | ✅ 実装、🟡 設計見直し予定 |
| `/board` | 掲示板スクショ撮影用ビュー | 🟡 新規実装 |
| `/ask` | 投稿フォーム | ✅ |
| `/ask/submit` | 投稿サブミット（サーバ） | ✅ |
| `/archive` | 月別アーカイブのインデックス | 🟡 未実装 |
| `/archive/[YYYY-MM]` | 指定月のアーカイブ | 🟡 未実装 |
| `/admin/review` | モデレーション審査 | ✅ |
| `/admin/logs` | 監査ログ | ✅ |
| `/login` | マジックリンク送信フォーム | ✅ |
| `/auth/callback` | マジックリンクの code → セッション交換 | ✅ |
| `/logout` | Supabase signOut + cookie クリア | ✅ |

---

## 5. 投稿フロー ✅

実装: `src/app/ask/submit/route.ts`

### レート制限 ✅
詳細: [rate-limit.md](./rate-limit.md)（注: jti ベースのセッション制限は廃止済み）
- IP（ハッシュ化）: 100 件/日
- JST 0:00 リセット
- 超過時は `?error=rate` でリダイレクト + Slack 通知

### コンテンツ評価 ✅
実装: `src/lib/moderation.ts`
- 280 文字超 → `queue`
- 禁止語 (`spam`, `abuse`) → `queue`
- それ以外 → `publish`
- 将来: AI / LLM ベースの `judge(content) -> { score, reasons }` 🔴

### 通知 ✅
- Slack Webhook（`SLACK_MODERATION_WEBHOOK_URL`）に publish / queue / 各レビュー結果を投稿

---

## 6. モデレーション運用 ✅

詳細: [moderation-flow.md](./moderation-flow.md)

- `/admin/review` で `approve` / `reject` / `delete` / `restore`
  - `reject` は `questions.archived=true` に（ソフト削除）
  - `delete` は物理削除（直前のスナップショットを `moderation_logs.details` に保存）
- 48h 超で「要対応」フィルタ可能（`?stale=1`）
- 全操作は `moderation_logs` に記録
- 🟡 `approve` 時に `questions.published=true` を立てる処理を追加（上記スキーマ提案と連動）

---

## 7. 表示ロジック (`/board`) ✅

### レイアウト
- 16:9 横長
- masonry（問い文長に応じた可変サイズ）
- ヒーロー（大きな Q）/ 投稿ボタン / 「?」マーク / 日付 は **全て排除**
- ヘッダー: 左上に「Questions Display」、中央に「問い」、右上に「2025年10月」のような月スタンプ
- 右下隅: 小さな QR コード + 「問いを投稿する」キャプション
- タイル仕様: 白背景、角丸 32px、細い黒枠、薄い黄色がかったソフトシャドウ
- 配色: 白〜クリーム黄 (#FFF7D6) のグラデ + アクセント #FAD55A + 黒文字

### フィルタ
- `published=true AND archived=false`
- かつ **当月のみ** （`created_at >= JST 今月の初日 00:00`）

### 並び
- `likes_count desc, created_at desc`
- いいね機能未実装の間は全件タイ → 実質新着順で動く

### 件数
- 12〜18 件（実装で詰める）

### 月境界の挙動（月次ロールオーバー）🟡
- JST 月初を境に `/board` の表示は当月分のみに切り替わる
- 前月分は `archive_questions` にスナップショット保存（モデレーションの後追い変更を凍結するため）
- `/archive/[YYYY-MM]` は `archive_questions` を参照
- 実装手段は cron / Edge Function / 手動どれでも可。MVP では月初に admin が手動でロールオーバージョブを叩く運用でも十分

---

## 8. 個人ビュー (`/`) ✅

### 方針（確定）
- `/board` と **同じ masonry レイアウト** で問いを表示
- 上部に「問いを投稿する」ボタン（CTA）を載せる
- 目的: 掲示板で見た景色とスマホで開いた画面を同じに見せ、「掲示板 → スマホ → 投稿」を切れ目なく繋ぐ

### 削除する要素
- ヒーロー（大きな Q）([src/app/page.tsx:180-182](../src/app/page.tsx#L180-L182))
- 「制作の背景」セクション ([src/app/page.tsx:215-258](../src/app/page.tsx#L215-L258))
- 常時表示の月リスト（右サイドバー）([src/app/page.tsx:162-168](../src/app/page.tsx#L162-L168))

### アーカイブ導線
- フッター付近に **「過去の問いを見る」リンク 1 本** を置く
- 押すと月別インデックス（`/archive`）へ → そこから `/archive/[YYYY-MM]` へ降りる

### ロール / 管理リンクの表示制御
- **viewer / 未ログイン**: ロールバッジも `review` / `logs` リンクも表示しない（通行人にとってノイズなので）
- **moderator / admin**: ロールバッジ + 自分の権限に対応する管理リンクを表示
- `logout` リンクはログイン中のみ表示（現状維持）
- デモトークンリンクは `ENABLE_DEMO_TOKENS=true` のときのみ（現状維持）

---

## 9. 運用

### Slack ✅
- 環境変数 `SLACK_MODERATION_WEBHOOK_URL`
- queue / approve / reject / delete / restore / rate limit を通知

### SLO / 監視 🔴
詳細: [slo-alerts.md](./slo-alerts.md)
- p95 > 2.0s / エラー率 > 5% / DB 失敗 3 回 の閾値（仕様のみ、実装無し）

### Runbook ✅（書類のみ）
- `runbooks/weekly.md` / `monthly.md` / `emergency.md`

### スクショ撮影フロー 🔴
- 誰が、どの頻度で、どのデバイス（解像度）で `/board` を撮るか
- 撮ったスクショをディスプレイにどう転送するか
- 月の切り替え時にどう振る舞うか

---

## 10. 実装ステータス一覧

| 項目 | 状態 |
|---|---|
| Supabase Auth（マジックリンク）+ `staff_roles` | ✅ |
| DB スキーマ初期化 + RLS | ✅ |
| `questions.published` カラム追加 | ✅ |
| 投稿フロー（`/ask` + `/ask/submit`、匿名対応） | ✅ |
| レート制限（IP ベース） | ✅ |
| モデレーション評価（ヒューリスティック） | ✅ |
| 管理画面 `/admin/review` / `/admin/logs` | ✅ |
| Slack 通知 | ✅ |
| `/board`（スクショ用ビュー） | ✅ |
| いいね機能（UI + API） | ✅ |
| `/archive` インデックス | ✅ |
| `/archive/[YYYY-MM]` | ✅ |
| 月次ロールオーバー（`archive_questions` 退避） | ✅ |
| 個人ビュー (`/`) の再設計 | ✅ |
| スクショ撮影運用フロー | 🔴 |
| SLO / 監視の実装 | 🔴 |
| AI モデレーション差し替え | 🔴 |

---

## 11. 優先度順 実装タスク

直近の価値（ディスプレイ運用の MVP）から逆算した順序:

1. **`questions.published` カラム追加 + 投稿/承認フロー連動** 🟡
   マイグレーション 1 本＋`/ask/submit` と `/admin/review/approve` の小修正。`/board` のフィルタが綺麗になる前提。

2. **`/board` ルート実装** 🟡
   masonry レイアウト、`published=true && archived=false`、`likes_count desc, created_at desc` 並び、ヘッダー月スタンプ + QR コード焼き込み。スクショ運用の心臓。

3. **個人ビュー (`/`) の実装** 🟡
   `/board` と同じ masonry に「問いを投稿する」CTA を載せる構成。現在のヒーローと「制作の背景」セクションは削除。月リスト・ロール表示の扱いはここで決める。

4. **いいね機能（UI + API + `likes_count` インクリメント）** 🟡
   `/board` の並びを意味あるものにする。投稿者の体験（自分の問いに反応が付く）も向上。

5. **月次ロールオーバー + `/archive` / `/archive/[YYYY-MM]` 実装** 🟡
   月初に当月分を `archive_questions` にスナップショット退避。`/archive` で月一覧、`/archive/[YYYY-MM]` で個別月を表示。個人ビューのフッターから「過去の問いを見る」リンクで導線を繋ぐ。

6. **スクショ撮影の運用フロー文書化** 🔴
   誰がどの頻度で何の解像度で撮るか。月境界の運用も。

7. **`qr_tokens` 本番化 + `/admin/qr`** 🟡
   学内に QR を配る前にここを固める。

8. **SLO / 監視の実装** 🔴
   学内運用の規模なら後回しでも可。
