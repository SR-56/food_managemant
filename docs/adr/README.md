# ADR一覧

| # | タイトル | ステータス | 決定の要点 |
|---|---------|-----------|-----------|
| [0001](0001-adopt-adr.md) | ADRによる意思決定記録の運用採用 | Accepted | MADRフォーマットを採用。AI駆動開発における設計判断のWHYを記録する |
| [0002](0002-mvp-recipe-copypaste-and-shopping-list-logic.md) | MVP仕様見直し - 食材コピペ登録と買い物リスト計算ロジック | Accepted | Claude APIでテキスト解析＋マスタ照合を1プロンプトで実施。買い物サイクルは直近の買い物日〜次回前日。デフォルト買い物日は土曜 |
| [0003](0003-hosting.md) | ホスティング・環境構成 | Accepted | Vercel（Next.js）＋ Supabase 2プロジェクト構成。ローカルはSupabase CLI、Preview/ProductionでSupabaseを分離 |
| [0004](0004-branch-and-release-strategy.md) | ブランチ戦略・リリース運用 | Accepted | GitHub Flow（main=Production）。Conventional Commits＋gh release create でバージョン管理。マージはMerge commit |
| [0005](0005-code-structure-before-backend.md) | バックエンド接続前のコード構造整理方針 | Accepted | Next.js Route Groupsで`(marketing)/`・`(app)/`に分離。`auth/callback/`はOAuthコールバック専用 |
| [0006](0006-database-selection.md) | データベース選定 | Accepted | Supabaseを採用。Google OAuth・RLS・Next.js SDKがすべて標準対応で、MVP無料枠内に収まる唯一の選択肢 |
