# Access Flow (QR → Cookie)

## 目的
- ログイン不要で、QR経由のワンショット認証を簡素に構築
- 付与する権限は 'viewer' / 'moderator' / 'admin'

## トークンとクッキー
- トークン: QRに埋め込む不透明文字列（本番はDBでハッシュ照合）
- 本ドキュメントでは開発用のデモトークンを採用
  - 'demo-viewer' → role=viewer
  - 'demo-moderator' → role=moderator
  - 'demo-admin' → role=admin
- Cookie名: 'qd_session'
- Cookieには { role, exp, jti } を署名付きトークンとして保存

## フロー概要
1. ユーザーがQRを読み取り、/auth/qr?token=... へアクセス
2. サーバーはトークンを検証し（本ドキュメントではデモマッピング）、セッションクッキーを発行
3. / へリダイレクト
4. サーバーコンポーネントでクッキーから役割を読み取り、UIを出し分け

## Cookieポリシー
- httpOnly, secure, sameSite=Lax, path=/
- 期限はデフォルト7日（デモ）
- 署名鍵 SESSION_SECRET を .env.local に設定することで改ざん防止
  - 例: SESSION_SECRET="a3cfe9c6b9e14c27b6d0b5f25ab2f67e"
  - 32文字以上のランダム文字列推奨

## 本番移行時の変更点
- トークンはDBテーブル 'qr_tokens'（ハッシュ保存）で照合
- /auth/qr はDBで hash / role / expires_at / revoked_at を検査
- Cookie内容は最小限（role/jti/exp）。必要に応じてスコープID等を付与
- レート制限・メトリクス収集・監査ログ追加
