# Question Display

Next.js 15 + Supabase を使って質問一覧を表示するためのシンプルなアプリです。トップページでは Supabase への接続確認と、Next.js のスターターレイアウトが表示されます。環境変数を設定すると、Supabase の `questions` テーブルへの接続結果がバッジで表示されるため、デプロイ前の動作確認に便利です。

## セットアップ

### 必要要件
- Node.js 18 以上（推奨: LTS）
- npm 9 以上
- Supabase プロジェクト（ローカル開発では Supabase CLI でも可）

### 環境変数
1. `.env.local.example` をコピーして `.env.local` を作成
2. 取得した Supabase プロジェクトの値を設定
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

### ローカル実行
```bash
npm install
npm run dev
```
ブラウザで `http://localhost:3000` を開くと、環境変数の設定状況と Supabase 接続テストの結果を確認できます。

## Supabase との連携
- `supabase/config.toml` は Supabase CLI 用の設定ファイルです。
- Supabase をローカルで起動する場合は、[Supabase CLI](https://supabase.com/docs/guides/cli) をインストールし、以下を実行します。
  ```bash
  supabase start
  ```
  初期テーブルが存在しなくても接続テストは失敗扱いにはなりません（`error (テーブル未作成でもここは想定内)` と表示されます）。

## 利用可能なスクリプト
| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動（Turbopack 使用） |
| `npm run build` | 本番ビルドを作成 |
| `npm run start` | 本番ビルドを起動 |
| `npm run lint` | ESLint を実行 |

## デプロイ
Vercel などのホスティングにデプロイする際は、環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を本番用に設定してください。GitHub にプッシュすると、Vercel の自動デプロイ（Preview Deploy）で動作確認ができます。
