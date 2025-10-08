
# Question Display 開発ステップ一覧（Vercel対応・セーブ位置付き）

## 🧭 フェーズ0：土台づくり（再現性＋Vercel展開）

### 0-1 プロジェクト雛形 & 設定

* **目的**：ローカルとVercelで同一環境を再現可能にする
* **やること**：

  * Next.js 雛形作成（App Router構成）
  * Supabase プロジェクト接続
  * `.env.local.example` + `.env.vercel.example` 整備
  * `vercel.json` の雛形追加（リダイレクト・環境変数の明示）
* **セーブ位置**：`v0.1.0-init`

  * 保存物：`README`, `.env.local.example`, `.env.vercel.example`, `vercel.json`
  * 確認：

    * ローカル (`npm run dev`) でトップページが表示される
    * Vercel Preview Deploy が成功
  * ロールバック：初期雛形まで戻せる状態

### 0-2 DBマイグレーション運用ルール作成

* **目的**：DB変更をコードベースで一元管理
* **やること**：

  * `supabase/migrations/` ディレクトリ作成
  * 命名規則とレビュー手順を `CONTRIBUTING.md` に明記
  * Vercelデプロイ前に `supabase db push` → CIで検証
* **セーブ位置**：`v0.2.0-migrations-scaffold`

  * 保存物：`CONTRIBUTING.md`
  * 確認：空マイグレーションでCI通過確認

---

## 🔑 フェーズ1：アクセスモデル（QR → Cookie管理）

### 1-1 役割・フロー定義（仕様のみ）

* **目的**：ログイン不要かつQRで権限を分離
* **やること**：

  * QRトークン（viewer / moderator / admin）仕様化
  * 有効期限・失効ロジックを文書化
  * Cookie保存方針（`httpOnly` / `secure` / domain指定）
* **セーブ位置**：`v1.0.0-access-spec`

  * 保存物：`docs/access-flow.md`（シーケンス図あり）
  * 確認：仕様がVercelドメイン環境に適合していること

### 1-2 RLS方針（仕様のみ）

* **目的**：SupabaseのRLSを正しく構成
* **やること**：

  * テーブル単位で SELECT / INSERT / UPDATE の可否表作成
  * `auth.uid()` 不使用で匿名制を維持
* **セーブ位置**：`v1.1.0-rls-spec`

  * 保存物：`docs/rls-policy-table.md`
  * 確認：匿名＋QR制御が矛盾なく成立

---

## 💾 フェーズ2：公開データ面（閲覧〜アーカイブ）

### 2-1 スキーマ合意（仕様のみ）

* **目的**：MVPに必要なテーブル定義を固定化
* **やること**：

  * `questions / archive_questions / likes / pending_reviews / moderation_logs / qr_tokens / sessions`
  * ER図と型定義（`types/supabase.ts`）整備
* **セーブ位置**：`v2.0.0-schema-spec`

  * 保存物：`docs/schema.md`
  * 確認：Supabase Studio上で構造一致

### 2-2 ルーティング合意（仕様のみ）

* **目的**：URL構造とSEO方針を明確化
* **やること**：

  * `/`, `/ask`, `/archive/[YYYY-MM]`, `/admin/review`, `/admin/qr`, `/admin/logs`
  * Vercel Dynamic Route最適化
  * `generateStaticParams` と `revalidate` ポリシー検討
* **セーブ位置**：`v2.1.0-route-spec`

  * 保存物：`docs/routes.md`
  * 確認：ビルド後のVercel Previewでルート確認

---

## 🧩 フェーズ3：投稿とモデレーション

### 3-1 投稿規約とNG判定フロー

* **目的**：健全な運用のための判定ロジック策定
* **やること**：

  * NGスコア → 保留 → 48h対応ルール
  * Slack Webhookで通知（#moderation-alert）
  * 本文削除時の監査メタ保持
* **セーブ位置**：`v3.0.0-posting-moderation-spec`

  * 保存物：`docs/moderation-flow.md`
  * 確認：テキスト削除処理をVercel Serverlessで実行可能

### 3-2 レート制限ルール

* **目的**：荒らし対策・投稿集中制御
* **やること**：

  * Supabase Edge Function or Middlewareで実装想定
  * 50件/日（セッション）＋100件/日（IP）制限
  * JST基準リセット
* **セーブ位置**：`v3.1.0-rate-limit-spec`

  * 保存物：`docs/rate-limit.md`
  * 確認：Vercel Functionsログで動作確認

---

## ⚙️ フェーズ4：運用・監視（Vercel含む）

### 4-1 監視SLOと発報条件

* **目的**：エラー・遅延検知の自動化
* **やること**：

  * p95 > 2.0s / エラー率 > 5% / DB失敗3回
  * Slack通知：#system-alert
  * Vercel Analytics + Supabase Logs 監視連携
* **セーブ位置**：`v4.0.0-observability-spec`

  * 保存物：`docs/slo-alerts.md`
  * 確認：エラー検知時の通知動作確認

### 4-2 定例運用・権限移譲

* **目的**：学内での運用継続を容易に
* **やること**：

  * 週次／月次レビュー手順
  * QR再発行・緊急失効対応
  * 権限更新ログの保存
* **セーブ位置**：`v4.1.0-ops-runbook`

  * 保存物：`runbooks/weekly.md`, `monthly.md`, `emergency.md`
  * 確認：各runbookがVercel上の構成と一致

---

## 🖼 フェーズ5：UI仕様（Vercel Previewベース）

### 5-1 画面仕様（ワイヤーのみ）

* **目的**：MVPのUIを早期固定しPreviewで共有
* **やること**：

  * ワイヤー図（Figma or Excalidraw）作成
  * Empty状態・投稿後の反映仕様記載
  * キーボード操作対応・アクセシビリティ指針
  * Vercel Previewでデザインレビュー
* **セーブ位置**：`v5.0.0-ui-wireframes`

  * 保存物：`docs/wireframes/`, `docs/ui-states.md`

---

## 🤖 フェーズ6：将来拡張準備

### 6-1 AIモデレーションインタフェース定義

* **目的**：AI判定ロジック差し替えを容易に
* **やること**：

  * `judge(content) -> {score, reasons}` IF仕様化
  * Vercel Edge Functionsで動作検証
  * ログ項目：`score`, `model`, `version`
* **セーブ位置**：`v6.0.0-aimod-interface`

  * 保存物：`docs/interfaces/moderation.md`

---

## 📌 共通チェックリスト

* **Artifact**：ドキュメント・図・テンプレを全て `docs/` に格納
* **Review**：開発者＋admin 2名レビュー必須
* **Tag命名**：`vX.Y.Z-label` 形式
* **Evidence**：Vercel Preview URL＋スクショをPRに添付

---
