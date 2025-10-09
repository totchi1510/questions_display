# Rate Limit (Phase 3-2)

目的
- 荒らし対策として、投稿頻度をセッション/IPで抑制する。

基本方針（案）
- 50件/日/セッション（`jti`）
- 100件/日/IP（`meta_ip_hash`）
- JST基準で日次リセット。

実装候補
- Vercel Middleware（Edge）で計測/ブロック。
- Supabase Edge Functionsで計測/ブロック（DBアクセスと相性が良い）。

必要なデータ
- セッション: `qd_session` の `jti` を投稿時に参照。
- IPハッシュ: 生IPは保存せずハッシュ化して`questions.meta_ip_hash`へ（現状はプレースホルダ）。

運用メモ
- 初期はログのみ収集→しきい値/誤検知の調整後に強制ブロックへ切替。
- 違反時も `moderation_logs` にイベントを残すと監査が容易。

