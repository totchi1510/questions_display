# 問いのディスプレイ (Questions Display)

学内ディスプレイに、学生・教職員が投稿した「問い」をホワイトボード上の付箋のように掲示する Web システムです。**岡山大学生協のディスプレイで実運用中**（制作: DS部）。

通りがかった人が問いを目にして立ち止まり、隣の人と話す。気になった人は QR を読み取って自分の問いを貼る。その循環をつくることを目的にしています。

```
ディスプレイ ──QR──▶ /ask（投稿）──▶ モデレータ承認 ──▶ /board（掲示）──▶ 画像で書き出してディスプレイへ
```

## できること

### 投稿する人（ログイン不要・誰でも）

- **`/ask`** — 問いを書き、16:9 のキャンバス上で**貼る場所をドラッグして決め**、付箋の大きさを選んで投稿します。既存の付箋を最大 3 つタップすると「その問いから影響を受けた」というリンクが引かれます。
- **`/`** — 掲示板と同じ配置をスマホで閲覧。付箋タップで拡大、🤔（考えている）でリアクション。自分が投稿した付箋だけは、あとから**ドラッグで移動・サイズ変更**できます。
- **`/me`** — 自分の投稿の掲載状態（確認中 / 掲示中 / 非公開）と反応数。
- **`/graph`** — 問い同士のつながりを力学配置グラフで俯瞰。
- **`/archive`** — 月ごとの過去の問い。

投稿者の識別は、初回投稿時に発行する httpOnly cookie（`qd_author`）のみです。アカウント登録はありません。

### 運営（スタッフ）

- **`/board`** / **`/board/free`** — ディスプレイ用のサイネージ表示（テーマあり / テーマなし）。ズームで構図を整えて **1920×1080 の PNG として書き出し**、ディスプレイに表示します。
- **`/admin/review`** — 承認待ちの一覧。**投稿は全件、承認するまで掲示されません**。Approve / Reject（非公開化）/ Delete（物理削除）/ Restore。
- **`/admin/themes`** — 「今月のテーマ」の作成・切り替え。
- **`/admin/logs`** — 全操作の監査ログ。
- 各操作は Slack にも通知されます（Webhook 設定時）。

スタッフは Google OAuth でログインし、`staff_roles` テーブルに登録されたユーザーのみが管理画面に入れます。

> **未実装**: 掲示された問いに対して**他者が文章で回答する機能はありません**。QR の遷移先は回答フォームではなく投稿フォーム `/ask` です。画像投稿にも未対応です。

## 技術スタック

| 区分 | 内容 |
|---|---|
| フレームワーク | Next.js 15（App Router / Server Components、Turbopack）+ React 19 + TypeScript 5 |
| スタイル | Tailwind CSS v4 |
| DB / 認証 | Supabase（PostgreSQL + Auth）。RLS 有効、書き込みは service role を持つサーバー経由のみ |
| 描画 | React Flow（付箋の配置）、react-force-graph-2d（グラフ）、Three.js（トップの 3D「Q」）、html-to-image（PNG 書き出し） |
| ホスティング | Vercel |
| 通知 | Slack Incoming Webhook |

## セットアップ

必要要件: Node.js 20 / npm 9 以上、Supabase プロジェクト。

```bash
npm install
cp .env.local.example .env.local   # 値を埋める
npm run dev                        # http://localhost:3000
```

### 環境変数

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名キー（読み取り用） |
| `NEXT_PUBLIC_SITE_URL` | 公開 URL。**QR コードの遷移先**と OAuth コールバックの生成に使用 |
| `SUPABASE_SERVICE_ROLE_KEY` | **サーバー専用**。投稿・承認・リアクション・アーカイブ退避に必須 |
| `SUPABASE_PROJECT_REF` | Supabase CLI 用 |
| `IP_HASH_SALT` | IP ハッシュのソルト（32文字以上のランダム文字列）|
| `SLACK_MODERATION_WEBHOOK_URL` | 任意。モデレーション通知 |

> ⚠️ `IP_HASH_SALT` は**本番環境でも必ず設定してください**。未設定だと全員のハッシュが同じ固定値になり、投稿制限が「全体で 1 日 100 件」になるうえ、**🤔 が 1 つの問いにつき全体で 1 回しか押せなくなります**。

### DB マイグレーション

DDL はすべて `supabase/migrations/` で管理します（命名規則は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照）。

```bash
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase db push
```

> ⚠️ CI の `db-push` ジョブは `main` ブランチの push で走る設定ですが、**このリポジトリの既定ブランチは `master`** です。そのため master への push では自動適用されません。**マイグレーションは手動で適用してください。**

### スタッフ権限の付与

1. Supabase Dashboard → Authentication → Providers → Google を有効化し、"Allow new users to sign up" は **OFF**（招待制）
2. 対象ユーザーが一度 `/login` から Google ログイン（`auth.users` に行ができる）
3. SQL Editor で権限を付与:

```sql
insert into public.staff_roles (user_id, role)
values ((select id from auth.users where email = 'staff@example.com'), 'moderator');
```

`role` は `moderator` または `admin`。前月分のアーカイブ退避は `admin` のみ実行できます。

## 運用

| 作業 | 手順 |
|---|---|
| ディスプレイの更新 | `/board` を開く → ズーム/パンで構図を調整 → 「画像で保存 (1920×1080)」→ 出力した PNG をディスプレイに表示 |
| 投稿の承認 | `/admin/review` で Approve。承認するまで掲示されません（`?stale=1` で 48 時間超のみ表示）|
| 月替わり | `/admin/themes` で新しいテーマをアクティブ化。`/admin/review` の「前月をアーカイブに退避」で前月分を `archive_questions` にスナップショット |

掲示板に出るのは **当月（JST）・承認済み・非アーカイブ** の問いだけです。ディスプレイはライブ反映ではなく、書き出した画像を差し替える運用です。

印刷（Ctrl+P）は非対応です。ブラウザが `@page` のサイズ指定を無視して縦横比が崩れるため、PNG 書き出しが唯一の正式な経路です。

### 動作確認用のダミーデータ

[`supabase/seeds/dummy_questions.sql`](./supabase/seeds/dummy_questions.sql) を Supabase の SQL Editor に貼り付けて実行すると、アクティブテーマ 1 件・テーマありの問い 8 件・テーマなしの問い 8 件・問い同士のリンク 7 本が入ります。`author_token = 'seed-dummy'` の行を消してから入れ直すので、何度実行しても重複しません。撤去は下記の 1 行です。

```sql
delete from public.questions where author_token = 'seed-dummy';
```

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー（Turbopack） |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番ビルドを起動 |
| `npm run lint` | ESLint |

CI（`.github/workflows/ci.yml`）では lint / build / マイグレーションのファイル名検査 / `db push` が走ります。テストコードはまだありません。

## ドキュメント

- [`docs/spec.md`](./docs/spec.md) — 仕様と実装ステータスの source of truth
- [`docs/schema.md`](./docs/schema.md) — データモデル
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — マイグレーション運用ルール
- [`runbooks/`](./runbooks/) — 週次 / 月次 / 障害時の手順

`docs/routes.md`・`docs/access-flow.md`・`docs/rate-limit.md` は廃止済みの QR トークン方式を前提とした旧仕様です。現行仕様は `docs/spec.md` を参照してください。
